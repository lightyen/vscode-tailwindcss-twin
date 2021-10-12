import { canMatch, PatternKind, TextDocument, TokenResult } from "@/ast"
import { defaultLogger as console } from "@/logger"
import { findThemeValueKeys } from "@/parseThemeValue"
import { transformSourceMap } from "@/sourcemap"
import * as parser from "@/twin-parser"
import * as nodes from "@/twin-parser/twNodes"
import { cssDataManager } from "@/vscode-css-languageservice"
import chroma from "chroma-js"
import vscode from "vscode"
import type { ICompletionItem } from "~/typings/completion"
import type { ServiceOptions } from "."
import { getCompletionsForDeclarationValue, getCompletionsFromRestrictions } from "./completionCssPropertyValue"
import type { TailwindLoader } from "./tailwind"

export default function completion(
	document: TextDocument,
	position: unknown,
	state: TailwindLoader,
	options: ServiceOptions,
): vscode.CompletionList<ICompletionItem> | undefined {
	let result: TokenResult | undefined
	try {
		// TODO: besides js/ts, support other language extrators
		result = canMatch(document, position, false, options.jsxPropImportChecking)
		if (!result) return undefined
	} catch (error) {
		const err = error as Error
		if (err.stack) err.stack = transformSourceMap(options.serverSourceMapUri.fsPath, err.stack)
		console.error(err)
		return undefined
	}

	const start = process.hrtime.bigint()
	const list = doComplete(result)
	const end = process.hrtime.bigint()
	console.trace(`provide completion (${Number((end - start) / 10n ** 6n)}ms)`)
	return list

	function doComplete(result: TokenResult) {
		try {
			const index = document.offsetAt(position)
			const { kind, token } = result
			if (kind === PatternKind.TwinTheme) {
				const list = twinThemeCompletion(document, index, token, state)
				for (let i = 0; i < list.items.length; i++) {
					list.items[i].data.uri = document.uri.toString()
				}
				return list
			} else if (kind === PatternKind.TwinScreen) {
				const list = twinScreenCompletion(document, index, token, state)
				for (let i = 0; i < list.items.length; i++) {
					list.items[i].data.uri = document.uri.toString()
				}
				return list
			} else {
				const list = twinCompletion(document, index, token, kind, state, options)
				for (let i = 0; i < list.items.length; i++) {
					list.items[i].data.uri = document.uri.toString()
				}
				return list
			}
		} catch (error) {
			const err = error as Error
			if (err.stack) err.stack = transformSourceMap(options.serverSourceMapUri.fsPath, err.stack)
			console.error(err)
			console.error("build completion list failed.")
		}
		return undefined
	}
}

function doReplace(
	list: ICompletionItem[],
	document: TextDocument,
	offset: number,
	start: number,
	end: number,
	handler: (item: ICompletionItem) => ICompletionItem["insertText"],
) {
	for (let i = 0; i < list.length; i++) {
		const item = list[i]
		item.insertText = handler(item)
		item.range = new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + end))
	}
}

function doInsert(
	list: ICompletionItem[],
	document: TextDocument,
	offset: number,
	start: number,
	handler: (item: ICompletionItem) => ICompletionItem["insertText"],
) {
	for (let i = 0; i < list.length; i++) {
		const item = list[i]
		item.insertText = handler(item)
		const position = document.positionAt(offset + start)
		item.range = new vscode.Range(position, position)
	}
}

function twinCompletion(
	document: TextDocument,
	index: number,
	match: parser.Token,
	kind: PatternKind,
	state: TailwindLoader,
	options: ServiceOptions,
): vscode.CompletionList<ICompletionItem> {
	const [offset, , text] = match
	const position = index - offset
	const suggestion = parser.suggest({ text, position, separator: state.separator })
	const isIncomplete = false
	const variants = variantsCompletion(document, text, position, offset, kind, suggestion, state, options)
	const utilities = utilitiesCompletion(document, text, position, offset, kind, suggestion, state, options)
	const shortcss = shortcssCompletion(document, text, position, offset, kind, suggestion, state, options)
	const arbitraryValue = arbitraryValueCompletion(document, text, position, offset, kind, suggestion, state, options)
	const completionList = new vscode.CompletionList<ICompletionItem>([], isIncomplete)
	completionList.items = completionList.items
		.concat(variants)
		.concat(utilities)
		.concat(shortcss)
		.concat(arbitraryValue)
	return completionList
}

