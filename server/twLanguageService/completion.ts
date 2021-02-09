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
import { findThemeValueKeys } from "~/common/parseThemeValue"

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
					item.textEdit = lsp.TextEdit.replace(
						{
							start: document.positionAt(start + a),
							end: document.positionAt(start + b + state.separator.length),
						},
						item.label,
					)
				}
			}
		} else if (selection.token.kind === TokenKind.Unknown) {
			if (position === a) {
				for (let i = 0; i < variantItems.length; i++) {
					const item = variantItems[i]
					item.textEdit = lsp.TextEdit.insert(document.positionAt(start + a), item.label)
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
		if (selection.token.kind === TokenKind.Variant && position > a) {
			classNameItems.length = 0
		}
		if (position === a || (value.slice(0, 1) === "-" && position === a + 1 && position < b)) {
			for (let i = 0; i < classNameItems.length; i++) {
				const item = classNameItems[i]
				item.textEdit = lsp.TextEdit.insert(document.positionAt(start + a), item.label + " ")
			}
		} else if (position <= b && selection.token.kind === TokenKind.ClassName) {
			for (let i = 0; i < classNameItems.length; i++) {
				const item = classNameItems[i]
				item.textEdit = lsp.TextEdit.replace(
					{
						start: document.positionAt(start + a),
						end: document.positionAt(start + b),
					},
					item.label,
				)
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
	const { keys, hit } = findThemeValueKeys(text, position)

	if (!hit && keys.length > 0) {
		return { isIncomplete: false, items: [] }
	}

	const value = state.getTheme(keys)
	if (typeof value !== "object") {
		return { isIncomplete: false, items: [] }
	}

	const candidates = Object.keys(value)

	function formatCandidates(label: string) {
		let prefix = ""
		if (label.slice(0, 1) === "-") {
			prefix = "~~~"
			label = label.slice(1)
		}
		try {
			const val = eval(label)
			if (typeof val !== "number") {
				return prefix + label
			}
			return prefix + Math.abs(val).toFixed(3).padStart(7, "0")
		} catch {
			return prefix + label
		}
	}

	return {
		isIncomplete: false,
		items: candidates.map(label => {
			const item: lsp.CompletionItem = {
				label,
				sortText: formatCandidates(label),
			}
			const value = state.getTheme([...keys, label])
			const isObject = typeof value === "object"
			item.data = {
				kind: PatternKind.TwinTheme,
				type: "other",
			}
			if (isObject) {
				item.kind = lsp.CompletionItemKind.Module
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

			let newText = label
			if (label.match(/[-./]/)) {
				newText = `[${label}]`
			} else if (keys.length > 0) {
				newText = `.${label}`
			}

			item.filterText = newText
			if (keys.length > 0) {
				item.filterText = hit?.[2][0] + item.filterText
			}

			if (hit) {
				const [a, b] = hit
				item.textEdit = lsp.TextEdit.replace(
					{
						start: document.positionAt(offset + a),
						end: document.positionAt(offset + b),
					},
					newText,
				)
			} else {
				item.textEdit = lsp.TextEdit.insert(document.positionAt(index), newText)
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
		sortText: (label.slice(0, 1) === "-" ? "~~~" : "~~") + formatLabel(label),
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
