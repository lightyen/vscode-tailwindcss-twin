// dash word issue: https://github.com/microsoft/language-server-protocol/issues/937

import * as lsp from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import chroma from "chroma-js"
import { serializeError } from "serialize-error"
import type { CSSRuleItem } from "~/tailwind/classnames"
import type { InitOptions } from "~/twLanguageService"
import type { Tailwind } from "~/tailwind"
import { canMatch, PatternKind } from "~/common/ast"
import { TokenKind, Token } from "~/common/types"
import findClasses from "~/common/findClasses"
import parseThemeValue, { TwThemeElementKind } from "~/common/parseThemeValue"

export interface InnerData {
	type: "screen" | "utilities" | "variant" | "other"
	kind: PatternKind
	uri: string
	variants?: string[]
	data?: CSSRuleItem | CSSRuleItem[]
}

export default function completion(
	document: TextDocument,
	position: lsp.Position,
	state: Tailwind,
	options: InitOptions,
): lsp.CompletionList {
	try {
		const result = canMatch(document, position)
		if (!result) {
			return null
		}
		const index = document.offsetAt(position)
		const { kind, token } = result
		if (kind === PatternKind.TwinTheme) {
			const list = twinThemeCompletion(document, index, token, state)
			for (let i = 0; i < list.items.length; i++) {
				list.items[i].data.uri = document.uri
			}
			return list
		} else {
			const list = classesCompletion(document, index, token, kind, state, options)
			for (let i = 0; i < list.items.length; i++) {
				list.items[i].data.uri = document.uri
			}
			return list
		}
	} catch (err) {
		console.log(serializeError(err))
		return null
	}
}

function classesCompletion(
	document: TextDocument,
	index: number,
	match: Token,
	kind: PatternKind,
	state: Tailwind,
	options: InitOptions,
): lsp.CompletionList {
	const [start, , input] = match
	const position = index - start
	const selection = findClasses({ input, position, separator: state.separator, completion: true })
	const twin = kind === PatternKind.Twin || kind === PatternKind.TwinCssProperty
	const preferVariantWithParentheses = options.preferVariantWithParentheses
	const inputCharacter = input.slice(position - 1, position)
	const nextCharacter = input.slice(position, position + 1)

	if (selection.token?.kind === TokenKind.CssProperty) {
		const [a, b] = selection.token.token
		if (position > a && position < b) {
			return { isIncomplete: false, items: [] }
		}
	}

	// list variants
	const variants = selection.variants.map(([, , value]) => value)
	const variantFilter = state.classnames.getVariantFilter(variants, twin)
	let variantItems: lsp.CompletionItem[] = []

	if (!["-", ".", "/"].some(a => a === inputCharacter)) {
		variantItems = Object.entries(state.classnames.getVariants(twin))
			.filter(([label]) => variantFilter(label))
			.map<lsp.CompletionItem>(([label, data]) => {
				const bp = state.classnames.getBreakingPoint(label)
				if (bp) {
					return {
						label,
						sortText: bp.toString().padStart(5, " "),
						kind: lsp.CompletionItemKind.Module,
						data: { type: "screen", data, variants, kind },
						command: {
							title: "",
							command: "editor.action.triggerSuggest",
						},
					}
				} else {
					const f = state.classnames.isDarkLightMode(twin, label) || state.classnames.isMotionControl(label)
					return {
						label,
						// insertText: character !== state.separator ? label : label.slice(0, label.length - 1),
						sortText: f ? "*" + label : "~~~:" + label,
						kind: f ? lsp.CompletionItemKind.Color : lsp.CompletionItemKind.Field,
						data: { type: "variant", data, variants, kind },
						command: {
							title: "",
							command: "editor.action.triggerSuggest",
						},
					}
				}
			})
			.map(item => ({ ...item, label: item.label + state.separator }))
	}

	if (preferVariantWithParentheses) {
		if ((!selection.token && nextCharacter !== "(") || selection.token?.token[1] === position) {
			for (let i = 0; i < variantItems.length; i++) {
				const item = variantItems[i]
				item.insertTextFormat = lsp.InsertTextFormat.Snippet
				item.insertText = item.label + "($0)"
			}
		}
	}

	if (selection.token) {
		const [a, b] = selection.token.token
		if (selection.token.kind === TokenKind.Variant) {
			if (position > a) {
				// replace variant
				for (let i = 0; i < variantItems.length; i++) {
					const item = variantItems[i]
					item.textEdit = {
						range: {
							start: document.positionAt(start + a),
							end: document.positionAt(start + b + state.separator.length),
						},
						newText: item.label,
					}
				}
			}
		} else if (selection.token.kind === TokenKind.Unknown) {
			if (position === a) {
				// insert variant
				for (let i = 0; i < variantItems.length; i++) {
					const item = variantItems[i]
					item.textEdit = {
						range: {
							start: document.positionAt(start + a),
							end: document.positionAt(start + a + state.separator.length),
						},
						newText: item.label,
					}
				}
			} else {
				variantItems.length = 0
			}
		}
	}

	if (kind === PatternKind.TwinCssProperty) {
		return {
			isIncomplete: false,
			items: [...variantItems],
		}
	}

	// list className
	const classesFilter = state.classnames.getClassNameFilter(variants, twin)
	const classNameItems = Object.entries(state.classnames.getClassNames(variants, twin))
		.filter(classesFilter)
		.map(([label, data]) => createCompletionItem({ label, data, variants, kind, state }))
	if (twin) {
		if (variants.some(v => v === "before" || v === "after")) {
			classNameItems.push({
				label: "content",
				kind: lsp.CompletionItemKind.Constant,
				sortText: "~~content",
				data: { type: "utilities", data: null, variants, kind },
			})
		}
	}

	if (selection.token) {
		const [a, b, value] = selection.token.token
		if (selection.token.kind === TokenKind.ClassName) {
			if (position === a || (value.slice(0, 1) === "-" && position === a + 1 && position < b)) {
				// insert token
				for (let i = 0; i < classNameItems.length; i++) {
					const item = classNameItems[i]
					item.textEdit = {
						range: {
							start: document.positionAt(start + a),
							end: document.positionAt(start + a),
						},
						newText: item.label + " ",
					}
				}
			} else if (position <= b) {
				// replace token
				for (let i = 0; i < classNameItems.length; i++) {
					const item = classNameItems[i]
					item.textEdit = {
						range: {
							start: document.positionAt(start + a),
							end: document.positionAt(start + b),
						},
						newText: item.label,
					}
				}
			}
		}
	}

	return {
		isIncomplete: false,
		items: [...variantItems, ...classNameItems],
	}
}