function variantsCompletion(
	document: TextDocument,
	text: string,
	position: number,
	offset: number,
	kind: PatternKind,
	suggestion: ReturnType<typeof parser.suggest>,
	state: TailwindLoader,
	{ preferVariantWithParentheses }: ServiceOptions,
) {
	const [a, ,] = suggestion.target ?? parser.createToken(0, 0, "")
	let [, b] = suggestion.target ?? parser.createToken(0, 0, "")
	const nextCharacter = text.charCodeAt(position)
	const userVariants = new Set(suggestion.variants.texts)

	let variantItems: ICompletionItem[] = []
	let variantEnabled = true

	if (suggestion.inComment) {
		variantEnabled = false
	}

	if (suggestion.target) {
		switch (suggestion.type) {
			case parser.SuggestResultType.Variant:
				b = b + state.separator.length
				break
			case parser.SuggestResultType.CssProperty:
			case parser.SuggestResultType.ArbitraryStyle:
				variantEnabled = false
				break
		}
	}

	if (variantEnabled) {
		const [screens, darkmode, placeholder, restVariants] = state.tw.variants
		variantItems = variantItems
			.concat(
				screens.map((value, index) => ({
					label: value + state.separator,
					sortText: index.toString().padStart(5, " "),
					kind: vscode.CompletionItemKind.Module,
					data: { type: "screen" },
					command: {
						title: "Suggest",
						command: "editor.action.triggerSuggest",
					},
				})),
			)
			.concat(
				darkmode.map(value => ({
					label: value + state.separator,
					sortText: "*" + value,
					kind: vscode.CompletionItemKind.Color,
					data: { type: "variant" },
					command: {
						title: "Suggest",
						command: "editor.action.triggerSuggest",
					},
				})),
			)
			.concat(
				placeholder.map(value => ({
					label: value + state.separator,
					sortText: "*" + value,
					kind: vscode.CompletionItemKind.Method,
					data: { type: "variant" },
					command: {
						title: "Suggest",
						command: "editor.action.triggerSuggest",
					},
				})),
			)
			.concat(
				restVariants.map(value => ({
					label: value + state.separator,
					sortText: "~~~" + value,
					kind: vscode.CompletionItemKind.Method,
					data: { type: "variant" },
					command: {
						title: "Suggest",
						command: "editor.action.triggerSuggest",
					},
				})),
			)

		variantItems = variantItems.filter(item => !userVariants.has(item.label.slice(0, -state.separator.length)))
	}

	const next = text.slice(b, b + 1)
	const nextNotSpace = next != "" && suggestion.target != undefined && next.match(/[\s)]/) == null

	if (preferVariantWithParentheses) {
		if (nextCharacter !== 40) {
			for (let i = 0; i < variantItems.length; i++) {
				const item = variantItems[i]
				item.insertText = new vscode.SnippetString(item.label + "($0)" + (nextNotSpace ? " " : ""))
			}
		}
	}

	if (suggestion.target) {
		if (suggestion.type === parser.SuggestResultType.Variant) {
			if (position > a && position < b) {
				doReplace(variantItems, document, offset, a, b, item => item.label)
			} else if ((preferVariantWithParentheses && position === a) || (position === b && nextNotSpace)) {
				doInsert(variantItems, document, offset, a, item => item.label)
			}
		} else if (
			suggestion.type === parser.SuggestResultType.ClassName ||
			suggestion.type === parser.SuggestResultType.CssProperty ||
			suggestion.type === parser.SuggestResultType.ArbitraryStyle
		) {
			if (position > a) {
				if (preferVariantWithParentheses) {
					doReplace(variantItems, document, offset, a, b, item => item.insertText)
				} else {
					doReplace(variantItems, document, offset, a, b, item => item.label)
				}
			}
		}
	}

	return variantItems
}

