import * as lsp from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import { serializeError } from "serialize-error"
import produce from "immer"
import { Tailwind } from "~/tailwind"
import type { ServiceOptions } from "~/twLanguageService"
import { canMatch, PatternKind } from "~/common/ast"
import toKebab from "~/common/toKebab"
import * as tw from "~/common/twin"
import { hoverElement } from "~/common/findElement"
import parseThemeValue from "~/common/parseThemeValue"
import { cssDataManager, getEntryDescription } from "./cssData"
import { getReferenceLinks, getDescription } from "./referenceLink"

export default function hover(
	document: TextDocument,
	position: lsp.Position,
	state: Tailwind,
	options: ServiceOptions,
): lsp.Hover {
	try {
		const result = canMatch(document, position, true)
		if (!result) {
			return undefined
		}
		const { token, kind } = result
		if (kind === PatternKind.TwinTheme) {
			const range = {
				start: document.positionAt(token.start),
				end: document.positionAt(token.end),
			}
			return resolveThemeValue({ kind, range, token, state, options })
		} else {
			const selection = hoverElement({
				input: token.text,
				position: document.offsetAt(position) - token.start,
				separator: state.separator,
			})
			if (!selection.token) {
				return undefined
			}

			const { start, end, text } = selection.token.token
			const range = lsp.Range.create(
				document.positionAt(token.start + start),
				document.positionAt(token.start + end),
			)

			if (selection.token.kind === tw.TokenKind.CssProperty) {
				const key = toKebab(selection.token.key.text)
				const value = selection.token.value.text
				const important = selection.important

				const values = ["```scss", "& {", `\t${key}: ${value}${important ? " !important" : ""};`, "}", "```\n"]

				const entry = cssDataManager.getProperty(key)
				if (entry) {
					values.unshift(getEntryDescription(entry, true).value + "\n\n---\n")
				}

				return {
					range,
					contents: {
						kind: lsp.MarkupKind.Markdown,
						value: values.join("\n"),
					},
				}
			}

			if (selection.token.token.text === "container") {
				if (kind !== PatternKind.Twin) {
					return undefined
				}
				return resolveContainer({ kind, range, selection, state, options })
			}

			const markdown = getHoverMarkdown({
				kind,
				selection,
				state,
				options,
			})

			if (!markdown) {
				return undefined
			}

			let title = ""
			if (options.references) {
				const type = getDescription(text)
				if (type) {
					title = type + "\n"
				}

				const refs = getReferenceLinks(text)
				if (refs.length > 0) {
					title += "\n" + refs.map(ref => `[Reference](${ref.url}) `).join("\n") + "\n"
				}
			}

			if (title) {
				markdown.value = `${title}\n---\n\n` + markdown.value
			}

			return {
				range,
				contents: markdown,
			}
		}
	} catch (err) {
		console.log(serializeError(err))
	}
	return undefined
}

