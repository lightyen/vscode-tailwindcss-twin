// @ts-ignore TS/7016
import * as languageFacts from "vscode-css-languageservice/lib/esm/languageFacts/facts"
// @ts-ignore TS/7016
import * as nodes from "vscode-css-languageservice/lib/esm/parser/cssNodes"
// @ts-ignore TS/7016
import { Parser } from "vscode-css-languageservice/lib/esm/parser/cssParser"

const parser = new Parser()

export interface ColorFunction {
	fnName: string
	args: string[]
	raw: string
}

export type Color = string | ColorFunction

export function extractColors(value: string): Color[] {
	const colors: Color[] = []
	const node = parser.internalParse(value, parser._parseExpr.bind(parser))
	// @ts-ignore TS/7016
	node.accept(node => {
		switch (node.type) {
			case nodes.NodeType.Identifier: {
				if (node.parent?.type !== nodes.NodeType.Term) break
				const color = node.getText().toLowerCase()
				if (color === "transparent") {
					colors.push(color)
				} else if (color in languageFacts.colors) {
					colors.push(color)
				}
				break
			}
			case nodes.NodeType.HexColorValue: {
				const color = node.getText()
				if (/(^#[0-9A-F]{8}$)|(^#[0-9A-F]{6}$)|(^#[0-9A-F]{4}$)|(^#[0-9A-F]{3}$)/i.test(color)) {
					colors.push(color)
				}
				break
			}
			case nodes.NodeType.Function: {
				const fnName = node.getName()
				if (fnName && /^(rgb|rgba|hsl|hsla)/i.test(fnName)) {
					let args: string[] = node
						.getArguments()
						.getChildren() // @ts-ignore TS/7016
						.map(token => value.substr(token.offset, token.length))

					if (args.length === 1) {
						args = args[0].split(/\s+/).filter(t => t && t !== "/")
					}

					colors.push({
						fnName,
						args,
						raw: node.getText(),
					})
				}
				break
			}
		}
		return true
	})
	return colors
}
