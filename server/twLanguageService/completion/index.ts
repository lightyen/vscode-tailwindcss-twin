// dash word issue: https://github.com/microsoft/language-server-protocol/issues/937

import * as lsp from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import chroma from "chroma-js"
import { serializeError } from "serialize-error"
import canComplete from "./canComplete"
import { findClasses } from "~/find"
import type { Token } from "~/typings"
import type { Pattern, PatternKind } from "~/patterns"
import type { CSSRuleItem } from "~/tailwind/classnames"
import type { InitOptions } from "~/twLanguageService"
import type { Tailwind } from "~/tailwind"

export { completionResolve } from "./resolve"

export interface InnerData {
	type: "screen" | "utilities" | "variant" | "other"
	kind: PatternKind
	uri: string
	variants?: string[]
	data?: CSSRuleItem | CSSRuleItem[]
}

export const completion = (
	document: TextDocument,
	position: lsp.Position,
	state: Tailwind,
	{ twin }: InitOptions,
): lsp.CompletionList => {
	try {
		const result = canComplete(document, position, twin)
		if (!result) {
			return null
		}

		const { kind } = result.pattern
		if (kind === "twinTheme") {
			const list = twinThemeCompletion(result.index, result.match, state)
			for (let i = 0; i < list.items.length; i++) {
				list.items[i].data.uri = document.uri
			}
			return list
		} else {
			const list = classesCompletion(result.index, result.match, result.pattern, state)
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

function classesCompletion(index: number, match: Token, pattern: Pattern, state: Tailwind): lsp.CompletionList {
	const [start, , classes] = match
	const { kind, handleBrackets, handleImportant } = pattern
	const { selection } = findClasses({
		classes,
		index: index - start,
		separator: state.separator,
		handleBrackets,
		handleImportant,
	})

	if (selection.selected?.[2] === state.separator) {
		return null
	}

	const twin = kind === "twin"
	const variants = selection.variants.map(([, , v]) => v)
	if (!variants.every(v => state.classnames.isVariant(v, twin))) {
		return null
	}

	const variantFilter = state.classnames.getVariantFilter(variants, twin)
	const variantItems = Object.entries(state.classnames.getVariants(twin))
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

	// --------------------------------- //

	const classesFilter = state.classnames.getClassNameFilter(variants, twin)
	const classesItems = Object.entries(state.classnames.getClassNames(variants, twin))
		.filter(classesFilter)
		.map(([label, data]) => createCompletionItem({ label, data, variants, kind, state }))

	if (twin) {
		if (variants.some(v => v === "before" || v === "after")) {
			classesItems.push({
				label: "content",
				kind: lsp.CompletionItemKind.Constant,
				sortText: "~~content",
				data: { type: "utilities", data: null, variants, kind },
			})
		}
	}

	return {
		isIncomplete: false,
		items: [...variantItems, ...classesItems],
	}
}

function twinThemeCompletion(index: number, match: Token, state: Tailwind): lsp.CompletionList {
	const [offset, , text] = match
	const inputChar = text[index - offset - 1]
	if (inputChar !== "." && text.indexOf(".") !== -1) {
		return null
	}
	if (text.indexOf("..") !== -1) {
		return null
	}

	const reg = /([^.]+)\./g
	const keys: string[] = []
	let m: RegExpExecArray
	while ((m = reg.exec(text))) {
		const [, key, space] = m
		if (space) {
			return null
		}
		if (index >= offset + m.index && index < offset + reg.lastIndex) {
			break
		}
		keys.push(key)
	}
	const value = state.getTheme(keys)
	if (typeof value !== "object") {
		return null
	}
	return {
		isIncomplete: true,
		items: Object.keys(value).map(label => {
			const item: lsp.CompletionItem = {
				label,
				sortText: Number.isNaN(Number(label)) ? label : formatDigital(label),
			}
			const value = state.getTheme([...keys, label])
			const isObject = typeof value === "object"
			if (isObject) {
				item.kind = lsp.CompletionItemKind.Module
				item.insertText = label + "."
				item.command = {
					title: "",
					command: "editor.action.triggerSuggest",
				}
				item.data = {
					kind: "twinTheme",
					type: "other",
				}
			} else {
				item.data = {
					kind: "twinTheme",
					type: "other",
				}
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