function utilitiesCompletion(
	document: TextDocument,
	text: string,
	position: number,
	offset: number,
	kind: PatternKind,
	suggestion: ReturnType<typeof parser.suggest>,
	state: TailwindLoader,
	_: ServiceOptions,
) {
	const [a, , value] = suggestion.target ?? parser.createToken(0, 0, "")
	let [, b] = suggestion.target ?? parser.createToken(0, 0, "")
	let classNameItems: ICompletionItem[] = []
	let classNameEnabled = true

	if (kind === PatternKind.TwinCssProperty) {
		classNameEnabled = false
	}

	if (suggestion.inComment) {
		classNameEnabled = false
	}

	if (suggestion.target) {
		switch (suggestion.type) {
			case parser.SuggestResultType.Variant: {
				const isVariantWord = state.tw.isVariant(value)
				b = b + state.separator.length
				if (position === b && !isVariantWord) {
					classNameEnabled = false
				}
				break
			}
			case parser.SuggestResultType.CssProperty:
				classNameEnabled = false
				break
		}
	}

	if (classNameEnabled) {
		classNameItems = state.provideUtilities(suggestion)
	}

	const next = text.slice(b, b + 1)
	const nextNotSpace = next !== "" && next.match(/[\s)]/) == null

	if (suggestion.target) {
		if (position > a && position < b) {
			doReplace(classNameItems, document, offset, a, b, item => item.label + (nextNotSpace ? " " : ""))
		} else if (position === a) {
			doInsert(classNameItems, document, offset, a, item => item.label + " ")
		} else if (position === b) {
			if (
				suggestion.type === parser.SuggestResultType.ClassName ||
				suggestion.type === parser.SuggestResultType.ArbitraryStyle ||
				suggestion.target.value === state.separator
			) {
				doReplace(classNameItems, document, offset, a, b, item => {
					return item.label + (nextNotSpace ? " " : "")
				})
			} else if (suggestion.type === parser.SuggestResultType.Variant) {
				doInsert(classNameItems, document, offset, b, item => item.label + (nextNotSpace ? " " : ""))
			}
		} else {
			classNameItems.length = 0
		}
	}

	return classNameItems
}