function twinThemeCompletion(document: TextDocument, index: number, token: Token, state: Tailwind): lsp.CompletionList {
	const [offset, , text] = token
	const position = index - offset
	const result = parseThemeValue(text)
	const keys: string[] = []
	for (const { token } of result.blocks.filter(b => b.kind === TwThemeElementKind.Identifier)) {
		const [, b, val] = token
		if (position > b) {
			keys.push(val)
		}
	}

	const value = state.getTheme(keys)

	if (typeof value !== "object") {
		return { isIncomplete: false, items: [] }
	}

	const match = result.hit(position)

	return {
		isIncomplete: true,
		items: Object.keys(value).map(label => {
			const item: lsp.CompletionItem = {
				label,
				sortText: Number.isNaN(Number(label)) ? label : formatDigital(label),
			}
			const value = state.getTheme([...keys, label])
			const isObject = typeof value === "object"
			item.data = {
				kind: PatternKind.TwinTheme,
				type: "other",
			}
			if (isObject) {
				item.kind = lsp.CompletionItemKind.Module
				// item.command = {
				// 	title: "",
				// 	command: "editor.action.triggerSuggest",
				// }
			} else {
				if (typeof value === "string") {
					try {
						if (value === "transparent") {
							item.kind = lsp.CompletionItemKind.Color
							item.documentation = "rgba(0, 0, 0, 0.0)"
							item.data.type = "color"
							item.data.data = "transparent"
							return item
						}
						chroma(value)
						item.kind = lsp.CompletionItemKind.Color
						item.documentation = value
						item.data.type = "color"
					} catch {
						item.kind = lsp.CompletionItemKind.Constant
						item.documentation = value
						item.detail = label
					}
				} else if (value instanceof Array) {
					item.kind = lsp.CompletionItemKind.Field
					item.documentation = label
					item.detail = value.join("\n")
				}
			}

			if (/[-.]/.test(label)) {
				const offset = token[2].length - token[2].lastIndexOf(".")
				item.filterText = "." + label
				item.textEdit = {
					range: {
						start: document.positionAt(index - offset),
						end: document.positionAt(index),
					},
					newText: `[${label}]`,
				}
			}

			if (match) {
				item.textEdit = lsp.TextEdit.replace(
					{
						start: document.positionAt(offset + match[0]),
						end: document.positionAt(offset + match[1]),
					},
					label,
				)
			}

			return item
		}),
	}
}

function createCompletionItem({
	label,
	data,
	variants,
	kind,
	state,
}: {
	label: string
	data: CSSRuleItem | CSSRuleItem[]
	variants: string[]
	kind: PatternKind
	state: Tailwind
}): lsp.CompletionItem {
	const item: lsp.CompletionItem = {
		label,
		data: { type: "utilities", data, variants, kind },
		kind: lsp.CompletionItemKind.Constant,
		sortText: (label[0] === "-" ? "~~~" : "~~") + formatLabel(label),
	}

	const info = state.classnames.colors[label]
	if (!info) {
		return item
	}

	if (!(data instanceof Array)) {
		return item
	}

	if (data.length === 0 || data[0].__source === "components") {
		item.data.type = "components"
		return item
	}

	item.kind = lsp.CompletionItemKind.Color
	if (label.includes("current")) {
		item.documentation = "currentColor"
		item.data.type = "color"
		item.data.data = "currentColor"
		return item
	}

	if (label.includes("transparent")) {
		item.documentation = { kind: lsp.MarkupKind.PlainText, value: "rgba(0, 0, 0, 0.0)" }
		item.data.type = "color"
		item.data.data = "transparent"
		return item
	}

	item.documentation = info.backgroundColor || info.borderColor || info.color
	item.data.type = "color"
	return item
}

function formatLabel(label: string) {
	const reg = /((?:[\w-]+-)+)+([\d/.]+)/
	const m = label.match(reg)
	if (!m) {
		return label
	}
	try {
		const val = eval(m[2])
		if (typeof val !== "number") {
			return label
		}
		const prefix = m[1] + (/^[\d.]+$/.test(m[2]) ? "@" : "_")
		return prefix + val.toFixed(3).padStart(7, "0")
	} catch {
		return label
	}
}

function formatDigital(value: string) {
	const prefix = `${value.startsWith("-") ? "~" : ""}`
	try {
		const val = eval(value)
		if (typeof val !== "number") {
			return prefix + value
		}
		return prefix + Math.abs(val).toFixed(3).padStart(7, "0")
	} catch {
		return prefix + value
	}
}
