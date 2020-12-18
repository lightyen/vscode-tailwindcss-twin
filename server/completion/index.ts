// dash word issue: https://github.com/microsoft/language-server-protocol/issues/937

import * as lsp from "vscode-languageserver"

import { CSSRuleItem, state } from "~/tailwind"
import { Pattern, PatternKind } from "~/patterns"

import canComplete from "./canComplete"
export { completionResolve } from "./resolve"
import { serializeError } from "serialize-error"
import { findClasses } from "~/find"
import { Token } from "~/typings"
import { dlv } from "~/tailwind/classnames"

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
					sortText: state.classnames.isDarkMode(label, twin) ? "*" + label : "~~~:" + label,
					kind: state.classnames.isDarkMode(label, twin)
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

	const color = state.classnames.colors[label]
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