function shortcssCompletion(
	document: TextDocument,
	text: string,
	position: number,
	offset: number,
	kind: PatternKind,
	suggestion: ReturnType<typeof parser.suggest>,
	state: TailwindLoader,
	_: ServiceOptions,
) {
	const [a, , value] = suggestion.target ?? parser.createToken(0, 0, "")
	let [, b] = suggestion.target ?? parser.createToken(0, 0, "")

	let cssPropItems: ICompletionItem[] = []
	const cssValueItems: ICompletionItem[] = []
	let cssPropEnabled = true
	let cssValueEnabled = false

	if (suggestion.inComment) {
		cssPropEnabled = cssValueEnabled = false
	}

	if (suggestion.target) {
		if (suggestion.type === parser.SuggestResultType.Variant) {
			b = b + state.separator.length
			const isVariantWord = state.tw.isVariant(value)
			if (position === b && !isVariantWord) {
				cssPropEnabled = false
			}
		} else if (nodes.isCssProperty(suggestion.target)) {
			const [a, b] = suggestion.target.content
			if (position >= a && position <= b) {
				cssPropEnabled = false
				cssValueEnabled = true
			}
		}
	}

	if (cssPropEnabled) {
		cssPropItems = cssDataManager.getProperties().map(entry => ({
			label: entry.name,
			sortText: "~~~~" + entry.name,
			kind: vscode.CompletionItemKind.Field,
			insertText: new vscode.SnippetString(entry.name + "[$0]"),
			command: {
				title: "Suggest",
				command: "editor.action.triggerSuggest",
			},
			data: {
				type: "cssProp",
				entry,
			},
		}))

		cssPropItems = cssPropItems.concat(
			Array.from(state.tw.variables).map(label => {
				const item: ICompletionItem = {
					label,
					data: { type: "cssProp" },
					sortText: "~~~~~" + label,
					kind: vscode.CompletionItemKind.Field,
					insertText: new vscode.SnippetString(label + "[$0]"),
					command: {
						title: "Suggest",
						command: "editor.action.triggerSuggest",
					},
					detail: "variable",
				}
				return item
			}),
		)
	}

	if (suggestion.target) {
		if (suggestion.type === parser.SuggestResultType.CssProperty) {
			const { start, end } = suggestion.target
			if (position > start && position <= end) {
				doReplace(cssPropItems, document, offset, a, b, item => new vscode.SnippetString(item.label + "[$0]"))
			} else if (position === start) {
				doInsert(cssPropItems, document, offset, a, item => new vscode.SnippetString(item.label + "[$0] "))
			}
		} else if (suggestion.type === parser.SuggestResultType.Variant) {
			if (position > a && position < b) {
				doReplace(cssPropItems, document, offset, a, b, item => new vscode.SnippetString(item.label + "[$0]"))
			} else if (position === a) {
				doInsert(cssPropItems, document, offset, a, item => new vscode.SnippetString(item.label + "[$0] "))
			}
		} else {
			if (position > a && position <= b) {
				doReplace(cssPropItems, document, offset, a, b, item => new vscode.SnippetString(item.label + "[$0]"))
			} else if (position === a) {
				doInsert(cssPropItems, document, offset, a, item => new vscode.SnippetString(item.label + "[$0] "))
			}
		}
	}

	if (cssValueEnabled && suggestion.target && nodes.isCssProperty(suggestion.target)) {
		const prop = suggestion.target.prop?.toKebab() ?? ""
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const word = suggestion.target!.getWord(position)
		cssValueItems.push(
			...getCompletionsForDeclarationValue(
				prop,
				word.value,
				new vscode.Range(document.positionAt(offset + word.start), document.positionAt(offset + word.end)),
			),
		)
	}

	return [...cssPropItems, ...cssValueItems]
}

const fromCssProp = (cssprop: string) => (currentWord: string, range: vscode.Range) =>
	getCompletionsForDeclarationValue(cssprop, currentWord, range)
const fromRestrictions =
	(...restrictions: string[]) =>
	(currentWord: string, range: vscode.Range) =>
		getCompletionsFromRestrictions(restrictions, currentWord, range)

const mappingArbitraryPropToCssProp: Record<
	string,
	Array<(currentWord: string, range: vscode.Range) => ICompletionItem[]>
