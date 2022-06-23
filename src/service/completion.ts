import { ExtractedToken, ExtractedTokenKind, TextDocument } from "@/extractors"
import { defaultLogger as console } from "@/logger"
import * as parser from "@/parser"
import * as nodes from "@/parser/nodes"
import { cssDataManager } from "@/vscode-css-languageservice"
import * as culori from "culori"
import vscode from "vscode"
import { getCSSLanguageService } from "vscode-css-languageservice"
import { TextDocument as LspTextDocument } from "vscode-languageserver-textdocument"
import * as lsp from "vscode-languageserver-types"
import { calcFraction } from "~/common"
import type { ServiceOptions } from "~/shared"
import type { ICompletionItem } from "~/typings/completion"
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
	console.trace(`completion (${Number((end - start) / 10n ** 6n)}ms)`)
	return list

	function doComplete(result: ExtractedToken) {
		try {
			const index = document.offsetAt(position)
			const { kind, ...token } = result
			const text = token.value
			const offset = token.start
			const pos = index - token.start
			if (kind === ExtractedTokenKind.TwinTheme) {
				const list = twinThemeCompletion(document, offset, text, pos, state)
				for (let i = 0; i < list.items.length; i++) {
					list.items[i].data.uri = document.uri
				}
				return list
			} else if (kind === ExtractedTokenKind.TwinScreen) {
				const list = twinScreenCompletion(document, offset, text, pos, state)
				for (let i = 0; i < list.items.length; i++) {
					list.items[i].data.uri = document.uri
				}
				return list
			} else {
				const list = twinCompletion(document, offset, text, pos, kind, state, options)
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
	offset: number,
	text: string,
	position: number,
	kind: ExtractedTokenKind,
	state: TailwindLoader,
	options: ServiceOptions,
): vscode.CompletionList<ICompletionItem> {
	const suggestion = parser.suggest({ text, position, separator: state.separator })

	const isIncomplete = false
	const variants = variantsCompletion(document, offset, text, position, suggestion, state, options)
	const utilities = utilitiesCompletion(document, offset, text, position, kind, suggestion, state, options)
	const shortcss = shortcssCompletion(document, offset, text, position, suggestion, state, options)
	const arbitraryValue = arbitraryClassnameValueCompletion(
		document,
		offset,
		text,
		position,
		suggestion,
		state,
		options,
	)
	const arbitraryProperty = arbitraryPropertyCompletion(document, offset, text, position, suggestion, state, options)
	const arbitraryVariant = arbitraryVariantCompletion(document, offset, text, position, suggestion, state, options)
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
	offset: number,
	text: string,
	position: number,
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
			case parser.NodeType.ArbitrarySelector:
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
	offset: number,
	text: string,
	position: number,
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
			case parser.NodeType.ArbitrarySelector: {
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
		// NOTE: complete color opacities
		if (suggestion.target.type === parser.NodeType.ClassName) {
			// eslint-disable-next-line no-inner-declarations
			function formatValue(label: string) {
				const reg = /([0-9]+)/
				const match = label.match(reg)
				if (!match) return label
				const val = Number(match[1])
				if (Number.isNaN(val)) return label
				return Number.isNaN(Number(match[1])) ? "_" : "@" + val.toFixed(0).padStart(5, "0")
			}

			const slash = value.lastIndexOf("/")
			let classname = value
			if (slash !== -1) classname = value.slice(0, slash)
			const p = state.tw.getPlugin(classname)
			if (p && /Color|fill|stroke/.test(p.getName())) {
				const key = p.getName().replace(/Color$/, "Opacity") as ("opacity" | `${string}Opacity`) &
					keyof Tailwind.CorePluginFeatures
				const src1 = /Color$/.test(p.getName()) ? Object.keys(state.config.theme[key] ?? {}) : []
				const src2 = Object.keys(state.config.theme.opacity ?? {})
				const opacities = new Set(src1.concat(src2))
				classNameItems = classNameItems.concat(
					...Array.from(opacities).map<ICompletionItem>(v => ({
						label: classname + "/" + v,
						sortText: "~" + classname + "/" + formatValue(v),
						data: { type: "utility" },
					})),
				)
			}
		}

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
	offset: number,
	text: string,
	position: number,
	exprRange: [start: number, end: number],
	css: string | [prop: string, value: string],
	state: TailwindLoader,
): ICompletionItem[] {
	for (const t of parser.parse_theme({ text, start: exprRange[0], end: exprRange[1] })) {
		if (position >= t.innerRange[0] && position <= t.innerRange[1]) {
			return twinThemeCompletion(document, offset, text, position, state, t.innerRange).items
		}
	}

	const code = Array.isArray(css) ? `.generated {${css[0]}: ${css[1]}}` : `.generated {${css}}`
	let delta = 12
	if (Array.isArray(css)) {
		delta = delta + css[0].length + 2
	}
	const doc = LspTextDocument.create("generated", "css", 0, code)
	const sheet = cssLanguageSrv.parseStylesheet(doc)
	const list = cssLanguageSrv.doComplete(doc, doc.positionAt(delta + position - exprRange[0]), sheet)
	const bias = offset + exprRange[0]
	const items = list.items.map<ICompletionItem>(item => {
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
			const range = new vscode.Range(document.positionAt(bias + start), document.positionAt(bias + end))
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

	if (code.indexOf(":") > 0) {
		if (items.length > 0) {
			items.push({
				data: { type: "css" },
				label: "theme()",
				documentation: "Evaluates the value from tailwind theme configuration.",
				insertText: new vscode.SnippetString("theme($1)"),
				command: { title: "Suggest", command: "editor.action.triggerSuggest" },
				range: items[0].range,
				kind: vscode.CompletionItemKind.Function,
			})
		}
	}
	return items
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
	offset: number,
	text: string,
	position: number,
	suggestion: ReturnType<typeof parser.suggest>,
	state: TailwindLoader,
	_: ServiceOptions,
) {
	if (!suggestion.target) return []
	if (suggestion.inComment) return []
	if (nodes.NodeType.ArbitrarySelector !== suggestion.target.type) return []
	const selector = suggestion.target.selector
	if (position < selector.range[0] || position > selector.range[1]) return []
	return getScssSelectorCompletionList(document, position, offset, selector.range[0], selector.value)
}

function shortcssCompletion(
	document: TextDocument,
	offset: number,
	text: string,
	position: number,
	suggestion: ReturnType<typeof parser.suggest>,
	state: TailwindLoader,
	_: ServiceOptions,
) {
	if (!suggestion.target) return []
	if (suggestion.inComment) return []
	const a = suggestion.target?.range[0] ?? 0
	const b = suggestion.target?.range[1] ?? 0

	let cssPropEnabled = true

	if (suggestion.inComment) {
		cssPropEnabled = false
	}

	if (suggestion.target) {
		if (suggestion.target.type === parser.NodeType.ShortCss) {
			const [a, b] = suggestion.target.expr.range
			if (position >= a && position <= b) {
				cssPropEnabled = false
			}
		}
	}

	let items: ICompletionItem[] = []
	if (cssPropEnabled) {
		let data = ""
		if (suggestion.target.type === parser.NodeType.ShortCss) {
			data = suggestion.target.expr.value
		}

		items = cssDataManager.getProperties().map(entry => ({
			label: entry.name,
			sortText: "~~~~" + entry.name,
			kind: vscode.CompletionItemKind.Field,
			insertText: new vscode.SnippetString(`[${entry.name}: ${data}$0]`),
			command: {
				title: "Suggest",
				command: "editor.action.triggerSuggest",
			},
			data: {
				type: "cssProp",
				entry,
			},
		}))

		items = items.concat(
			Array.from(state.tw.variables).map(label => {
				const item: ICompletionItem = {
					label,
					data: { type: "cssProp" },
					sortText: "~~~~~" + label,
					kind: vscode.CompletionItemKind.Field,
					insertText: new vscode.SnippetString(`[${label}: ${data}$0]`),
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
			if (position > a && position <= b) {
				for (const item of items) {
					item.range = new vscode.Range(document.positionAt(offset + a), document.positionAt(offset + b))
				}
			} else if (position === a) {
				doInsert(items, document, offset, a, item => new vscode.SnippetString(`[${item.label}: $0] `))
			}
		} else if (suggestion.target.type === parser.NodeType.SimpleVariant) {
			if (position > a && position < b) {
				doReplace(items, document, offset, a, b, item => new vscode.SnippetString(`[${item.label}: $0]`))
			} else if (position === a) {
				doInsert(items, document, offset, a, item => new vscode.SnippetString(`[${item.label}: $0] `))
			} else {
				doInsert(items, document, offset, b, item => new vscode.SnippetString(`[${item.label}: $0] `))
			}
		} else {
			if (position > a && position <= b) {
				doReplace(items, document, offset, a, b, item => new vscode.SnippetString(`[${item.label}: $0]`))
			} else if (position === a) {
				doInsert(items, document, offset, a, item => new vscode.SnippetString(`[${item.label}: $0] `))
			}
		}

		if (
			suggestion.target.type === parser.NodeType.ShortCss &&
			position >= suggestion.target.expr.range[0] &&
			position <= suggestion.target.expr.range[1]
		) {
			items = items.concat(
				getCssDeclarationCompletionList(
					document,
					offset,
					text,
					position,
					suggestion.target.expr.range,
					[suggestion.target.prefix.value, suggestion.target.expr.value],
					state,
				),
			)
		}
	}

	return items
}

function arbitraryPropertyCompletion(
	document: TextDocument,
	offset: number,
	text: string,
	position: number,
	suggestion: ReturnType<typeof parser.suggest>,
	state: TailwindLoader,
	_: ServiceOptions,
) {
	if (suggestion.inComment) return []

	if (suggestion.target && suggestion.target.type === nodes.NodeType.ArbitraryProperty) {
		if (position > suggestion.target.range[0] && position < suggestion.target.range[1]) {
			return getCssDeclarationCompletionList(
				document,
				offset,
				text,
				position,
				[suggestion.target.range[0] + 1, suggestion.target.range[1] - 1],
				suggestion.target.decl.value,
				state,
			)
		}
	}

	if (suggestion.target) return []

	let items: ICompletionItem[] = cssDataManager.getProperties().map(entry => ({
		label: entry.name,
		sortText: "~~~~" + entry.name,
		kind: vscode.CompletionItemKind.Field,
		insertText: new vscode.SnippetString(`[${entry.name}: $0]`),
		command: {
			title: "Suggest",
			command: "editor.action.triggerSuggest",
		},
		data: {
			type: "cssProp",
			entry,
		},
	}))

	items = items.concat(
		Array.from(state.tw.variables).map(label => {
			const item: ICompletionItem = {
				label,
				data: { type: "cssProp" },
				sortText: "~~~~~" + label,
				kind: vscode.CompletionItemKind.Field,
				insertText: new vscode.SnippetString(`[${label}: $0]`),
				command: {
					title: "Suggest",
					command: "editor.action.triggerSuggest",
				},
				detail: "variable",
			}
			return item
		}),
	)

	return items
}

function arbitraryClassnameValueCompletion(
	document: TextDocument,
	offset: number,
	text: string,
	position: number,
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
	let prefix = suggestion.target.prefix.value
	if (prefix[0] === "-") prefix = prefix.slice(1)
	if (prefix.startsWith(state.tw.prefix)) prefix = prefix.slice(state.tw.prefix.length)
	const props = state.tw.arbitrary[prefix]
	if (!props) return []

	props.forEach(prop => {
		getCssDeclarationCompletionList(
			document,
			offset,
			text,
			position,
			expr.range,
			[prop, expr.value],
			state,
		).forEach(item => {
			cssValueItems.set(item.label, item)
		})
	})
	return Array.from(cssValueItems.values())
}

function twinThemeCompletion(
	document: TextDocument,
	offset: number,
	text: string,
	position: number,
	state: TailwindLoader,
	[start, end]: [start: number, end: number] = [0, text.length],
): vscode.CompletionList<ICompletionItem> {
	const { suffix, others, path } = parser.parse_theme_val({ text, start, end })
	if (others && position > others.range[0]) return { items: [] }
	if (suffix && position > suffix.range[0]) return { items: [] }
	if (path[0] && path[0].value.length !== path[0].range[1] - path[0].range[0]) return { items: [] }
	const i = path.findIndex(p => position >= p.range[0] && position <= p.range[1])
	if (i === -1 && path.length !== 0) return { items: [] }
	const keys = path.slice(0, i).map(p => p.value)
	const obj = parser.resolveThemeConfig(state.config, keys)
	if (typeof obj !== "object") return { items: [] }

	const hit = path[i]
	const candidates = Object.keys(obj)
	const isScreen = path[0] && path[0].value === "screen"

	const items = candidates.map<ICompletionItem>(label => {
		const value = parser.resolveThemeConfig(state.config, [...keys, label])
		const item: ICompletionItem = {
			label,
			sortText: isScreen ? state.tw.screens.indexOf(label).toString().padStart(5, " ") : formatCandidates(label),
			data: { type: "theme" },
		}

		if (typeof value === "object") {
			item.kind = vscode.CompletionItemKind.Module
			item.documentation = new vscode.MarkdownString(
				`\`\`\`text\n${parser.resolveThemeString(value, suffix?.value)}\n\`\`\``,
			)
			item.detail = label
		} else if (typeof value === "function") {
			item.kind = vscode.CompletionItemKind.Function
			item.documentation = new vscode.MarkdownString(
				`\`\`\`text\n${parser.resolveThemeString(value, suffix?.value)}\n\`\`\``,
			)
			item.detail = label
		} else {
			if (typeof value === "string") {
				const color = culori.parse(parser.resolveThemeString(value, suffix?.value))
				if (value === "transparent") {
					item.kind = vscode.CompletionItemKind.Color
					item.documentation = "rgba(0, 0, 0, 0.0)"
					return item
				}
				if (color) {
					item.kind = vscode.CompletionItemKind.Color
					item.documentation = culori.formatHex(color)
				} else {
					item.kind = vscode.CompletionItemKind.Constant
					item.documentation = new vscode.MarkdownString(`\`\`\`txt\n${value}\n\`\`\``)
					item.detail = label
				}
			}
		}

		if (hit) {
			const [a, b] = hit.range
			if (label.match(/[-./]/)) {
				item.insertText = `[${label}]`
				item.filterText = item.insertText
				if (text.charCodeAt(a) === 46) item.filterText = "." + item.insertText
			} else {
				item.insertText = keys.length > 0 ? "." + label : label
				item.filterText = item.insertText
				if (text.charCodeAt(a) === 91) item.filterText = `[${label}]`
			}
			item.range = new vscode.Range(document.positionAt(offset + a), document.positionAt(offset + b))
		}

		return item
	})

	return { items }

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
}

function twinScreenCompletion(
	document: TextDocument,
	offset: number,
	text: string,
	position: number,
	state: TailwindLoader,
): vscode.CompletionList<ICompletionItem> {
	const value = parser.resolveThemeConfig(state.config, ["screens"])
	if (typeof value !== "object") {
		return { isIncomplete: false, items: [] }
	}

	const candidates = Object.keys(value)
	const items = candidates.map<ICompletionItem>(label => {
		const index = state.tw.screens.indexOf(label)
		const item: ICompletionItem = {
			label,
			sortText: index.toString().padStart(5, " "),
			data: { type: "theme" },
		}
		const value = parser.resolveThemeConfig(state.config, ["screens", label])
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
				if (value === "transparent") {
					item.kind = vscode.CompletionItemKind.Color
					item.documentation = "rgba(0, 0, 0, 0.0)"
					item.data = { type: "color" }
					return item
				}
				const color = culori.parse(value)
				if (color) {
					item.kind = vscode.CompletionItemKind.Color
					item.documentation = value
				} else {
					item.kind = vscode.CompletionItemKind.Constant
					item.documentation = new vscode.MarkdownString(`\`\`\`txt\n${value}\n\`\`\``)
					item.detail = label
				}
			}
		}

		text = text.trim()
		if (text) {
			item.insertText = label
			item.range = new vscode.Range(document.positionAt(offset), document.positionAt(offset + text.length))
		}

		return item
	})
	return { items }
}
