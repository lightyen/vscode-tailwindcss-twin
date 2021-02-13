import * as lsp from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import chroma from "chroma-js"
import { serializeError } from "serialize-error"
import produce from "immer"
import { Tailwind } from "~/tailwind"
import { InitOptions } from "~/twLanguageService"
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
	options: InitOptions,
): lsp.Hover {
	try {
		const result = canMatch(document, position, true)
		if (!result) {
			return null
		}
		const { token, kind } = result
		if (kind === PatternKind.TwinTheme) {
			const result = parseThemeValue(token.text)
			if (result.errors.length > 0) {
				return null
			}

			const value = state.getTheme(result.keys())
			const range = {
				start: document.positionAt(token.start),
				end: document.positionAt(token.end),
			}
			if (typeof value === "string") {
				if (value === "transparent") {
					return {
						range,
						contents: {
							kind: lsp.MarkupKind.Markdown,
							value: "transparent",
						},
					}
				}
				try {
					chroma(value)
					return {
						range,
						contents: {
							kind: lsp.MarkupKind.Markdown,
							value,
						},
					}
				} catch {
					return {
						range,
						contents: {
							kind: lsp.MarkupKind.Markdown,
							value,
						},
					}
				}
			} else if (value instanceof Array) {
				return {
					range,
					contents: {
						kind: lsp.MarkupKind.Markdown,
						value: value.join(", "),
					},
				}
			} else if (value) {
				return {
					range,
					contents: {
						kind: lsp.MarkupKind.Markdown,
						value: "object",
					},
				}
			}
			return null
		} else {
			const selection = hoverElement({
				input: token.text,
				position: document.offsetAt(position) - token.start,
				separator: state.separator,
			})
			if (!selection.token) {
				return null
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

				if (options.references) {
					const entry = cssDataManager.getProperty(key)
					if (entry) {
						values.unshift(getEntryDescription(entry, true).value + "\n\n---\n")
					}
				}

				return {
					range,
					contents: {
						kind: lsp.MarkupKind.Markdown,
						value: values.join("\n"),
					},
				}
			}

			const contents = getHoverContents({
				kind,
				selection,
				state,
			})

			if (!contents) {
				return null
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
				contents.value = `${title}\n---\n\n` + contents.value
			}

			return {
				range,
				contents,
			}
		}
	} catch (err) {
		console.log(serializeError(err))
	}
	return null
}

function getHoverContents({
	kind,
	selection,
	state,
}: {
	kind: PatternKind
	selection: ReturnType<typeof hoverElement>
	state: Tailwind
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
			return null
		}
		if (value === "container") {
			return {
				kind: lsp.MarkupKind.Markdown,
				value: "",
			}
		}
		if (value === "content") {
			const i = common.findIndex(v => v === "before" || v === "after")
			if (i !== -1) {
				return {
					kind: lsp.MarkupKind.Markdown,
					value: ["```scss", `::${common[i]} {`, '  content: "";', "}", "```"].join("\n"),
				}
			}
			return null
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
		return null
	}

	const data = state.classnames.getClassNameRule(inputVariants, twin, value)
	if (!data) {
		return null
	}

	if (!(data instanceof Array)) {
		if (data.__pseudo) {
			return {
				kind: lsp.MarkupKind.Markdown,
				value: ["```scss", data.__pseudo.map(v => `.${value}${v}`).join("\n"), "```"].join("\n"),
			}
		}
		return null
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
				return `${selector} {\n${contents.map(c => `  ${c}`).join("\n")}\n}`
			}),
			"```",
		].join("\n"),
	}
}