> = {
	"divide-": [fromCssProp("border-color")],
	"bg-": [fromCssProp("background-color")],
	"from-": [fromRestrictions("color")],
	"via-": [fromRestrictions("color")],
	"to-": [fromRestrictions("color")],
	"space-x-": [fromRestrictions("length", "percentage")],
	"space-y-": [fromRestrictions("length", "percentage")],
	"w-": [fromCssProp("width")],
	"h-": [fromCssProp("height")],
	"leading-": [fromCssProp("line-height")],
	"m-": [fromCssProp("margin")],
	"mx-": [fromCssProp("margin-left")],
	"my-": [fromCssProp("margin-top")],
	"mt-": [fromCssProp("margin-top")],
	"mr-": [fromCssProp("margin-right")],
	"mb-": [fromCssProp("margin-bottom")],
	"ml-": [fromCssProp("margin-left")],
	"p-": [fromCssProp("padding")],
	"px-": [fromCssProp("padding-left")],
	"py-": [fromCssProp("padding-top")],
	"pt-": [fromCssProp("padding-top")],
	"pr-": [fromCssProp("padding-right")],
	"pb-": [fromCssProp("padding-bottom")],
	"pl-": [fromCssProp("padding-left")],
	"max-w-": [fromCssProp("max-width")],
	"max-h-": [fromCssProp("max-height")],
	"inset-": [fromCssProp("top")],
	"inset-x-": [fromCssProp("top")],
	"inset-y-": [fromCssProp("left")],
	"top-": [fromCssProp("top")],
	"right-": [fromCssProp("right")],
	"bottom-": [fromCssProp("bottom")],
	"left-": [fromCssProp("left")],
	"gap-": [fromCssProp("gap")],
	"translate-x-": [fromRestrictions("length", "percentage")],
	"translate-y-": [fromRestrictions("length", "percentage")],
	"blur-": [fromRestrictions("length")],
	"backdrop-blur": [fromRestrictions("length")],
	"order-": [fromCssProp("order")],
	"rotate-": [fromRestrictions("angle")],
	"skew-x-": [fromRestrictions("angle")],
	"skew-y-": [fromRestrictions("angle")],
	"hue-rotate-": [fromRestrictions("angle")],
	"backdrop-hue-rotate-": [fromRestrictions("angle")],
	"duration-": [fromCssProp("transition-duration")],
	"delay-": [fromCssProp("transition-delay")],
	"ease-": [fromCssProp("transition-timing-function")],
	"grid-cols-": [fromCssProp("grid-template-columns")],
	"grid-rows-": [fromCssProp("grid-template-rows")],
	"border-": [fromCssProp("border-width"), fromCssProp("border-color")],
	"border-t-": [fromCssProp("border-top-width"), fromCssProp("border-top-color")],
	"border-r-": [fromCssProp("border-right-width"), fromCssProp("border-right-color")],
	"border-b-": [fromCssProp("border-bottom-width"), fromCssProp("border-bottom-color")],
	"border-l-": [fromCssProp("border-left-width"), fromCssProp("border-left-color")],
	"border-x-": [fromCssProp("border-left-width"), fromCssProp("border-left-color")],
	"border-y-": [fromCssProp("border-top-width"), fromCssProp("border-top-color")],
	"text-": [fromRestrictions("color", "length", "percentage")],
	"ring-": [fromRestrictions("length", "color")],
	"stroke-": [fromCssProp("stroke-width"), fromCssProp("stroke")],
	"caret-": [fromCssProp("caret-color")],
	"aspect-": [fromCssProp("aspect-ratio")],
	"accent-": [fromRestrictions("color")],
	"indent-": [fromCssProp("text-indent")],
	"columns-": [fromCssProp("columns")],
}

function arbitraryValueCompletion(
	document: TextDocument,
	text: string,
	position: number,
	offset: number,
	kind: PatternKind,
	suggestion: ReturnType<typeof parser.suggest>,
	state: TailwindLoader,
	_: ServiceOptions,
) {
	const cssValueItems: ICompletionItem[] = []

	if (suggestion.target == undefined) {
		return cssValueItems
	}

	if (suggestion.inComment) {
		return cssValueItems
	}

	if (!nodes.isArbitraryStyle(suggestion.target)) {
		return cssValueItems
	}

	if (position < suggestion.target.content.start || position > suggestion.target.content.end) {
		return cssValueItems
	}

	const prop = suggestion.target.prop.value
	if (mappingArbitraryPropToCssProp[prop]) {
		const word = suggestion.target.getWord(position)
		for (const fn of mappingArbitraryPropToCssProp[prop]) {
			cssValueItems.push(
				...fn(
					word.value,
					new vscode.Range(document.positionAt(offset + word.start), document.positionAt(offset + word.end)),
				),
			)
		}
	}

	return cssValueItems
}

