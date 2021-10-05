import { IPropertyData } from "vscode-css-languageservice"
import * as lsp from "vscode-languageserver"
import { ICompletionItem } from "~/common/types"
import * as languageFacts from "~/common/vscode-css-languageservice"
import { cssDataManager, getEntryDescription, units } from "~/common/vscode-css-languageservice"

function isDeprecated(entry: IPropertyData): boolean {
	if (entry.status && (entry.status === "nonstandard" || entry.status === "obsolete")) {
		return true
	}

	return false
}

export function getCompletionsForDeclarationValue(
	propertyName: string,
	currentWord: string,
	range: lsp.Range,
): ICompletionItem[] {
	const items: lsp.CompletionItem[] = []
	const entry = cssDataManager.getProperty(propertyName)
	if (entry) {
		if (entry.restrictions instanceof Array) {
			for (const restriction of entry.restrictions) {
				switch (restriction) {
					case "color":
						items.push(...getColorProposals(range))
						break
					case "position":
						items.push(...getPositionProposals(range))
						break
					case "repeat":
						items.push(...getRepeatStyleProposals(range))
						break
					case "line-style":
						items.push(...getLineStyleProposals(range))
						break
					case "line-width":
						items.push(...getLineWidthProposals(range))
						break
					case "geometry-box":
						items.push(...getGeometryBoxProposals(range))
						break
					case "box":
						items.push(...getBoxProposals(range))
						break
					case "image":
						items.push(...getImageProposals(range))
						break
					case "timing-function":
						items.push(...getTimingFunctionProposals(range))
						break
					case "shape":
						items.push(...getBasicShapeProposals(range))
						break
				}
			}
		}

		items.push(...getValueEnumProposals(range, entry))
		items.push(...getCSSWideKeywordProposals(range))
		items.push(...getUnitProposals(currentWord, range, entry.restrictions))
	}

	// TODO: apply context
	// getVariableProposals
	// getTermProposals

	for (let i = 0; i < items.length; i++) {
		items[i].data = {
			type: "cssValue",
			entry,
		}
	}

	return items as ICompletionItem[]
}

export function getCompletionsFromRestrictions(
	restrictions: string[],
	currentWord: string,
	range: lsp.Range,
): ICompletionItem[] {
	const items: lsp.CompletionItem[] = []
	for (const restriction of restrictions) {
		switch (restriction) {
			case "color":
				items.push(...getColorProposals(range))
				break
			case "position":
				items.push(...getPositionProposals(range))
				break
			case "repeat":
				items.push(...getRepeatStyleProposals(range))
				break
			case "line-style":
				items.push(...getLineStyleProposals(range))
				break
			case "line-width":
				items.push(...getLineWidthProposals(range))
				break
			case "geometry-box":
				items.push(...getGeometryBoxProposals(range))
				break
			case "box":
				items.push(...getBoxProposals(range))
				break
			case "image":
				items.push(...getImageProposals(range))
				break
			case "timing-function":
				items.push(...getTimingFunctionProposals(range))
				break
			case "shape":
				items.push(...getBasicShapeProposals(range))
				break
		}
	}

	items.push(...getUnitProposals(currentWord, range, restrictions))

	for (let i = 0; i < items.length; i++) {
		items[i].data = {
			type: "cssValue",
		}
	}

	return items as ICompletionItem[]
}

function getColorProposals(range: lsp.Range): lsp.CompletionItem[] {
	const items: lsp.CompletionItem[] = []
	for (const color in languageFacts.colors) {
		items.push({
			label: color,
			documentation: languageFacts.colors[color],
			textEdit: lsp.TextEdit.replace(range, color),
			kind: lsp.CompletionItemKind.Color,
		})
	}
	for (const color in languageFacts.colorKeywords) {
		items.push({
			label: color,
			documentation: languageFacts.colorKeywords[color],
			textEdit: lsp.TextEdit.replace(range, color),
			kind: lsp.CompletionItemKind.Value,
		})
	}

	for (const p of languageFacts.colorFunctions) {
		let tabStop = 1
		const replaceFunction = (_match: string, p1: string) => "${" + tabStop++ + ":" + p1 + "}"
		const insertText = p.func.replace(/\[?\$(\w+)\]?/g, replaceFunction)
		items.push({
			label: p.func.slice(0, p.func.indexOf("(")),
			detail: p.func,
			documentation: p.desc,
			textEdit: lsp.TextEdit.replace(range, insertText),
			insertTextFormat: lsp.InsertTextFormat.Snippet,
			kind: lsp.CompletionItemKind.Function,
		})
	}
	return items
}

function getValueEnumProposals(range: lsp.Range, entry: IPropertyData): lsp.CompletionItem[] {
	if (entry.values instanceof Array) {
		return entry.values.map<lsp.CompletionItem>(value => {
			let insertString = value.name
			let insertTextFormat: lsp.InsertTextFormat = lsp.InsertTextFormat.PlainText
			if (insertString.endsWith(")")) {
				const from = insertString.lastIndexOf("(")
				if (from !== -1) {
					insertString = insertString.slice(0, from) + "($1)"
					insertTextFormat = lsp.InsertTextFormat.Snippet
				}
			}

			let sortText = " "
			if (value.name.startsWith("-")) {
				sortText += "x"
			}

			return {
				label: value.name,
				documentation: getEntryDescription(value, true),
				tags: isDeprecated(entry) ? [lsp.CompletionItemTag.Deprecated] : [],
				textEdit: lsp.TextEdit.replace(range, insertString),
				insertTextFormat,
				sortText,
				kind: lsp.CompletionItemKind.Value,
			}
		})
	}

	return []
}

