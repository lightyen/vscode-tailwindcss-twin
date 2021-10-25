import { cssDataManager } from "@/vscode-css-languageservice"
import { CompletionItemKind, CompletionItemTag, Range, SnippetString } from "vscode"
import { IPropertyData } from "vscode-css-languageservice"
import { units } from "vscode-css-languageservice/lib/esm/languageFacts/builtinData"
import { getEntryDescription } from "vscode-css-languageservice/lib/esm/languageFacts/entry"
import * as languageFacts from "vscode-css-languageservice/lib/esm/languageFacts/facts"
import type { ICompletionItem } from "~/typings/completion"

function isDeprecated(entry: IPropertyData): boolean {
	if (entry.status && (entry.status === "nonstandard" || entry.status === "obsolete")) {
		return true
	}
	return false
}

function replace(range: Range, value: string, snippet: boolean) {
	if (snippet) {
		return {
			range,
			insertText: new SnippetString(value),
		}
	}
	return {
		range,
		insertText: value,
	}
}

export function getCompletionsForDeclarationValue(
	propertyName: string,
	currentWord: string,
	range: Range,
): ICompletionItem[] {
	const items: ICompletionItem[] = []
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
	range: Range,
): ICompletionItem[] {
	const items: ICompletionItem[] = []
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

function getColorProposals(range: Range): ICompletionItem[] {
	const items: ICompletionItem[] = []
	for (const color in languageFacts.colors) {
		items.push({
			label: color,
			documentation: languageFacts.colors[color],
			...replace(range, color, false),
			kind: CompletionItemKind.Color,
			data: { type: "cssValue" },
		})
	}
	for (const color in languageFacts.colorKeywords) {
		items.push({
			label: color,
			documentation: languageFacts.colorKeywords[color],
			...replace(range, color, false),
			kind: CompletionItemKind.Value,
			data: { type: "cssValue" },
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
			...replace(range, insertText, true),
			kind: CompletionItemKind.Function,
			data: { type: "cssValue" },
		})
	}
	return items
}

function getValueEnumProposals(range: Range, entry: IPropertyData): ICompletionItem[] {
	if (entry.values instanceof Array) {
		return entry.values.map<ICompletionItem>(value => {
			let insertString = value.name
			let insertTextFormat = "PlainText"
			if (insertString.endsWith(")")) {
				const from = insertString.lastIndexOf("(")
				if (from !== -1) {
					insertString = insertString.slice(0, from) + "($1)"
					insertTextFormat = "Snippet"
				}
			}

			let sortText = " "
			if (value.name.startsWith("-")) {
				sortText += "x"
			}

			return {
				label: value.name,
				documentation: getEntryDescription(value, true)?.value,
				tags: isDeprecated(entry) ? [CompletionItemTag.Deprecated] : [],
				...replace(range, insertString, insertTextFormat === "Snippet"),
				insertTextFormat,
				sortText,
				kind: CompletionItemKind.Value,
				data: { type: "cssValue" },
			}
		})
	}

	return []
}

function getCSSWideKeywordProposals(range: Range): ICompletionItem[] {
	return Object.entries(languageFacts.cssWideKeywords).map<ICompletionItem>(([keyword, desc]) => {
		return {
			label: keyword,
			documentation: desc,
			...replace(range, keyword, false),
			kind: CompletionItemKind.Value,
			data: { type: "cssValue" },
		}
	})
}

function getUnitProposals(value: string, range: Range, restrictions?: string[]): ICompletionItem[] {
	const items: ICompletionItem[] = []
	const numMatch = value.match(/^-?\d[.\d+]*/)
	const currentWord = numMatch?.[0] ?? "0"

	for (const restriction of restrictions ?? []) {
		for (const unit of units[restriction] ?? []) {
			const insertText = currentWord + unit
			items.push({
				label: insertText,
				kind: CompletionItemKind.Unit,
				...replace(range, insertText, false),
				data: { type: "cssValue" },
			})
		}
	}

	return items
}

function moveCursorInsideParenthesis(text: string): string {
	return text.replace(/\(\)$/, "($1)")
}

function getPositionProposals(range: Range): ICompletionItem[] {
	return Object.entries(languageFacts.positionKeywords).map<ICompletionItem>(([keyword, desc]) => {
		return {
			label: keyword,
			documentation: desc,
			...replace(range, keyword, false),
			kind: CompletionItemKind.Value,
			data: { type: "cssValue" },
		}
	})
}

function getRepeatStyleProposals(range: Range): ICompletionItem[] {
	return Object.entries(languageFacts.repeatStyleKeywords).map<ICompletionItem>(([keyword, desc]) => {
		return {
			label: keyword,
			documentation: desc,
			...replace(range, keyword, false),
			kind: CompletionItemKind.Value,
			data: { type: "cssValue" },
		}
	})
}

function getLineStyleProposals(range: Range): ICompletionItem[] {
	return Object.entries(languageFacts.lineStyleKeywords).map<ICompletionItem>(([keyword, desc]) => {
		return {
			label: keyword,
			documentation: desc,
			...replace(range, keyword, false),
			kind: CompletionItemKind.Value,
			data: { type: "cssValue" },
		}
	})
}

function getLineWidthProposals(range: Range): ICompletionItem[] {
	return languageFacts.lineWidthKeywords.map<ICompletionItem>(keyword => {
		return {
			label: keyword,
			...replace(range, keyword, false),
			kind: CompletionItemKind.Value,
			data: { type: "cssValue" },
		}
	})
}

function getGeometryBoxProposals(range: Range): ICompletionItem[] {
	return Object.entries(languageFacts.geometryBoxKeywords).map<ICompletionItem>(([keyword, desc]) => {
		return {
			label: keyword,
			documentation: desc,
			...replace(range, keyword, false),
			kind: CompletionItemKind.Value,
			data: { type: "cssValue" },
		}
	})
}

function getBoxProposals(range: Range): ICompletionItem[] {
	return Object.entries(languageFacts.boxKeywords).map<ICompletionItem>(([keyword, desc]) => {
		return {
			label: keyword,
			documentation: desc,
			...replace(range, keyword, false),
			kind: CompletionItemKind.Value,
			data: { type: "cssValue" },
		}
	})
}

function getImageProposals(range: Range): ICompletionItem[] {
	return Object.entries(languageFacts.imageFunctions).map<ICompletionItem>(([keyword, desc]) => {
		const insertText = moveCursorInsideParenthesis(keyword)
		return {
			label: keyword,
			documentation: desc,
			...replace(range, insertText, keyword !== insertText),
			kind: CompletionItemKind.Function,
			data: { type: "cssValue" },
		}
	})
}

function getTimingFunctionProposals(range: Range): ICompletionItem[] {
	return Object.entries(languageFacts.transitionTimingFunctions).map<ICompletionItem>(([keyword, desc]) => {
		const insertText = moveCursorInsideParenthesis(keyword)
		return {
			label: keyword,
			documentation: desc,
			...replace(range, insertText, keyword !== insertText),
			kind: CompletionItemKind.Function,
			data: { type: "cssValue" },
		}
	})
}

function getBasicShapeProposals(range: Range): ICompletionItem[] {
	return Object.entries(languageFacts.basicShapeFunctions).map<ICompletionItem>(([keyword, desc]) => {
		const insertText = moveCursorInsideParenthesis(keyword)
		return {
			label: keyword,
			documentation: desc,
			...replace(range, insertText, keyword !== insertText),
			kind: CompletionItemKind.Function,
			data: { type: "cssValue" },
		}
	})
}
