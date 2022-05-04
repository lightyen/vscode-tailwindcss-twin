import resolveConfig from "tailwindcss/resolveConfig"
import * as nodes from "vscode-css-languageservice/lib/esm/parser/cssNodes"
import { Parser } from "vscode-css-languageservice/lib/esm/parser/cssParser"
import { dlv } from "../../../common/get_set"
import parseThemeValue from "../../../common/parseThemeValue"
import { Context } from "../_base"

function isBinaryExpression(node: nodes.Node): node is nodes.BinaryExpression {
	return node.type === nodes.NodeType.BinaryExpression
}

function isTerm(node: nodes.Node): node is nodes.Term {
	return node.type === nodes.NodeType.Term
}

function isFunction(node: nodes.Node): node is nodes.Function {
	return node.type === nodes.NodeType.Function
}

const context = { config: resolveConfig({}) }

function unquote(value: string) {
	if (value.length < 2) return value
	const quote = value[0]
	if (quote !== value[value.length - 1]) return value
	if (quote != '"' && quote != "'") return value
	return value.slice(1, -1)
}

function getTheme(value: string, defaultValue = ""): string {
	const result = parseThemeValue(unquote(value))
	const val = dlv(context.config.theme, result.keys())
	if (typeof val === "string") return val
	return val?.DEFAULT ?? unquote(defaultValue)
}

function parse(context: Context, value: string, stopOnComma?: boolean | undefined): nodes.Expression | null {
	if (!value) return null
	const textProvider = (offset: number, length: number) => value.slice(offset, offset + length)
	const parser = new Parser()

	parser.scanner.setSource(value)
	parser.token = parser.scanner.scan()
	const node = parser._parseExpr.call(parser, stopOnComma)
	if (node) {
		node.textProvider = textProvider
		const values: string[] = []
		let hasThemeValue = false
		node.getChildren().forEach(node => {
			if (isBinaryExpression(node)) node = node.getChild(0) ?? node
			if (isTerm(node)) node = node.getChild(0) ?? node
			if (isFunction(node) && node.getName() === "theme") {
				values.push(
					getTheme(
						node.getArguments().getChild(0)?.getText() ?? "",
						node.getArguments().getChild(1)?.getText(),
					),
				)
				hasThemeValue = true
				return
			}
			values.push(node.getText())
		})
		if (hasThemeValue) return parse(context, values.join(" "))
	}
	return node
}

function parseArray(context: Context, value: string): nodes.Expression[] {
	const expressions: nodes.Expression[] = []
	if (!value) expressions
	const textProvider = (offset: number, length: number) => value.slice(offset, offset + length)
	const parser = new Parser()

	const cssValues: string[] = []
	let hasThemeValue = false
	parser.scanner.setSource(value)
	parser.token = parser.scanner.scan()
	let node = parser._parseExpr.call(parser, true)
	if (node) {
		node.textProvider = textProvider
		const values: string[] = []
		node.getChildren().forEach(node => {
			if (isBinaryExpression(node)) node = node.getChild(0) ?? node
			if (isTerm(node)) node = node.getChild(0) ?? node
			if (isFunction(node) && node.getName() === "theme") {
				values.push(
					getTheme(
						node.getArguments().getChild(0)?.getText() ?? "",
						node.getArguments().getChild(1)?.getText(),
					),
				)
				hasThemeValue = true
				return
			}
			values.push(node.getText())
		})
		cssValues.push(values.join(" "))
	}

	while (node) {
		expressions.push(node)
		parser.consumeToken()
		parser.token = parser.scanner.scan()
		node = parser._parseExpr.call(parser, true)
		if (node) {
			node.textProvider = textProvider
			const values: string[] = []
			node.getChildren().forEach(node => {
				if (isBinaryExpression(node)) node = node.getChild(0) ?? node
				if (isTerm(node)) node = node.getChild(0) ?? node
				if (isFunction(node) && node.getName() === "theme") {
					values.push(
						getTheme(
							node.getArguments().getChild(0)?.getText() ?? "",
							node.getArguments().getChild(1)?.getText(),
						),
					)
					hasThemeValue = true
					return
				}
				values.push(node.getText())
			})
			cssValues.push(values.join(" "))
		}
	}

	if (hasThemeValue) return parseArray(context, cssValues.join(", "))
	return expressions
}

test("parse css", () => {
	const input = ` var() theme('borderColor') , theme('colors.red.600')  `
	const arr = parseArray(context, input)
	arr.forEach(a => {
		// console.log(a.getText())
	})
})