function getCSSWideKeywordProposals(range: lsp.Range): lsp.CompletionItem[] {
	return Object.entries(languageFacts.cssWideKeywords).map<lsp.CompletionItem>(([keyword, desc]) => {
		return {
			label: keyword,
			documentation: desc,
			textEdit: lsp.TextEdit.replace(range, keyword),
			kind: lsp.CompletionItemKind.Value,
		}
	})
}

function getUnitProposals(value: string, range: lsp.Range, restrictions?: string[]): lsp.CompletionItem[] {
	const items: lsp.CompletionItem[] = []
	const numMatch = value.match(/^-?\d[.\d+]*/)
	const currentWord = numMatch?.[0] ?? "0"

	for (const restriction of restrictions ?? []) {
		for (const unit of units[restriction] ?? []) {
			const insertText = currentWord + unit
			items.push({
				label: insertText,
				kind: lsp.CompletionItemKind.Unit,
				textEdit: lsp.TextEdit.replace(range, insertText),
			})
		}
	}

	return items
}

function moveCursorInsideParenthesis(text: string): string {
	return text.replace(/\(\)$/, "($1)")
}

function getPositionProposals(range: lsp.Range): lsp.CompletionItem[] {
	return Object.entries(languageFacts.positionKeywords).map<lsp.CompletionItem>(([keyword, desc]) => {
		return {
			label: keyword,
			documentation: desc,
			textEdit: lsp.TextEdit.replace(range, keyword),
			kind: lsp.CompletionItemKind.Value,
		}
	})
}

function getRepeatStyleProposals(range: lsp.Range): lsp.CompletionItem[] {
	return Object.entries(languageFacts.repeatStyleKeywords).map<lsp.CompletionItem>(([keyword, desc]) => {
		return {
			label: keyword,
			documentation: desc,
			textEdit: lsp.TextEdit.replace(range, keyword),
			kind: lsp.CompletionItemKind.Value,
		}
	})
}

function getLineStyleProposals(range: lsp.Range): lsp.CompletionItem[] {
	return Object.entries(languageFacts.lineStyleKeywords).map<lsp.CompletionItem>(([keyword, desc]) => {
		return {
			label: keyword,
			documentation: desc,
			textEdit: lsp.TextEdit.replace(range, keyword),
			kind: lsp.CompletionItemKind.Value,
		}
	})
}

function getLineWidthProposals(range: lsp.Range): lsp.CompletionItem[] {
	return languageFacts.lineWidthKeywords.map<lsp.CompletionItem>(keyword => {
		return {
			label: keyword,
			textEdit: lsp.TextEdit.replace(range, keyword),
			kind: lsp.CompletionItemKind.Value,
		}
	})
}

function getGeometryBoxProposals(range: lsp.Range): lsp.CompletionItem[] {
	return Object.entries(languageFacts.geometryBoxKeywords).map<lsp.CompletionItem>(([keyword, desc]) => {
		return {
			label: keyword,
			documentation: desc,
			textEdit: lsp.TextEdit.replace(range, keyword),
			kind: lsp.CompletionItemKind.Value,
		}
	})
}

function getBoxProposals(range: lsp.Range): lsp.CompletionItem[] {
	return Object.entries(languageFacts.boxKeywords).map<lsp.CompletionItem>(([keyword, desc]) => {
		return {
			label: keyword,
			documentation: desc,
			textEdit: lsp.TextEdit.replace(range, keyword),
			kind: lsp.CompletionItemKind.Value,
		}
	})
}

function getImageProposals(range: lsp.Range): lsp.CompletionItem[] {
	return Object.entries(languageFacts.imageFunctions).map<lsp.CompletionItem>(([keyword, desc]) => {
		const insertText = moveCursorInsideParenthesis(keyword)
		return {
			label: keyword,
			documentation: desc,
			textEdit: lsp.TextEdit.replace(range, insertText),
			kind: lsp.CompletionItemKind.Function,
			insertTextFormat: keyword !== insertText ? lsp.InsertTextFormat.Snippet : undefined,
		}
	})
}

function getTimingFunctionProposals(range: lsp.Range): lsp.CompletionItem[] {
	return Object.entries(languageFacts.transitionTimingFunctions).map<lsp.CompletionItem>(([keyword, desc]) => {
		const insertText = moveCursorInsideParenthesis(keyword)
		return {
			label: keyword,
			documentation: desc,
			textEdit: lsp.TextEdit.replace(range, insertText),
			kind: lsp.CompletionItemKind.Function,
			insertTextFormat: keyword !== insertText ? lsp.InsertTextFormat.Snippet : undefined,
		}
	})
}

function getBasicShapeProposals(range: lsp.Range): lsp.CompletionItem[] {
	return Object.entries(languageFacts.basicShapeFunctions).map<lsp.CompletionItem>(([keyword, desc]) => {
		const insertText = moveCursorInsideParenthesis(keyword)
		return {
			label: keyword,
			documentation: desc,
			textEdit: lsp.TextEdit.replace(range, insertText),
			kind: lsp.CompletionItemKind.Function,
			insertTextFormat: keyword !== insertText ? lsp.InsertTextFormat.Snippet : undefined,
		}
	})
}
