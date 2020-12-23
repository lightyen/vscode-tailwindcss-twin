// dash word issue: https://github.com/microsoft/language-server-protocol/issues/937

import * as lsp from "vscode-languageserver"

import { CSSRuleItem, state } from "~/tailwind"
import { Pattern, PatternKind } from "~/patterns"

import canComplete from "./canComplete"
export { completionResolve } from "./resolve"
import { serializeError } from "serialize-error"
import { findClasses } from "~/find"
import { Token } from "~/typings"
import chroma from "chroma-js"
import { CompletionItem } from "vscode-languageserver"

export const completion: Parameters<lsp.Connection["onCompletion"]>[0] = async params => {
	try {
		if (!state) {
			return null
		}

		const result = canComplete(params)
		if (!result) {
			return null
		}

		const { kind } = result.pattern
		if (kind === "twinTheme") {
			return twinThemeCompletion(result.index, result.match)
		} else {
			return classesCompletion(result.index, result.match, result.pattern)
		}
	} catch (err) {
		console.log(serializeError(err))
		return null
	}
}

function classesCompletion(index: number, match: Token, pattern: Pattern): lsp.CompletionList {
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

	const value = selection.selected?.[2]
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
					data: { type: "screen", data, value, variants, kind },
					command: {
						title: "",
						command: "editor.action.triggerSuggest",
					},
				}
			} else {
				return {
					label,
					sortText: state.classnames.isDark(twin, label) ? "*" + label : "~~~:" + label,
					kind: state.classnames.isDark(twin, label)
						? lsp.CompletionItemKind.Color
						: lsp.CompletionItemKind.Field,
					data: { type: "variant", data, value, variants, kind },
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
		.map(([label, data]) => getCompletionItem({ label, data, value, variants, kind }))

	if (twin && variants.some(v => v === "before" || v === "after")) {
		classesItems.push({
			label: "content",
			kind: lsp.CompletionItemKind.Constant,
			sortText: "~~content",
			data: { type: "class", data: null, value, variants, kind },
		})
	}

	return {
		isIncomplete: false,
		items: [...variantItems, ...classesItems],
	}
}

function twinThemeCompletion(index: number, match: Token): lsp.CompletionList {
	const [offset, , text] = match
	const inputChar = text[index - offset - 1]
	if (inputChar !== "." && text.indexOf(".") !== -1) {
		return null
	}
	if (text.indexOf("..") !== -1) {
		return null
	}

	const reg = /(\w+)\.(\s*)/g
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

	const value = state.getTheme(keys.join("."))
	if (typeof value !== "object") {
		return null
	}
	return {
		isIncomplete: true,
		items: Object.keys(value).map(label => {
			const item: CompletionItem = {
				label,
				sortText: formatDigital(label),
			}
			const value = state.getTheme([...keys, label].join("."))
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

function getCompletionItem({
	label,
	data,
	value,
	variants,
	kind,
}: {
	label: string
	data: CSSRuleItem | CSSRuleItem[]
	value: string
	variants: string[]
	kind: PatternKind
}): lsp.CompletionItem {
	const item: lsp.CompletionItem = {
		label,
		data: { type: "class", data, value, variants, kind },
		kind: lsp.CompletionItemKind.Constant,
		sortText: (label[0] === "-" ? "~~~" : "~~") + formatLabel(label),
	}

	const info = state.classnames.colors[label]
	if (!info) {
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
