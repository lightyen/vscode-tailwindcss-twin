import { Connection, MarkupContent, MarkupKind } from "vscode-languageserver"
import chroma from "chroma-js"
import { serializeError } from "serialize-error"
import produce from "immer"

import { state } from "~/tailwind"
import { canHover } from "./canHover"
import { documents } from "~/server"
import { findClasses, SelectionInfo } from "~/find"
import { Pattern } from "~/patterns"

export const hover: Parameters<Connection["onHover"]>[0] = async params => {
	try {
		if (!state) {
			return null
		}
		const result = canHover(params)
		if (!result) {
			return null
		}
		const document = documents.get(params.textDocument.uri)
		const { match, pattern, offset } = result
		let { base, index } = result
		base = base + match[0]
		index = offset - base
		const { handleBrackets, handleImportant } = pattern
		const classes = findClasses({
			classes: match[2],
			index,
			separator: state.separator,
			handleBrackets,
			handleImportant,
			greedy: false,
			hover: true,
		})
		if (!classes.selection.selected) {
			return null
		}
		if (pattern.kind === "twinTheme") {
			const value = state.getTheme(match[2].split("."))
			const range = {
				start: document.positionAt(base),
				end: document.positionAt(base + match[2].length),
			}
			if (typeof value === "string") {
				if (value === "transparent") {
					return {
						range,
						contents: {
							kind: MarkupKind.Markdown,
							value: "transparent",
						},
					}
				}
				try {
					chroma(value)
					return {
						range,
						contents: {
							kind: MarkupKind.Markdown,
							value,
						},
					}
				} catch {
					return {
						range,
						contents: {
							kind: MarkupKind.Markdown,
							value: `"${value}"`,
						},
					}
				}
			} else if (value instanceof Array) {
				return {
					range,
					contents: {
						kind: MarkupKind.Markdown,
						value: value.join(),
					},
				}
			}
			return null
		} else {
			return {
				range: {
					start: document.positionAt(base + classes.selection.selected[0]),
					end: document.positionAt(base + classes.selection.selected[1]),
				},
				contents: await getHoverContents({
					pattern,
					selection: classes.selection,
				}),
			}
		}
	} catch (err) {
		console.log(serializeError(err))
		return null
	}
}

export default hover

async function getHoverContents({
	pattern,
	selection,
}: {
	pattern: Pattern
	selection: SelectionInfo
}): Promise<MarkupContent> {
	const { kind } = pattern
	const { selected, important, variants } = selection
	const [, , value] = selected

	const twin = kind === "twin"
	const inputVariants = variants.map(([, , v]) => v)
	const common = inputVariants.filter(v => state.classnames.isCommonVariant(twin, v))
	const notCommon = inputVariants.filter(v => !common.includes(v))

	if (state.darkMode === "class") {
		const f = notCommon.findIndex(v => state.classnames.isDark(twin, v))
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
					kind: MarkupKind.Markdown,
					value: ["```scss", `.content::${common[i]} {`, '  content: "";', "}", "```"].join("\n"),
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
				kind: MarkupKind.Markdown,
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
				kind: MarkupKind.Markdown,
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
							// hack
							if (twin && n === "light") {
								n = "dark"
							}
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
			if (variantValues.length === 0) {
				if (d.__pseudo.length > 0) {
					filterContext.push(false)
					continue
				}
				// FIXME: not work in this scene: darMode === 'class'
				// if (d.__scope) {
				// 	filterContext.push(false)
				// 	continue
				// }
			}
			if (d.__scope) {
				const scopes = d.__scope.split(" ")
				filterContext.push(
					scopes.every(s => {
						// hack
						if (twin && s === ".dark" && variantValues.includes(".light")) {
							d.__scope = d.__scope.replace(".dark", ".light")
							return true
						}
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
	meta.filter((_, i) => filterContext[i])
		.map(rule => {
			const selector = value + rule.__pseudo.join("")
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
		kind: MarkupKind.Markdown,
		value: [
			"```scss",
			...Array.from(blocks).map(([selector, contents]) => {
				return `${selector} {\n${contents.map(c => `  ${c}`).join("\n")}\n}`
			}),
			"```",
		].join("\n"),
	}
}
