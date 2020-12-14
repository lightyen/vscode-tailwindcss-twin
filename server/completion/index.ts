// dash word issue: https://github.com/microsoft/language-server-protocol/issues/937

import { Connection, CompletionItem, CompletionItemKind, MarkupKind } from "vscode-languageserver"

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
import { PatternKind } from "~/patterns"

import canComplete from "./canComplete"
export { completionResolve } from "./resolve"
import { serializeError } from "serialize-error"

interface _Payload {
	hasBreakingPoint: boolean
	hasDarkMode: boolean
	hasCommonVariant: boolean
}

export const completion: Parameters<Connection["onCompletion"]>[0] = async params => {
	try {
		if (!state) {
			return null
		}

		const result = canComplete(params)
		if (!result) {
			return null
		}

		const { selection, kind } = result

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
			.map<CompletionItem>(([label, data]) => {
				const bp = getBreakingPoint(label)
				if (bp) {
					return {
						label,
						sortText: bp.toString().padStart(5, " "),
						kind: CompletionItemKind.Module,
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
						kind: isDarkMode(label, twin) ? CompletionItemKind.Color : CompletionItemKind.Field,
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
				kind: CompletionItemKind.Constant,
				sortText: "~~content",
				data: { type: "class", data: null, value, variants, kind },
			})
		}

		return {
			isIncomplete: false,
			items: [...variantItems, ...classesItems],
		}
	} catch (err) {
		console.log(serializeError(err))
		return null
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
}): CompletionItem {
	const item: CompletionItem = {
		label,
		data: { type: "class", data, value, variants, kind },
		kind: CompletionItemKind.Constant,
		sortText: (label[0] === "-" ? "~~~" : "~~") + toNumberPostfix(label),
	}

	const color = getColors()[label]
	if (!color) {
		return item
	}

	item.kind = CompletionItemKind.Color
	if (color == "currentColor") {
		item.documentation = "currentColor"
		item.data.type = "color"
		item.data.data = "currentColor"
		return item
	}

	if (color === "transparent") {
		item.documentation = { kind: MarkupKind.PlainText, value: "rgba(0, 0, 0, 0.01)" }
		item.data.type = "color"
		item.data.data = "transparent"
		return item
	}

	item.documentation = color
	item.data.type = "color"
	return item
}

function toNumberPostfix(label: string) {
	const reg = /((?:[\w-]+-)+)+([\d/.]+)/
	const m = label.match(reg)
	if (!m) {
		return label
	}
	const val = eval(m[2])
	if (typeof val !== "number") {
		return label
	}
	const prefix = m[1]
	return prefix + val.toFixed(3).padStart(7, "0")
}