function twinThemeCompletion(
	document: TextDocument,
	index: number,
	token: parser.Token,
	state: TailwindLoader,
): vscode.CompletionList<ICompletionItem> {
	const [offset, , text] = token
	const position = index - offset
	const { keys, hit } = findThemeValueKeys(text, position)

	if (!hit && keys.length > 0) {
		return { isIncomplete: false, items: [] }
	}

	const value = state.tw.getTheme(keys)
	if (typeof value !== "object") {
		return { isIncomplete: false, items: [] }
	}

	const candidates = Object.keys(value)

	function formatCandidates(label: string) {
		let prefix = ""
		if (label.charCodeAt(0) === 45) {
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
			const item: ICompletionItem = {
				label,
				sortText: formatCandidates(label),
				data: { type: "theme" },
			}
			const value = state.tw.getTheme([...keys, label])
			if (typeof value === "object") {
				item.kind = vscode.CompletionItemKind.Module
				item.documentation = new vscode.MarkdownString(`\`\`\`text\nobject\n\`\`\``)
				item.detail = label
			} else if (typeof value === "function") {
				item.kind = vscode.CompletionItemKind.Function
				item.documentation = new vscode.MarkdownString(`\`\`\`text\nfunction\n\`\`\``)
				item.detail = label
			} else {
				if (typeof value === "string") {
					try {
						if (value === "transparent") {
							item.kind = vscode.CompletionItemKind.Color
							item.documentation = "rgba(0, 0, 0, 0.0)"
							item.data.type = "theme"
							return item
						}
						chroma(value)
						item.kind = vscode.CompletionItemKind.Color
						item.documentation = value
						item.data.type = "theme"
					} catch {
						item.kind = vscode.CompletionItemKind.Constant
						item.documentation = new vscode.MarkdownString(`\`\`\`txt\n${value}\n\`\`\``)
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
				item.filterText = hit?.value.slice(0, 1) + item.filterText
			}

			if (hit) {
				const [a, b] = hit
				item.insertText = newText
				item.range = new vscode.Range(document.positionAt(offset + a), document.positionAt(offset + b))
				// item.textEdit = lsp.TextEdit.replace(
				// 	{
				// 		start: document.positionAt(offset + a),
				// 		end: document.positionAt(offset + b),
				// 	},
				// 	newText,
				// )
			} else {
				item.insertText = newText
				item.range = new vscode.Range(document.positionAt(index), document.positionAt(index))
				// item.textEdit = lsp.TextEdit.insert(document.positionAt(index), newText)
			}

			return item
		}),
	}
}

function twinScreenCompletion(
	document: TextDocument,
	index: number,
	token: parser.Token,
	state: TailwindLoader,
): vscode.CompletionList<ICompletionItem> {
	const value = state.tw.getTheme(["screens"])
	if (typeof value !== "object") {
		return { isIncomplete: false, items: [] }
	}

	const candidates = Object.keys(value)

	function formatCandidates(label: string) {
		let prefix = ""
		if (label.charCodeAt(0) === 45) {
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
			const index = state.tw.screens.indexOf(label)
			const item: ICompletionItem = {
				label,
				sortText: index.toString().padStart(5, " ") ?? formatCandidates(label),
				data: { type: "theme" },
			}
			const value = state.tw.getTheme(["screens", label])
			if (typeof value === "object") {
				item.kind = vscode.CompletionItemKind.Module
				item.documentation = new vscode.MarkdownString(`\`\`\`text\nobject\n\`\`\``)
				item.detail = label
			} else if (typeof value === "function") {
				item.kind = vscode.CompletionItemKind.Function
				item.documentation = new vscode.MarkdownString(`\`\`\`text\nfunction\n\`\`\``)
				item.detail = label
			} else {
				if (typeof value === "string") {
					try {
						if (value === "transparent") {
							item.kind = vscode.CompletionItemKind.Color
							item.documentation = "rgba(0, 0, 0, 0.0)"
							item.data = { type: "color" }
							return item
						}
						chroma(value)
						item.kind = vscode.CompletionItemKind.Color
						item.documentation = value
						item.data = { type: "color" }
					} catch {
						item.kind = vscode.CompletionItemKind.Constant
						item.documentation = new vscode.MarkdownString(`\`\`\`txt\n${value}\n\`\`\``)
						item.detail = label
					}
				}
			}

			const w = token.value.trim()
			if (w !== "") {
				item.insertText = label
				item.range = new vscode.Range(
					document.positionAt(token.start),
					document.positionAt(token.start + w.length),
				)
				// item.textEdit = lsp.TextEdit.replace(
				// 	{
				// 		start: document.positionAt(token.start),
				// 		end: document.positionAt(token.start + w.length),
				// 	},
				// 	label,
				// )
			}

			return item
		}),
	}
}
