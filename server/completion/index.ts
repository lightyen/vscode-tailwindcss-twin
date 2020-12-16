// dash word issue: https://github.com/microsoft/language-server-protocol/issues/937

import * as lsp from "vscode-languageserver"

import { CSSRuleItem, state } from "~/tailwind"
import {
	isDarkMode,
	hasDarkMode,
	getDarkMode,
	hasBreakingPoint,
	isCommonVariant,
	getVariants,
	getBreakingPoint,
	isVariant,
	getClassNames,
	getSeparator,
	getColors,
} from "~/common"
import { Pattern, PatternKind } from "~/patterns"

import canComplete from "./canComplete"
export { completionResolve } from "./resolve"
import { serializeError } from "serialize-error"
import { findClasses } from "~/find"
import { Token } from "~/typings"
import { dlv } from "~/tailwind/classnames"

interface _Payload {
	hasBreakingPoint: boolean
	hasDarkMode: boolean
	hasCommonVariant: boolean
}

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
			return twinThemeCompletion(result.index, result.match, result.pattern)
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
		separator: getSeparator(),
		handleBrackets,
		handleImportant,
	})

	if (selection.selected?.[2] === getSeparator()) {
		return null
	}

	const twin = kind === "twin"
	const variants = selection.variants.map(([, , v]) => v)
	if (!variants.every(v => isVariant(v, twin))) {
		return null
	}

	const value = selection.selected?.[2]
	const payload: _Payload = {
		hasBreakingPoint: hasBreakingPoint(variants),
		hasDarkMode: hasDarkMode(variants, twin),
		hasCommonVariant: variants.some(v => isCommonVariant(v, twin)),
	}

	const variantItems = Object.entries(getVariants(twin))
		.filter(([label]) => variantFilter({ twin, value, payload, variants, label }))
		.map<lsp.CompletionItem>(([label, data]) => {
			const bp = getBreakingPoint(label)
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
					sortText: isDarkMode(label, twin) ? "*" + label : "~~~:" + label,
					kind: isDarkMode(label, twin) ? lsp.CompletionItemKind.Color : lsp.CompletionItemKind.Field,
					data: { type: "variant", data, value, variants, kind },
					command: {
						title: "",
						command: "editor.action.triggerSuggest",
					},
				}
			}
		})
		.map(item => ({ ...item, label: item.label + getSeparator() }))

	// --------------------------------- //

	const classesItems = Object.entries(getClassNames(variants, twin))
		.filter(([label, info]) => {
			if (label === "group") {
				if (twin || payload.hasBreakingPoint) {
					return false
				}
				return true
			}
			if (label === "container") {
				if (twin && payload.hasBreakingPoint) {
					return false
				}
				return true
			}
			if (!(info instanceof Array)) {
				return false
			}
			return true
		})
		.map(([label, data]) => getCompletionItem({ label, data, value, variants, kind }))

	if (twin) {
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

function twinThemeCompletion(index: number, match: Token, pattern: Pattern): lsp.CompletionList {
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

	const target = dlv(state.config.theme, keys)
	if (typeof target !== "object") {
		return null
	}

	return {
		isIncomplete: false,
		items: Object.keys(target).map(label => ({
			label,
			sortText: formatDigital(label),
			kind: lsp.CompletionItemKind.Field,
			data: {
				kind: "twinTheme",
			},
		})),
	}
}

function variantFilter({
	twin,
	value,
	payload,
	variants,
	label,
}: {
	twin: boolean
	value: string
	payload: _Payload
	variants: string[]
	label: string
}) {
	if (twin) {
		if (variants.some(v => v === label)) {
			return false
		}
		if ((payload.hasDarkMode || payload.hasCommonVariant) && (getBreakingPoint(label) || isDarkMode(label, twin))) {
			return false
		}
		if (payload.hasBreakingPoint) {
			if (getBreakingPoint(label)) {
				return false
			}
		}
	} else {
		if (!getDarkMode() && isDarkMode(label, twin)) {
			return false
		}
		if (payload.hasCommonVariant && (getBreakingPoint(label) || isVariant(label, twin))) {
			return false
		}
		if (payload.hasDarkMode && (getBreakingPoint(label) || isDarkMode(label, twin))) {
			return false
		}
		if (payload.hasBreakingPoint) {
			if (getBreakingPoint(label)) return false
		}
	}
	return true
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

	const color = getColors()[label]
	if (!color) {
		return item
	}

	item.kind = lsp.CompletionItemKind.Color
	if (color == "currentColor") {
		item.documentation = "currentColor"
		item.data.type = "color"
		item.data.data = "currentColor"
		return item
	}

	if (color === "transparent") {
		item.documentation = { kind: lsp.MarkupKind.PlainText, value: "rgba(0, 0, 0, 0.0)" }
		item.data.type = "color"
		item.data.data = "transparent"
		return item
	}

	item.documentation = color
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
		const prefix = m[1]
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
