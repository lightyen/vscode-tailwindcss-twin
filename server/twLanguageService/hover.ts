import produce from "immer"
import { serializeError } from "serialize-error"
import * as lsp from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import { canMatch, PatternKind } from "~/common/ast"
import { hoverElement } from "~/common/findElement"
import parseThemeValue from "~/common/parseThemeValue"
import * as tw from "~/common/token"
import { Tailwind } from "~/tailwind"
import type { ServiceOptions } from "~/twLanguageService"
import { cssDataManager, getEntryDescription } from "./cssData"
import { getDescription, getReferenceLinks } from "./referenceLink"

export default function hover(
	document: TextDocument,
	position: lsp.Position,
	state: Tailwind,
	options: ServiceOptions,
): lsp.Hover | undefined {
	try {
		const result = canMatch(document, position, true, options.jsxPropImportChecking)
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
				const key = selection.token.key.toKebab()
				const value = selection.token.value.text
				const important = selection.important

				const values = [
					"```scss",
					"& {",
					`\t${key}: ${tw.formatCssValue(tw.removeComments(value))}${important ? " !important" : ""};`,
					"}",
					"```\n",
				]

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

			if (
				selection.token.kind === tw.TokenKind.ClassName &&
				!state.twin.isClassName(selection.token.token.text)
			) {
				return undefined
			}

			const keyword = text.slice(state.config.prefix.length)
			if (keyword === "container") {
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
				const type = getDescription(keyword)
				if (type) {
					title = type + "\n"
				}

				const refs = getReferenceLinks(keyword)
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
}): lsp.MarkupContent | undefined {
	const { important, variants } = selection
	const [, , value] = selection.token?.token ?? tw.createToken(0, 0, "")

	const inputVariants = variants.map(([, , v]) => v)
	const common = inputVariants.filter(v => state.twin.isCommonVariant(v))
	const notCommon = inputVariants.filter(v => !common.includes(v))

	if (state.config.darkMode === "class") {
		const f = notCommon.findIndex(v => state.twin.isDarkLightMode(v))
		if (f !== -1) {
			common.push(...notCommon.splice(f, 1))
		}
	}

	if (value === "group") {
		return undefined
	}

	if (selection.token?.kind === tw.TokenKind.Variant && state.twin.isVariant(value)) {
		const data = state.twin.variants.get(value)
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

	if (selection.token?.kind !== tw.TokenKind.ClassName) {
		return undefined
	}

	const data = state.twin.classnames.get(value)
	if (!data) {
		return undefined
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const variantValues = common.flatMap(key => state.twin.variants.get(key)!)

	const filterContext: boolean[] = []
	const meta = produce(data, draft => {
		for (let i = 0; i < draft.length; i++) {
			const d = draft[i]
			if (
				!d.context.every(context => {
					const e = state.twin.variants.find(([, values], index) => {
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
			if (d.source === "components") {
				filterContext.push(true)
				continue
			}
			if (common.every(c => state.twin.isVariant(c))) {
				if (d.pseudo.length === 0) {
					d.pseudo = variantValues // inject pseudoes
				}
				filterContext.push(true)
				continue
			}
			filterContext.push(variantValues.every(c => d.pseudo.some(p => p === c)))
			continue
		}
	})

	const blocks: Map<string, string[]> = new Map()
	meta.filter((_, i) => filterContext[i])
		.map(rule => {
			let selector = value
			if (rule.source === "components") {
				selector = value + rule.pseudo.join("")
			}
			const decls = Object.entries(rule.decls).flatMap(([prop, values]) =>
				values.map<[string, string]>(v => [prop, v]),
			)
			return { rest: rule.rest, selector, decls }
		})
		.map(c => {
			const selector = `.${c.selector.replace(/\//g, "\\/")}${c.rest}`
			if (!blocks.has(selector)) {
				blocks.set(selector, [])
			}
			blocks
				.get(selector)
				?.push(...c.decls.map(([prop, value]) => `${prop}: ${value}${important ? " !important" : ""};`))
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
}): lsp.Hover | undefined {
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
		markdown.value = `\`\`\`txt\n${value}\n\`\`\``
	} else if (value instanceof Array) {
		markdown.value = `\`\`\`txt\n${value.join(", ")}\n\`\`\``
	} else if (value) {
		markdown.value = `\`\`\`js\n${value.toString?.() ?? typeof value}\n\`\`\``
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

	const label_container = state.config.prefix + "container"
	const rules = state.twin.classnames.get(label_container)
	const lines: string[] = []
	if (rules instanceof Array) {
		lines.push("\n```scss")
		for (const r of rules) {
			const hasContext = r.context.length > 0
			lines.push(hasContext ? `${r.context.join(" ")} {\n` + `\t.${label_container} {` : `.${label_container} {`)
			for (const key in r.decls) {
				for (const value of r.decls[key]) {
					lines.push(
						hasContext
							? `\t\t${key}: ${value}${selection.important ? " !important" : ""};`
							: `\t${key}: ${value}${selection.important ? " !important" : ""};`,
					)
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
