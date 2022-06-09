import { ExtractedToken, ExtractedTokenKind, TextDocument, Token } from "@/extractors"
import { defaultLogger as console } from "@/logger"
import * as parser from "@/parser"
import * as nodes from "@/parser/nodes"
import { findThemeValueKeys } from "@/parseThemeValue"
import { cssDataManager } from "@/vscode-css-languageservice"
import chroma from "chroma-js"
import vscode from "vscode"
import { getCSSLanguageService } from "vscode-css-languageservice"
import { TextDocument as LspTextDocument } from "vscode-languageserver-textdocument"
import * as lsp from "vscode-languageserver-types"
import { calcFraction } from "~/common"
import type { ICompletionItem } from "~/typings/completion"
import type { ServiceOptions } from "."
import type { TailwindLoader } from "./tailwind"

export default function completion(
	result: ExtractedToken | undefined,
	document: TextDocument,
	position: unknown,
	state: TailwindLoader,
	options: ServiceOptions,
): vscode.CompletionList<ICompletionItem> | undefined {
	if (!result) return undefined

	const start = process.hrtime.bigint()
	const list = doComplete(result)
	const end = process.hrtime.bigint()
	console.trace(`provide completion (${Number((end - start) / 10n ** 6n)}ms)`)
	return list

	function doComplete(result: ExtractedToken) {
		try {
			const index = document.offsetAt(position)
			const { kind, ...token } = result
			if (kind === ExtractedTokenKind.TwinTheme) {
				const list = twinThemeCompletion(document, index, token, state)
				for (let i = 0; i < list.items.length; i++) {
					list.items[i].data.uri = document.uri
				}
				return list
			} else if (kind === ExtractedTokenKind.TwinScreen) {
				const list = twinScreenCompletion(document, index, token, state)
				for (let i = 0; i < list.items.length; i++) {
					list.items[i].data.uri = document.uri
				}
				return list
			} else {
				const list = twinCompletion(document, index, token, kind, state, options)
				for (let i = 0; i < list.items.length; i++) {
					list.items[i].data.uri = document.uri
				}
				return list
			}
		} catch (error) {
			console.error(error)
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
	match: Token,
	kind: ExtractedTokenKind,
	state: TailwindLoader,
	options: ServiceOptions,
): vscode.CompletionList<ICompletionItem> {
	const offset = match.start
	const text = match.value
	const position = index - offset
	const suggestion = parser.suggest({ text, position, separator: state.separator })

	const isIncomplete = false
	const variants = variantsCompletion(document, text, position, offset, kind, suggestion, state, options)
	const utilities = utilitiesCompletion(document, text, position, offset, kind, suggestion, state, options)
	const shortcss = shortcssCompletion(document, text, position, offset, kind, suggestion, state, options)
	const arbitraryValue = arbitraryValueCompletion(document, text, position, offset, kind, suggestion, state, options)
	const arbitraryProperty = arbitraryPropertyCompletion(
		document,
		text,
		position,
		offset,
		kind,
		suggestion,
		state,
		options,
	)
	const arbitraryVariant = arbitraryVariantCompletion(
		document,
		text,
		position,
		offset,
		kind,
		suggestion,
		state,
		options,
	)
	const completionList = new vscode.CompletionList<ICompletionItem>([], isIncomplete)
	completionList.items = completionList.items
		.concat(variants)
		.concat(utilities)
		.concat(shortcss)
		.concat(arbitraryValue)
		.concat(arbitraryProperty)
		.concat(arbitraryVariant)
	return completionList
}

function variantsCompletion(
	document: TextDocument,
	text: string,
	position: number,
	offset: number,
	kind: ExtractedTokenKind,
	suggestion: ReturnType<typeof parser.suggest>,
	state: TailwindLoader,
	{ preferVariantWithParentheses }: ServiceOptions,
) {
	const a = suggestion.target?.range[0] ?? 0
	const b = suggestion.target?.range[1] ?? 0
	const nextCharacter = text.charCodeAt(position)
	const userVariants = new Set(suggestion.variants)

	let variantItems: ICompletionItem[] = []
	let variantEnabled = true

	if (suggestion.inComment) variantEnabled = false
	if (suggestion.target) {
		switch (suggestion.target.type) {
			case parser.NodeType.SimpleVariant:
				break
			case parser.NodeType.ArbitraryVariant:
				if (position !== b) variantEnabled = false
				break
			case parser.NodeType.ShortCss:
			case parser.NodeType.ArbitraryClassname:
			case parser.NodeType.ArbitraryProperty:
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
		if (suggestion.target.type === parser.NodeType.SimpleVariant) {
			if (position > a && position < b) {
				doReplace(variantItems, document, offset, a, b, item => item.label)
			} else if (preferVariantWithParentheses && position === a) {
				doInsert(variantItems, document, offset, a, item => item.label)
			} else if (position === b) {
				doInsert(variantItems, document, offset, b, item => item.label)
			}
		} else if (
			suggestion.target.type === parser.NodeType.ClassName ||
			suggestion.target.type === parser.NodeType.ShortCss ||
			suggestion.target.type === parser.NodeType.ArbitraryClassname
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
	kind: ExtractedTokenKind,
	suggestion: ReturnType<typeof parser.suggest>,
	state: TailwindLoader,
	_: ServiceOptions,
) {
	const a = suggestion.target?.range[0] ?? 0
	const b = suggestion.target?.range[1] ?? 0
	const value = suggestion.value
	let classNameItems: ICompletionItem[] = []
	let classNameEnabled = true

	if (kind === ExtractedTokenKind.TwinCssProperty) {
		classNameEnabled = false
	}

	if (suggestion.inComment) {
		classNameEnabled = false
	}

	if (suggestion.target) {
		switch (suggestion.target.type) {
			case parser.NodeType.SimpleVariant:
			case parser.NodeType.ArbitraryVariant: {
				if (position < b) classNameEnabled = false
				break
			}
			case parser.NodeType.ShortCss:
			case parser.NodeType.ArbitraryProperty:
				classNameEnabled = false
				break
		}
	}

	if (classNameEnabled) {
		classNameItems = state.provideUtilities()
	}

	const next = text.slice(b, b + 1)
	const nextNotSpace = next !== "" && next.match(/[\s)]/) == null

	if (suggestion.target) {
		if (position > a && position < b) {
			let shrinkB = b
			if (
				suggestion.target.type === parser.NodeType.ClassName ||
				suggestion.target.type === parser.NodeType.ArbitraryClassname
			) {
				const p = state.tw.getPlugin(value)
				if (p && /Color|fill|stroke/.test(p.getName())) {
					const slash = value.lastIndexOf("/")
					if (slash !== -1) shrinkB += slash - value.length
				}
			}

			for (let i = 0; i < classNameItems.length; i++) {
				const item = classNameItems[i]
				item.insertText = item.label + (nextNotSpace ? " " : "")
				const y = item.kind === vscode.CompletionItemKind.Color && item.documentation ? shrinkB : b
				item.range = new vscode.Range(document.positionAt(offset + a), document.positionAt(offset + y))
			}
		} else if (position === a) {
			doInsert(classNameItems, document, offset, a, item => item.label + " ")
		} else if (position === b) {
			if (
				suggestion.target.type === parser.NodeType.ClassName ||
				suggestion.target.type === parser.NodeType.ArbitraryClassname ||
				value === state.separator
			) {
				doReplace(classNameItems, document, offset, a, b, item => {
					return item.label + (nextNotSpace ? " " : "")
				})
			} else if (suggestion.target.type === parser.NodeType.SimpleVariant) {
				doInsert(classNameItems, document, offset, b, item => item.label + (nextNotSpace ? " " : ""))
			}
		} else {
			classNameItems.length = 0
		}
	}

	return classNameItems
}

function isTextEdit(te: lsp.TextEdit | lsp.InsertReplaceEdit | undefined): te is lsp.TextEdit {
	if (te === undefined) return false
	return (te as lsp.TextEdit).range !== undefined
}

const cssLanguageSrv = getCSSLanguageService()
function getCssDeclarationCompletionList(
	document: TextDocument,
	position: number,
	offset: number,
	start: number,
	css: string | [prop: string, value: string],
): ICompletionItem[] {
	const code = Array.isArray(css) ? `.generated {${css[0]}: ${css[1]}}` : `.generated {${css}}`
	let delta = 12
	if (Array.isArray(css)) {
		delta = delta + css[0].length + 2
	}
	const doc = LspTextDocument.create("generated", "css", 0, code)
	const sheet = cssLanguageSrv.parseStylesheet(doc)
	const list = cssLanguageSrv.doComplete(doc, doc.positionAt(delta + position - start), sheet)
	offset += start
	return list.items.map<ICompletionItem>(item => {
		const c: ICompletionItem = {
			data: { type: "css" },
			label: item.label,
			sortText: item.sortText,
			detail: item.detail,
			command: item.command,
			tags: item.tags,
			commitCharacters: item.commitCharacters,
			preselect: item.preselect,
		}
		if (isTextEdit(item.textEdit)) {
			const start = doc.offsetAt(item.textEdit.range.start) - delta
			const end = doc.offsetAt(item.textEdit.range.end) - delta
			const range = new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + end))
			c.insertText = item.textEdit.newText
			if (c.insertText.endsWith(";")) {
				c.insertText = c.insertText.slice(0, -1)
			}
			c.range = range
			if (item.insertTextFormat === lsp.InsertTextFormat.Snippet) {
				c.insertText = new vscode.SnippetString(c.insertText)
			}
			item.textEdit = undefined
		}
		if (item.kind) {
			c.kind = item.kind - 1
		}
		if (item.documentation) {
			if (typeof item.documentation !== "string") {
				c.documentation = new vscode.MarkdownString(item.documentation.value)
			} else {
				c.documentation = item.documentation
			}
		}
		return c
	})
}

const scssLanguageSrv = getCSSLanguageService()
function getScssSelectorCompletionList(
	document: TextDocument,
	position: number,
	offset: number,
	start: number,
	code: string,
): ICompletionItem[] {
	const doc = LspTextDocument.create("generated", "css", 0, code)
	const sheet = scssLanguageSrv.parseStylesheet(doc)
	const list = scssLanguageSrv.doComplete(doc, doc.positionAt(position - start), sheet)
	offset += start
	return list.items.map<ICompletionItem>(item => {
		const c: ICompletionItem = {
			data: { type: "css" },
			label: item.label,
			sortText: item.sortText,
			detail: item.detail,
			command: item.command,
			tags: item.tags,
			commitCharacters: item.commitCharacters,
			preselect: item.preselect,
		}
		if (isTextEdit(item.textEdit)) {
			const start = doc.offsetAt(item.textEdit.range.start)
			const end = doc.offsetAt(item.textEdit.range.end)
			const range = new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + end))
			c.insertText = item.textEdit.newText
			if (c.insertText.endsWith(";")) {
				c.insertText = c.insertText.slice(0, -1)
			}
			c.range = range
			if (item.insertTextFormat === lsp.InsertTextFormat.Snippet) {
				c.insertText = new vscode.SnippetString(c.insertText)
			}
			item.textEdit = undefined
		}
		if (item.kind) {
			c.kind = item.kind - 1
		}
		if (item.documentation) {
			if (typeof item.documentation !== "string") {
				c.documentation = new vscode.MarkdownString(item.documentation.value)
			} else {
				c.documentation = item.documentation
			}
		}
		return c
	})
}