function getHoverMarkdown({
	kind,
	selection,
	state,
	options,
}: {
	kind: PatternKind
	selection: ReturnType<typeof hoverElement>
	state: Tailwind
	options: ServiceOptions
}): lsp.MarkupContent {
	const { important, variants } = selection
	const [, , value] = selection.token.token

	const twin = kind === PatternKind.Twin || kind === PatternKind.TwinCssProperty
	const inputVariants = variants.map(([, , v]) => v)
	const common = inputVariants.filter(v => state.classnames.isCommonVariant(twin, v))
	const notCommon = inputVariants.filter(v => !common.includes(v))

	if (state.config.darkMode === "class") {
		const f = notCommon.findIndex(v => state.classnames.isDarkLightMode(twin, v))
		if (f !== -1) {
			common.push(...notCommon.splice(f, 1))
		}
	}

	if (twin) {
		if (value === "group") {
			return undefined
		}
		if (value === "content") {
			const i = common.findIndex(v => v === "before" || v === "after")
			if (i !== -1 && kind === PatternKind.Twin) {
				return {
					kind: lsp.MarkupKind.Markdown,
					value: ["```scss", `::${common[i]} {`, '\tcontent: "";', "}", "```"].join("\n"),
				}
			}

			return undefined
		}
	}

	if (state.classnames.isVariant(value, twin)) {
		const data = state.classnames.getVariants(twin)[value]
		if (data) {
			const text: string[] = []
			if (data.length === 0) {
				text.push(value)
			} else {
				text.push(`${data.join(", ")}`)
			}

			const contents = ["```scss", ...text, "```"]
			return {
				kind: lsp.MarkupKind.Markdown,
				value: contents.join("\n"),
			}
		}

		return undefined
	}

	const data = state.classnames.getClassNameRule(inputVariants, twin, value)
	if (!data) {
		return undefined
	}

	if (!(data instanceof Array)) {
		if (data.__pseudo) {
			return {
				kind: lsp.MarkupKind.Markdown,
				value: ["```scss", data.__pseudo.map(v => `.${value}${v}`).join("\n"), "```"].join("\n"),
			}
		}

		return undefined
	}

	const __variants = state.classnames.getVariants(twin)
	const variantValues = common.flatMap(c => __variants[c])

	const filterContext: boolean[] = []
	const meta = produce(data, draft => {
		for (let i = 0; i < draft.length; i++) {
			const d = draft[i]
			if (
				!d.__context.every(context => {
					const e = Object.entries(__variants).find(([, values], index) => {
						return values.includes(context)
					})
					if (!e) {
						return false
					}
					return (
						notCommon.findIndex(n => {
							return n === e[0]
						}) !== -1
					)
				})
			) {
				filterContext.push(false)
				continue
			}
			if (d.__source === "components") {
				filterContext.push(true)
				continue
			}
			if (d.__scope) {
				const scopes = d.__scope.split(" ")
				filterContext.push(
					scopes.every(s => {
						return variantValues.includes(s)
					}),
				)
				continue
			}
			if (twin && common.every(c => state.classnames.isVariant(c, twin) && !state.classnames.baseVariants[c])) {
				if (d.__pseudo.length === 0) {
					d.__pseudo = variantValues // inject pseudoes
				}
				filterContext.push(true)
				continue
			}
			filterContext.push(variantValues.every(c => d.__pseudo.some(p => p === c)))
			continue
		}
	})

	const blocks: Map<string, string[]> = new Map()
	meta.filter((_, i) => twin || filterContext[i])
		.map(rule => {
			let selector = value
			if (rule.__source === "components") {
				selector = value + rule.__pseudo.join("")
			}
			const decls = Object.entries(rule.decls).flatMap(([prop, values]) =>
				values.map<[string, string]>(v => [prop, v]),
			)
			return { scope: rule.__scope ? rule.__scope + " " : "", selector, decls }
		})
		.map(c => {
			const selector = `${c.scope}.${c.selector.replace(/\//g, "\\/")}`
			if (!blocks.has(selector)) {
				blocks.set(selector, [])
			}
			blocks
				.get(selector)
				.push(...c.decls.map(([prop, value]) => `${prop}: ${value}${important ? " !important" : ""};`))
		})

	return {
		kind: lsp.MarkupKind.Markdown,
		value: [
			"```scss",
			...Array.from(blocks).map(([selector, contents]) => {
				return `${selector} {\n${contents.map(c => `\t${c}`).join("\n")}\n}`
			}),
			"```",
		].join("\n"),
	}
}

function resolveThemeValue({
	range,
	token,
	state,
}: {
	kind: PatternKind
	range: lsp.Range
	token: tw.Token
	state: Tailwind
	options: ServiceOptions
}): lsp.Hover {
	const result = parseThemeValue(token.text)
	if (result.errors.length > 0) {
		return undefined
	}

	const value = state.getTheme(result.keys())

	const markdown: lsp.MarkupContent = {
		kind: lsp.MarkupKind.Markdown,
		value: "",
	}

	if (typeof value === "string") {
		markdown.value = value
	} else if (value instanceof Array) {
		markdown.value = value.join(", ")
	} else if (value) {
		markdown.value = "object"
	}

	return {
		range,
		contents: markdown,
	}
}

function resolveContainer({
	kind,
	range,
	selection,
	state,
	options,
}: {
	kind: PatternKind
	range: lsp.Range
	selection: ReturnType<typeof hoverElement>
	state: Tailwind
	options: ServiceOptions
}): lsp.Hover {
	const contents: lsp.MarkupContent = {
		kind: lsp.MarkupKind.Markdown,
		value: "",
	}

	if (options.references) {
		contents.value = getDescription("container")
		const refs = getReferenceLinks("container")
		if (refs.length == 1) {
			contents.value += "\n" + `[Reference](${refs[0].url})`
		} else if (refs.length > 0) {
			contents.value += "\n" + refs.map((ref, i) => `[Reference${i}](${ref.url}) `).join("\n")
		}
		contents.value += "\n\n---\n\n"
	}

	const rules = state.classnames.getClassNameRule([], false, "container")
	const lines = []
	if (rules instanceof Array) {
		lines.push("\n```scss")
		for (const r of rules) {
			const hasContext = r.__context.length > 0
			lines.push(hasContext ? `${r.__context.join(" ")} {\n` + "\t.container {" : ".container {")
			for (const key in r.decls) {
				for (const value of r.decls[key]) {
					lines.push(hasContext ? `\t\t${key}: ${value};` : `\t${key}: ${value};`)
				}
			}
			if (hasContext) {
				lines.push(`\t}`)
			}
			lines.push(`}\n`)
		}
		lines.push("```\n")
	}

	contents.value += lines.join("\n")

	return {
		range,
		contents,
	}
}
