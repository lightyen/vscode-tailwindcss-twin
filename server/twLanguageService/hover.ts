import * as lsp from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import chroma from "chroma-js"
import { serializeError } from "serialize-error"
import produce from "immer"
import { Tailwind } from "~/tailwind"
import { InitOptions } from "~/twLanguageService"
import { canMatch, PatternKind } from "~/common/ast"
import camel2kebab from "~/common/camel2kebab"
import { TokenKind } from "~/common/types"
import findClasses from "~/common/findClasses"
import parseThemeValue from "~/common/parseThemeValue"

export default function hover(
	document: TextDocument,
	position: lsp.Position,
	state: Tailwind,
	_: InitOptions,
): lsp.Hover {
	try {
		const result = canMatch(document, position, true)
		if (!result) {
			return null
		}
		const { token, kind } = result
		if (kind === PatternKind.TwinTheme) {
			const result = parseThemeValue(token[2])
			if (result.errors.length > 0) {
				return null
			}

			const value = state.getTheme(result.keys())
			const range = {
				start: document.positionAt(token[0]),
				end: document.positionAt(token[1]),
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
							value: `"${value}"`,
						},
					}
				}
			} else if (value instanceof Array) {
				return {
					range,
					contents: {
						kind: lsp.MarkupKind.Markdown,
						value: value.join(),
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
			const selection = findClasses({
				input: token[2],
				position: document.offsetAt(position) - token[0],
				separator: state.separator,
			})
			if (!selection.token) {
				return null
			}
			if (selection.token.kind === TokenKind.CssProperty) {
				const [start, end] = selection.token.token
				const key = selection.token.key[2]
				const value = selection.token.value[2]
				const important = selection.important
				return {
					range: {
						start: document.positionAt(token[0] + start),
						end: document.positionAt(token[0] + end),
					},
					contents: {
						kind: lsp.MarkupKind.Markdown,
						value: [
							"```scss",
							"& {",
							`\t${camel2kebab(key)}: ${value}${important ? " !important" : ""};`,
							"}",
							"```",
						].join("\n"),
					},
				}
			}
			if (kind === PatternKind.TwinCssProperty) {
				if (selection.token.kind === TokenKind.Unknown || selection.token.kind === TokenKind.ClassName) {
					return null
				}
			}
			const [start, end] = selection.token.token
			return {
				range: {
					start: document.positionAt(token[0] + start),
					end: document.positionAt(token[0] + end),
				},
				contents: getHoverContents({
					kind,
					selection,
					state,
				}),
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
	selection: ReturnType<typeof findClasses>
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
		if (value === "group" || value === "container") {
			return null
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
			return {
				kind: lsp.MarkupKind.Markdown,
				value: ["```scss", ...text, "```"].join("\n"),
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