function arbitraryVariantCompletion(
	document: TextDocument,
	text: string,
	position: number,
	offset: number,
	kind: ExtractedTokenKind,
	suggestion: ReturnType<typeof parser.suggest>,
	state: TailwindLoader,
	_: ServiceOptions,
) {
	if (!suggestion.target) return []
	if (suggestion.inComment) return []
	if (nodes.NodeType.ArbitraryVariant !== suggestion.target.type) return []
	const selector = suggestion.target.selector
	if (position < selector.range[0] || position > selector.range[1]) return []
	return getScssSelectorCompletionList(document, position, offset, selector.range[0], selector.value)
}

function shortcssCompletion(
	document: TextDocument,
	text: string,
	position: number,
	offset: number,
	kind: ExtractedTokenKind,
	suggestion: ReturnType<typeof parser.suggest>,
	state: TailwindLoader,
	_: ServiceOptions,
) {
	const a = suggestion.target?.range[0] ?? 0
	let b = suggestion.target?.range[1] ?? 0
	const value = suggestion.value

	let cssPropItems: ICompletionItem[] = []
	let cssPropEnabled = true

	if (suggestion.inComment) {
		cssPropEnabled = false
	}

	if (suggestion.target) {
		if (suggestion.target.type === parser.NodeType.SimpleVariant) {
			b = b + state.separator.length
			const isVariantWord = state.tw.isVariant(value)
			if (position === b && !isVariantWord) {
				cssPropEnabled = false
			}
		} else if (suggestion.target.type === parser.NodeType.ShortCss) {
			const [a, b] = suggestion.target.expr.range
			if (position >= a && position <= b) {
				cssPropEnabled = false
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
		if (suggestion.target.type === parser.NodeType.ShortCss) {
			const [start, end] = suggestion.target.range
			if (position > start && position <= end) {
				doReplace(cssPropItems, document, offset, a, b, item => new vscode.SnippetString(item.label + "[$0]"))
			} else if (position === start) {
				doInsert(cssPropItems, document, offset, a, item => new vscode.SnippetString(item.label + "[$0] "))
			}
		} else if (suggestion.target.type === parser.NodeType.SimpleVariant) {
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

	let cssValueItems: ICompletionItem[] = []
	if (suggestion.target && suggestion.target.type === parser.NodeType.ShortCss) {
		cssValueItems = getCssDeclarationCompletionList(document, position, offset, suggestion.target.expr.range[0], [
			suggestion.target.prop.value,
			suggestion.target.expr.value,
		])
	}
	return cssPropItems.concat(cssValueItems)
}

function arbitraryPropertyCompletion(
	document: TextDocument,
	text: string,
	position: number,
	offset: number,
	kind: ExtractedTokenKind,
	suggestion: ReturnType<typeof parser.suggest>,
	state: TailwindLoader,
	_: ServiceOptions,
) {
	if (!suggestion.target) return []
	if (suggestion.inComment) return []
	if (nodes.NodeType.ArbitraryProperty !== suggestion.target.type) return []
	if (position <= suggestion.target.range[0] || position >= suggestion.target.range[1]) return []
	return getCssDeclarationCompletionList(
		document,
		position,
		offset,
		suggestion.target.range[0] + 1,
		suggestion.target.decl.value,
	)
}

const mappingArbitraryProp: Record<string, string[]> = {
	"inset-": ["top", "right", "bottom", "left"],
	"inset-x-": ["left", "right"],
	"inset-y-": ["top", "bottom"],
	"top-": ["top"],
	"right-": ["right"],
	"bottom-": ["bottom"],
	"left-": ["left"],
	"z-": ["z-index"],
	"order-": ["order"],
	"grid-cols-": ["grid-template-columns"],
	"grid-rows-": ["grid-template-rows"],
	"auto-cols-": ["grid-auto-columns"],
	"auto-rows-": ["grid-auto-rows"],
	"col-": ["grid-column"],
	"row-": ["grid-row"],
	"columns-": ["columns"],
	"m-": ["margin"],
	"mt-": ["margin-top"],
	"mr-": ["margin-right"],
	"mb-": ["margin-buttom"],
	"ml-": ["margin-left"],
	"mx-": ["margin-left", "margin-right"],
	"my-": ["margin-top", "margin-bottm"],
	"space-x-": ["margin-left"],
	"space-y-": ["margin-top"],
	"p-": ["padding"],
	"pt-": ["padding-top"],
	"pr-": ["padding-right"],
	"pb-": ["padding-bottm"],
	"pl-": ["padding-left"],
	"px-": ["padding-left", "padding-right"],
	"py-": ["padding-top", "padding-bottm"],
	"aspect-": ["aspect-ratio"],
	"h-": ["height"],
	"w-": ["width"],
	"max-h-": ["max-height"],
	"min-h-": ["min-height"],
	"max-w-": ["max-width"],
	"min-w-": ["min-width"],
	"flex-": ["flex"],
	"flex-shrink-": ["flex-shrink"],
	"shrink-": ["flex-shrink"],
	"flex-grow-": ["flex-grow"],
	"grow-": ["flex-grow"],
	"basis-": ["flex-basis"],
	"gap-": ["gap"],
	"gap-x-": ["column-gap"],
	"gap-y-": ["row-gap"],
	"origin-": ["transform-origin"],
	"cursor-": ["cursor"],
	"scroll-m-": ["scroll-margin"],
	"scroll-mt-": ["scroll-margin-top"],
	"scroll-mr-": ["scroll-margin-right"],
	"scroll-mb-": ["scroll-margin-buttom"],
	"scroll-ml-": ["scroll-margin-left"],
	"scroll-mx-": ["scroll-margin-left", "scroll-margin-right"],
	"scroll-my-": ["scroll-margin-top", "scroll-margin-buttom"],
	"scroll-p-": ["scroll-padding"],
	"scroll-pt-": ["scroll-padding-top"],
	"scroll-pr-": ["scroll-padding-right"],
	"scroll-pb-": ["scroll-padding-bottm"],
	"scroll-pl-": ["scroll-padding-left"],
	"scroll-px-": ["scroll-padding-left", "scroll-padding-right"],
	"scroll-py-": ["scroll-padding-top", "scroll-padding-bottm"],
	"list-": ["list-style-type"],
	"rounded-": ["border-radius"],
	"rounded-bl-": ["border-bottom-left-radius"],
	"rounded-br-": ["border-bottom-right-radius"],
	"rounded-tl-": ["border-top-left-radius"],
	"rounded-tr-": ["border-top-right-radius"],
	"rounded-t-": ["border-top-left-radius", "border-top-right-radius"],
	"rounded-r-": ["border-top-right-radius", "border-bottom-right-radius"],
	"rounded-b-": ["border-bottom-left-radius", "border-bottom-right-radius"],
	"rounded-l-": ["border-top-left-radius", "border-bottom-left-radius"],
	"border-opacity-": ["opacity"],
	"border-": ["border-width", "border-color"],
	"border-t-": ["border-top-width", "border-top-color"],
	"border-r-": ["border-right-width", "border-right-color"],
	"border-b-": ["border-bottom-width", "border-bottom-color"],
	"border-l-": ["border-left-width", "border-left-color"],
	"border-x-": ["border-left-width", "border-right-width", "border-left-color", "border-right-color"],
	"border-y-": ["border-top-width", "border-bottom-width", "border-top-color", "border-bottom-color"],
	"divide-": ["border-color"],
	"divide-opacity-": ["opacity"],
	"divide-x-": ["border-left-width", "border-right-width"],
	"divide-y-": ["border-top-width", "border-bottom-width"],
	"bg-": ["background-color", "background-image", "background-position", "background-size"],
	"bg-opacity-": ["opacity"],
	"from-": ["background-color"],
	"via-": ["background-color"],
	"to-": ["background-color"],
	"object-": ["object-position"],
	"fill-": ["fill"],
	"stroke-": ["stroke", "stroke-width"],
	"text-": ["color", "font-size"],
	"text-opacity-": ["opacity"],
	"font-": ["font-family", "font-weight"],
	"leading-": ["line-height"],
	"tracking-": ["letter-spacing"],
	"decoration-": ["text-decoration-color", "text-decoration-thickness"],
	"underline-offset-": ["text-underline-offset"],
	"indent-": ["text-indent"],
	"placeholder-": ["color"],
	"placeholder-opacity-": ["opacity"],
	"caret-": ["caret-color"],
	"accent-": ["accent-color"],
	"ring-opacity-": ["opacity"],
	"ring-": ["padding", "color"],
	"ring-offset-": ["padding", "color"],
	"outline-": ["outline-width", "outline-color"],
	"outline-offset-": ["outline-offset"],
	"delay-": ["transition-delay"],
	"duration-": ["transition-duration"],
	"transition-": ["transition-property"],
	"ease-": ["transition-timing-function"],
	"will-change-": ["will-change"],
	"content-": ["content"],
	"animate-": ["animation"],
	"shadow-": ["box-shadow"],
	"drop-shadow-": ["box-shadow"],
	"translate-x-": ["padding"],
	"translate-y-": ["padding"],
	"rotate-": ["order"],
	"skew-x-": ["order"],
	"skew-y-": ["order"],
	"scale-": ["order"],
	"scale-x-": ["order"],
	"scale-y-": ["order"],
	"opacity-": ["opacity"],
	"blur-": ["padding"],
	"brightness-": ["order"],
	"contrast-": ["order"],
	"grayscale-": ["order"],
	"hue-rotate-": ["order"],
	"invert-": ["order"],
	"saturate-": ["order"],
	"sepia-": ["order"],
	"backdrop-opacity-": ["opacity"],
	"backdrop-blur-": ["padding"],
	"backdrop-brightness-": ["order"],
	"backdrop-contrast-": ["order"],
	"backdrop-grayscale-": ["order"],
	"backdrop-hue-rotate-": ["order"],
	"backdrop-invert-": ["order"],
	"backdrop-saturate-": ["order"],
	"backdrop-sepia-": ["order"],
	"border-spacing-": ["border-spacing"],
	"border-spacing-x-": ["border-spacing"],
	"border-spacing-y-": ["border-spacing"],
	// "<opacity>": ["opacity"],
	// "<number>": ["order"],
	// "<angle>": ["order"],
	// "<percentage>": ["order"],
	// "<length>": ["padding"],
}

function arbitraryValueCompletion(
	document: TextDocument,
	text: string,
	position: number,
	offset: number,
	kind: ExtractedTokenKind,
	suggestion: ReturnType<typeof parser.suggest>,
	state: TailwindLoader,
	_: ServiceOptions,
) {
	if (!suggestion.target) return []
	if (suggestion.inComment) return []
	if (nodes.NodeType.ArbitraryClassname !== suggestion.target.type) return []
	const expr = suggestion.target.expr
	if (!expr) return []
	if (position < expr.range[0] || position > expr.range[1]) return []
	const cssValueItems = new Map<string, ICompletionItem>()
	const prop = suggestion.target.prop.value
	const props = mappingArbitraryProp[prop]
	props.forEach(prop => {
		getCssDeclarationCompletionList(document, position, offset, expr.range[0], [prop, expr.value]).forEach(item => {
			cssValueItems.set(item.label, item)
		})
	})
	return Array.from(cssValueItems.values())
}

function twinThemeCompletion(
	document: TextDocument,
	index: number,
	token: Token,
	state: TailwindLoader,
): vscode.CompletionList<ICompletionItem> {
	const offset = token.start
	const text = token.value
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

	function formatCandidates(value: string) {
		const reg = /^[-0-9/.]+$/
		const match = value.match(reg)
		if (!match) return value
		value = match[0]
		const isNegtive = value.charCodeAt(0) === 45
		if (isNegtive) value = value.slice(1)
		let val = Number(value)
		if (Number.isNaN(val)) val = calcFraction(value)
		if (Number.isNaN(val)) return value
		return (isNegtive ? "" : "+") + (Number.isNaN(Number(value)) ? "_" : "@") + val.toFixed(3).padStart(7, "0")
	}

	const isScreen = text.startsWith("screen")

	return {
		isIncomplete: false,
		items: candidates.map(label => {
			const item: ICompletionItem = {
				label,
				sortText: isScreen
					? state.tw.screens.indexOf(label).toString().padStart(5, " ")
					: formatCandidates(label),
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
				const [a, b] = hit.range
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
	token: Token,
	state: TailwindLoader,
): vscode.CompletionList<ICompletionItem> {
	const value = state.tw.getTheme(["screens"])
	if (typeof value !== "object") {
		return { isIncomplete: false, items: [] }
	}

	const candidates = Object.keys(value)

	return {
		isIncomplete: false,
		items: candidates.map(label => {
			const index = state.tw.screens.indexOf(label)
			const item: ICompletionItem = {
				label,
				sortText: index.toString().padStart(5, " "),
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
			}

			return item
		}),
	}
}
