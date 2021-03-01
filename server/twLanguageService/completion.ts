// dash word issue: https://github.com/microsoft/language-server-protocol/issues/937

import * as lsp from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import chroma from "chroma-js"
import { serializeError } from "serialize-error"
import type { CSSRuleItem } from "~/tailwind/classnames"
import type { ServiceOptions } from "~/twLanguageService"
import type { Tailwind } from "~/tailwind"
import { canMatch, PatternKind } from "~/common/ast"
import * as tw from "~/common/twin"
import { completeElement } from "~/common/findElement"
import { findThemeValueKeys } from "~/common/parseThemeValue"
import { cssDataManager } from "./cssData"
import toKebab from "~/common/toKebab"
import { getCompletionsForDeclarationValue } from "./completionCssPropertyValue"

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
	options: ServiceOptions,
): lsp.CompletionList {
	try {
		const result = canMatch({ document, position, twPropChecking: options.twPropImportChecking })
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
	match: tw.Token,
	kind: PatternKind,
	state: Tailwind,
	options: ServiceOptions,
): lsp.CompletionList {
	const [offset, , input] = match
	const position = index - offset
	const suggestion = completeElement({ input, position, separator: state.separator })
	const twin = kind === PatternKind.Twin || kind === PatternKind.TwinCssProperty
	const preferVariantWithParentheses = options.preferVariantWithParentheses
	const nextCharacter = input.slice(position, position + 1)
	const [a, b, value] = suggestion.token?.token ?? tw.createToken(0, 0, "")
	const isIncomplete = false

	// list variants
	const userVariants = suggestion.variants.texts
	let variantItems: lsp.CompletionItem[] = []
	let variantEnabled = true

	if (suggestion.token) {
		switch (suggestion.token.kind) {
			case tw.TokenKind.ClassName:
				if (position > a && position < b) variantEnabled = false
				break
			case tw.TokenKind.CssProperty:
				if (position > suggestion.token.token.start) {
					if (suggestion.token.token.text.slice(-1) === "]") {
						if (position < suggestion.token.token.end) {
							variantEnabled = false
						}
					} else if (position <= suggestion.token.token.end) {
						variantEnabled = false
					}
				}
				break
			case tw.TokenKind.Comment:
				variantEnabled = false
				break
		}
	}

	if (variantEnabled) {
		const variantFilter = state.classnames.getVariantFilter(userVariants, twin)
		variantItems = Object.entries(state.classnames.getVariants(twin))
			.filter(([label]) => variantFilter(label))
			.map<lsp.CompletionItem>(([label, data]) => {
				const bp = state.classnames.getBreakingPoint(label)
				if (bp) {
					return {
						label: label + ":",
						sortText: bp.toString().padStart(5, " "),
						kind: lsp.CompletionItemKind.Module,
						data: { type: "screen", data, variants: userVariants, kind },
						command: {
							title: "Suggest",
							command: "editor.action.triggerSuggest",
						},
					}
				} else if (label === "placeholder") {
					return {
						label: label + ":",
						sortText: "*" + label,
						kind: lsp.CompletionItemKind.Method,
						data: { type: "variant", data, variants: userVariants, kind },
						command: {
							title: "Suggest",
							command: "editor.action.triggerSuggest",
						},
					}
				} else {
					const f = state.classnames.isDarkLightMode(twin, label) || state.classnames.isMotionControl(label)
					return {
						label: label + ":",
						sortText: f ? "*" + label : "~~~:" + label,
						kind: f ? lsp.CompletionItemKind.Color : lsp.CompletionItemKind.Method,
						data: { type: "variant", data, variants: userVariants, kind },
						command: {
							title: "Suggest",
							command: "editor.action.triggerSuggest",
						},
					}
				}
			})
	}

	if (preferVariantWithParentheses) {
		if ((!suggestion.token && nextCharacter !== "(") || suggestion.token?.token.end === position) {
			for (let i = 0; i < variantItems.length; i++) {
				const item = variantItems[i]
				item.insertTextFormat = lsp.InsertTextFormat.Snippet
				item.insertText = item.label + "($0)"
			}
		}
	}

	if (suggestion.token) {
		if (suggestion.token.kind === tw.TokenKind.Variant) {
			if (position > a) {
				// replace variant
				for (let i = 0; i < variantItems.length; i++) {
					const item = variantItems[i]
					item.textEdit = lsp.TextEdit.replace(
						{
							start: document.positionAt(offset + a),
							end: document.positionAt(offset + b),
						},
						item.label,
					)
				}
			}
		} else if (suggestion.token.kind === tw.TokenKind.ClassName) {
			if (position > a) {
				// replace variant
				for (let i = 0; i < variantItems.length; i++) {
					const item = variantItems[i]
					item.textEdit = lsp.TextEdit.replace(
						{
							start: document.positionAt(offset + a),
							end: document.positionAt(offset + b),
						},
						item.insertText,
					)
				}
			}
		} else if (suggestion.token.kind === tw.TokenKind.Unknown) {
			if (position === a) {
				if (nextCharacter === state.separator) {
					for (let i = 0; i < variantItems.length; i++) {
						const item = variantItems[i]
						item.textEdit = lsp.TextEdit.replace(
							{
								start: document.positionAt(offset + a),
								end: document.positionAt(offset + a + 1),
							},
							item.label,
						)
					}
				} else {
					for (let i = 0; i < variantItems.length; i++) {
						const item = variantItems[i]
						item.textEdit = lsp.TextEdit.insert(document.positionAt(offset + a), item.label)
					}
				}
			} else {
				variantItems.length = 0
			}
		}
	}

	// list className
	let classNameItems: lsp.CompletionItem[] = []
	let classNameEnabled = true

	if (kind === PatternKind.TwinCssProperty) {
		classNameEnabled = false
	}
	if (suggestion.token) {
		switch (suggestion.token.kind) {
			case tw.TokenKind.Variant:
				if (position > a) classNameEnabled = false
				break
			case tw.TokenKind.CssProperty:
				if (position > a && position < b) classNameEnabled = false
				break
			case tw.TokenKind.Unknown:
				// if (position > a) classNameEnabled = false
				break
			case tw.TokenKind.Comment:
				classNameEnabled = false
				break
		}
	}

	if (classNameEnabled) {
		const classesFilter = state.classnames.getClassNameFilter(userVariants, twin)
		classNameItems = Object.entries(state.classnames.getClassNames(userVariants, twin))
			.filter(classesFilter)
			.map(([label, data]) => createCompletionItem({ label, data, variants: userVariants, kind, state }))
	}

	if (suggestion.token) {
		if (position === a || (value.slice(0, 1) === "-" && position === a + 1 && position < b)) {
			for (let i = 0; i < classNameItems.length; i++) {
				const item = classNameItems[i]
				item.textEdit = lsp.TextEdit.insert(document.positionAt(offset + a), item.label + " ")
			}
		} else if (suggestion.token.kind === tw.TokenKind.ClassName || suggestion.token.kind === tw.TokenKind.Unknown) {
			if (position <= b) {
				for (let i = 0; i < classNameItems.length; i++) {
					const item = classNameItems[i]
					item.textEdit = lsp.TextEdit.replace(
						{
							start: document.positionAt(offset + a),
							end: document.positionAt(offset + b),
						},
						item.label,
					)
				}
			}
		}
	}

	let cssPropItems: lsp.CompletionItem[] = []
	const cssValueItems: lsp.CompletionItem[] = []
	let cssPropEnabled = true
	let cssValueEnabled = false

	if (suggestion.token) {
		if (suggestion.token.kind === tw.TokenKind.CssProperty) {
			const { start, end } = suggestion.token.value
			if (position >= start && position <= end) {
				cssPropEnabled = false
				cssValueEnabled = true
			}
		}
	}

	if (cssPropEnabled) {
		cssPropItems = cssDataManager.getProperties().map(entry => ({
			label: entry.name,
			sortText: "~~~~" + entry.name,
			kind: lsp.CompletionItemKind.Field,
			insertTextFormat: lsp.InsertTextFormat.Snippet,
			insertText: entry.name + "[$0]",
			textEdit: suggestion.token
				? lsp.TextEdit.replace(
						{
							start: document.positionAt(offset + a),
							end: document.positionAt(offset + b),
						},
						entry.name + "[$0]",
				  )
				: undefined,
			command: {
				title: "Suggest",
				command: "editor.action.triggerSuggest",
			},
			data: {
				type: "cssPropertyName",
				entry,
			},
		}))
	}

	if (cssValueEnabled && suggestion.token.kind === tw.TokenKind.CssProperty) {
		cssValueItems.push(
			...getCompletionsForDeclarationValue(
				toKebab(suggestion.token.key.text),
				suggestion.token.value.text.trim(),
				lsp.Range.create(
					document.positionAt(offset + suggestion.token.value.start),
					document.positionAt(offset + suggestion.token.value.end),
				),
			),
		)
	}

	return lsp.CompletionList.create(
		[...variantItems, ...classNameItems, ...cssPropItems, ...cssValueItems],
		isIncomplete,
	)
}

function twinThemeCompletion(
	document: TextDocument,
	index: number,
	token: tw.Token,
	state: Tailwind,
): lsp.CompletionList {
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
				item.filterText = hit?.text.slice(0, 1) + item.filterText
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

	if (item.label === "container") {
		item.detail = "container"
		return item
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
		item.documentation = "rgba(0, 0, 0, 0.0)"
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
