// dash word issue: https://github.com/microsoft/language-server-protocol/issues/937

import chroma from "chroma-js"
import { serializeError } from "serialize-error"
import * as lsp from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import { canMatch, PatternKind } from "~/common/ast"
import { completeElement } from "~/common/findElement"
import { findThemeValueKeys } from "~/common/parseThemeValue"
import * as tw from "~/common/twin"
import type { Tailwind } from "~/tailwind"
import type { CSSRuleItem } from "~/tailwind/classnames"
import type { ServiceOptions } from "~/twLanguageService"
import { getCompletionsForDeclarationValue } from "./completionCssPropertyValue"
import { cssDataManager } from "./cssData"

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
		const result = canMatch(document, position, false, options.jsxPropImportChecking)
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

function makeReplace(document: TextDocument, offset: number, start: number, end: number, text: string): lsp.TextEdit {
	return lsp.TextEdit.replace(
		{
			start: document.positionAt(offset + start),
			end: document.positionAt(offset + end),
		},
		text,
	)
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
	const nextCharacter = input.slice(position, position + 1) ?? " "
	const [a, b, value] = suggestion.token?.token ?? tw.createToken(0, 0, "")
	const isIncomplete = false

	// textEdit type: insert, replace, insert with space

	// list variants
	const userVariants = suggestion.variants.texts
	let variantItems: lsp.CompletionItem[] = []
	let variantEnabled = true

	if (suggestion.token) {
		switch (suggestion.token.kind) {
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
					const f = state.classnames.isDarkLightMode(twin, label)
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
		if (nextCharacter !== "(" && !(suggestion.token?.kind === tw.TokenKind.Variant && position === a)) {
			for (let i = 0; i < variantItems.length; i++) {
				const item = variantItems[i]
				item.insertTextFormat = lsp.InsertTextFormat.Snippet
				item.insertText = item.label + "($0)"
			}
		}
	}

	if (suggestion.token) {
		if (suggestion.token.kind === tw.TokenKind.Variant) {
			const isVariantWord = state.classnames.isVariant(
				value.slice(0, value.length - state.separator.length),
				twin,
			)
			if (!isVariantWord || (position > a && position < b)) {
				for (let i = 0; i < variantItems.length; i++) {
					const item = variantItems[i]
					item.textEdit = makeReplace(document, offset, a, b, item.label)
				}
			}
		} else if (
			suggestion.token.kind === tw.TokenKind.ClassName ||
			suggestion.token.kind === tw.TokenKind.CssProperty
		) {
			if (position > a) {
				for (let i = 0; i < variantItems.length; i++) {
					const item = variantItems[i]
					item.textEdit = makeReplace(document, offset, a, b, item.insertText)
				}
			}
		} else if (suggestion.token.kind === tw.TokenKind.Unknown) {
			if (position === a) {
				if (nextCharacter === state.separator) {
					for (let i = 0; i < variantItems.length; i++) {
						const item = variantItems[i]
						item.textEdit = makeReplace(document, offset, a, a + 1, item.label)
					}
				} else {
					for (let i = 0; i < variantItems.length; i++) {
						const item = variantItems[i]
						item.textEdit = lsp.TextEdit.insert(document.positionAt(offset + a), item.label)
					}
				}
			} else if (suggestion.token.token.text === state.separator) {
				for (let i = 0; i < variantItems.length; i++) {
					const item = variantItems[i]
					item.textEdit = makeReplace(document, offset, a, a + 1, item.label)
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
			case tw.TokenKind.Variant: {
				const isVariantWord = state.classnames.isVariant(
					value.slice(0, value.length - state.separator.length),
					twin,
				)
				if (position === b && !isVariantWord) classNameEnabled = false
				break
			}
			case tw.TokenKind.Comment:
				classNameEnabled = false
				break
			case tw.TokenKind.CssProperty:
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
		if ((position > a && position < b) || (position === b && suggestion.token.kind === tw.TokenKind.ClassName)) {
			for (let i = 0; i < classNameItems.length; i++) {
				const item = classNameItems[i]
				item.textEdit = makeReplace(document, offset, a, b, item.label)
			}
		} else if (position === a) {
			for (let i = 0; i < classNameItems.length; i++) {
				const item = classNameItems[i]
				item.textEdit = lsp.TextEdit.insert(document.positionAt(offset + a), item.label + " ")
			}
		}
	}

	let cssPropItems: lsp.CompletionItem[] = []
	const cssValueItems: lsp.CompletionItem[] = []
	let cssPropEnabled = true
	let cssValueEnabled = false

	if (suggestion.token) {
		switch (suggestion.token.kind) {
			case tw.TokenKind.Comment:
				cssPropEnabled = false
				break
			case tw.TokenKind.CssProperty: {
				const { start, end } = suggestion.token.value
				if (position >= start && position <= end) {
					cssPropEnabled = false
				}
				if (position >= start && position <= end) {
					cssValueEnabled = true
				}
				break
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

	if (suggestion.token) {
		if (suggestion.token.kind === tw.TokenKind.CssProperty) {
			const { start, end } = suggestion.token.key
			if (position > start && position <= end) {
				for (let i = 0; i < cssPropItems.length; i++) {
					const item = cssPropItems[i]
					item.textEdit = makeReplace(document, offset, a, b, item.label + "[$0]")
				}
			} else if (position === start) {
				for (let i = 0; i < cssPropItems.length; i++) {
					const item = cssPropItems[i]
					item.textEdit = lsp.TextEdit.insert(document.positionAt(offset + a), item.label + "[$0] ")
				}
			}
		} else if (suggestion.token.kind === tw.TokenKind.Variant) {
			if (position > a && position < b) {
				for (let i = 0; i < cssPropItems.length; i++) {
					const item = cssPropItems[i]
					item.textEdit = makeReplace(document, offset, a, b, item.label + "[$0]")
				}
			} else if (position === a) {
				for (let i = 0; i < cssPropItems.length; i++) {
					const item = cssPropItems[i]
					item.textEdit = lsp.TextEdit.insert(document.positionAt(offset + a), item.label + "[$0] ")
				}
			}
		} else {
			if (position > a && position <= b) {
				for (let i = 0; i < cssPropItems.length; i++) {
					const item = cssPropItems[i]
					item.textEdit = makeReplace(document, offset, a, b, item.label + "[$0]")
				}
			} else if (position === a) {
				for (let i = 0; i < cssPropItems.length; i++) {
					const item = cssPropItems[i]
					item.textEdit = lsp.TextEdit.insert(document.positionAt(offset + a), item.label + "[$0] ")
				}
			}
		}
	}

	if (cssValueEnabled && suggestion.token.kind === tw.TokenKind.CssProperty) {
		const prop = suggestion.token.key.toKebab()
		const word = suggestion.token.value.getWord(position)
		cssValueItems.push(
			...getCompletionsForDeclarationValue(
				prop,
				word.text,
				lsp.Range.create(document.positionAt(offset + word.start), document.positionAt(offset + word.end)),
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
			item.data = {
				kind: PatternKind.TwinTheme,
				type: "other",
			}
			if (typeof value === "object") {
				item.kind = lsp.CompletionItemKind.Module
				item.documentation = {
					kind: lsp.MarkupKind.Markdown,
					value: `\`\`\`text\nobject\n\`\`\``,
				}
				item.detail = label
			} else if (typeof value === "function") {
				item.kind = lsp.CompletionItemKind.Function
				item.documentation = {
					kind: lsp.MarkupKind.Markdown,
					value: `\`\`\`text\nfunction\n\`\`\``,
				}
				item.detail = label
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
						item.documentation = {
							kind: lsp.MarkupKind.Markdown,
							value: `\`\`\`txt\n${value}\n\`\`\``,
						}
						item.detail = label
					}
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

	if (item.label === state.config.prefix + "container") {
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
