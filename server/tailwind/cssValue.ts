import { isColorValue } from "vscode-css-languageservice/lib/esm/languageFacts/colors"
import * as languageFacts from "vscode-css-languageservice/lib/esm/languageFacts/facts"
import * as nodes from "vscode-css-languageservice/lib/esm/parser/cssNodes"
import { Parser } from "vscode-css-languageservice/lib/esm/parser/cssParser"

export enum ValueType {
	Any,
	Color,
	Length,
	Angle,
	List,
}

const parser = new Parser()

export function parserCssValue(text: string): nodes.Node | null {
	const node = parser.internalParse(text, parser._parseTerm.bind(parser))
	if (node == null) {
		return null
	}
	return node
}

export function getValueType(value: string) {
	let node = parserCssValue(value)
	if (node) {
		if (node.expression) {
			node = node.expression
		}

		if (isColorValue(node)) {
			return ValueType.Color
		}

		if (node.getValue) {
			const value = node.getValue()
			if (value.unit != null && languageFacts.units.length.indexOf(value.unit.toLowerCase()) !== -1) {
				return ValueType.Length
			}
		}
	}

	return ValueType.Any
}
