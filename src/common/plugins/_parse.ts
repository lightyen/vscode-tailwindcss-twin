import * as languageFacts from "vscode-css-languageservice/lib/esm/languageFacts/facts"
import * as nodes from "vscode-css-languageservice/lib/esm/parser/cssNodes"
import { Parser } from "vscode-css-languageservice/lib/esm/parser/cssParser"
import { resolveThemeFunc } from "../parser/theme"
import { findRightBracket } from "../parser/util"
import { Context } from "./_base"

export function parse(value: string): nodes.Expression | null {
	if (!value) return null
	const textProvider = (offset: number, length: number) => value.slice(offset, offset + length)
	const parser = new Parser()

	parser.scanner.setSource(value)
	parser.token = parser.scanner.scan()
	const node = parser._parseExpr.call(parser)
	if (node) node.textProvider = textProvider
	return node
}

export function parseArray(value: string): nodes.Expression[] {
	const expressions: nodes.Expression[] = []
	if (!value) expressions
	const textProvider = (offset: number, length: number) => value.slice(offset, offset + length)
	const parser = new Parser()

	parser.scanner.setSource(value)
	parser.token = parser.scanner.scan()
	let node = parser._parseExpr.call(parser, true)
	if (node) node.textProvider = textProvider

	while (node) {
		expressions.push(node)
		parser.consumeToken()
		parser.token = parser.scanner.scan()
		node = parser._parseExpr.call(parser, true)
		if (node) node.textProvider = textProvider
	}
	return expressions
}

export function isAny(expr: nodes.Expression): boolean {
	return expr.getChildren().some(e => {
		const node = getDeepFirstChild(e)
		if (isFunction(node) && node.getName() === "var") return true
		return false
	})
}

export function isArbitraryValue(value: string): boolean {
	return value.charCodeAt(0) === 91 && value.charCodeAt(value.length - 1) === 93
}

export function getPrefixType(value: string): string | undefined {
	const m = /^([\w-]+):/.exec(value)
	if (!m) return undefined
	return m[1]
}

/** @param value form: `color`, `[color]`, `[color]/opacity`, `color/[opacity]`, `[color]/[opacity]` */
export function split(value: string): [color: string, opacity: string] {
	const index = value.indexOf("[")
	if (index === -1) {
		const i = value.indexOf("/")
		if (i === -1) return [value, ""]
		return [value.slice(0, i), value.slice(i + 1)]
	}
	if (index !== 0) {
		return [value.slice(0, index - 1), value.slice(index)]
	}
	const rb = findRightBracket({ text: value, start: index, brackets: [91, 93] })
	if (rb == undefined) return [value, ""]
	return [value.slice(index, rb + 1), value.slice(rb + 2)]
}

/** @param value form: `color`, `[color]`, `[color]/opacity`, `color/[opacity]`, `[color]/[opacity]` */
export function isMatchColor(
	value: string,
	colors: Set<string>,
	opacities: Set<string> | null,
	arbitraryValue: (value: string) => boolean,
) {
	if (colors.has(value)) {
		return true
	}

	const [color, opacity] = split(value)
	return isColor(color) && isOpacity(opacity)

	function isColor(value: string) {
		if (isArbitraryValue(value)) {
			const val = value.slice(1, -1).trim()
			return arbitraryValue(val)
		}
		return colors.has(value)
	}

	function isOpacity(value: string) {
		if (!value) return true
		if (opacities == null) return false
		if (isArbitraryValue(value)) return true
		return opacities.has(value)
	}
}

function isFunction(node: nodes.Node): node is nodes.Function {
	return node.type === nodes.NodeType.Function
}

function isIdentifier(node: nodes.Node): node is nodes.Identifier {
	return node.type === nodes.NodeType.Identifier
}

function isHexColorValue(node: nodes.Node): node is nodes.HexColorValue {
	return node.type === nodes.NodeType.HexColorValue
}

function isNumericValue(node: nodes.Node): node is nodes.NumericValue {
	return node.type === nodes.NodeType.NumericValue
}

function isExpression(node: nodes.Node): node is nodes.Expression {
	return node.type === nodes.NodeType.Expression
}

function isBinaryExpression(node: nodes.Node): node is nodes.BinaryExpression {
	return node.type === nodes.NodeType.BinaryExpression
}

function isTerm(node: nodes.Node): node is nodes.Term {
	return node.type === nodes.NodeType.Term
}

export function getNodeType(node: nodes.Node): string {
	return nodes.NodeType[node.type]
}

const lineWidth = new Set(languageFacts.lineWidthKeywords)
const lengthUnits = new Set(languageFacts.units["length"])
const percentageUnits = new Set(languageFacts.units["percentage"])
const positionKeywords = new Set(["top", "left", "bottom", "right", "center"])
const backgroundSizeKeywords = new Set(["contain", "cover", "auto"])
const sizeKeywords = new Set(["max-content", "fit-content", "min-content", "fill"])
const relativeSizeKeywords = new Set(["larger", "smaller"])
const absoluteSizeKeywords = new Set([
	"xx-small",
	"x-small",
	"small",
	"medium",
	"large",
	"x-large",
	"xx-large",
	"xxx-large",
])

const cssDataTypeMap = {
	empty: mustEmpty,
	length: mustLength,
	percentage: mustPercentage,
	color: mustColor,
	url: mustUrl,
	var: mustVar,
	flex: mustFlex,
	number: mustNumber,
	backgroundImage: mustBackgroundImage,
	backgroundPosition: mustBackgroundPosition,
	backgroundSize: mustBackgroundSize,
	none: mustNone,
	size: mustSize,
	"line-width": mustLineWidth,
	"absolute-size": mustAbsoluteSize,
	"relative-size": mustRelativeSize,
	shadow: mustShadow,
	fontFamily: mustFontFamily,
}

export function Is(context: Context, value: string, ...types: (keyof typeof cssDataTypeMap)[]) {
	const regex = /^([\w-]+):/
	const match = regex.exec(value)
	let prefix = ""
	if (match != null) {
		value = value.slice(regex.lastIndex)
		prefix = match[1]
	}
	value = resolveThemeFunc(context.config, value)
	const expr = parse(value)
	for (const t of types) {
		if (cssDataTypeMap[t](expr, prefix)) return true
	}
	return false
}

function is(expr: nodes.Node | null, ...types: (keyof typeof cssDataTypeMap)[]) {
	for (const t of types) {
		if (cssDataTypeMap[t](expr, "")) return true
	}
	return false
}

function getDeepFirstChild(node: nodes.Node) {
	if (isExpression(node)) {
		node = node.getChild(0) ?? node
	}
	if (isBinaryExpression(node)) {
		node = node.getChild(0) ?? node
	}
	if (isTerm(node)) {
		node = node.getChild(0) ?? node
	}
	return node
}

function getFirstOne(expr: nodes.Node | null, type: nodes.NodeType) {
	if (expr == null) return null
	if (expr.hasChildren()) {
		for (let node = expr.getChild(0); node != null; node = node.getChild(0)) {
			if (node.type === type) return node
			if (!node.hasChildren()) return null
		}
	}
	return null
}

function getFirstOneNumericValue(expr: nodes.Node | null) {
	const node = getFirstOne(expr, nodes.NodeType.NumericValue)
	if (!node) return null
	if (isNumericValue(node)) return node
	return null
}

function getFirstOneIdentifier(expr: nodes.Node | null) {
	const node = getFirstOne(expr, nodes.NodeType.Identifier)
	if (!node) return null
	if (isIdentifier(node)) return node
	return null
}

function isColor(node: nodes.Node): boolean {
	if (isIdentifier(node)) {
		const color = node.getText().toLowerCase()
		if (color in languageFacts.colors) return true
		if (color === "transparent") return true
		if (node.getText() === "currentColor") return true
		return false
	} else if (isHexColorValue(node)) {
		const color = node.getText()
		if (/(^#[0-9A-F]{8}$)|(^#[0-9A-F]{6}$)|(^#[0-9A-F]{4}$)|(^#[0-9A-F]{3}$)/i.test(color)) {
			return true
		}
		return false
	} else if (isFunction(node)) {
		const fnName: string = node.getName()
		if (fnName) {
			if (/^(rgb|rgba|hsl|hsla)/i.test(fnName)) {
				let args: string[] = node
					.getArguments()
					.getChildren()
					.map(token => node.getText().slice(token.offset, token.offset + token.length))

				if (args.length === 1) {
					args = args[0].split(/\s+/).filter(t => t && t !== "/")
				}
				if (args.length < 3) return true
				return true
			}
		}
		return false
	}
	return false
}

export function mustEmpty(expr: nodes.Node | null, prefix: string) {
	return expr == null
}

export function mustBackgroundImage(expr: nodes.Node | null, prefix: string) {
	if (prefix === "url" || prefix === "image") return true
	if (prefix || expr == null) return false
	const node = getDeepFirstChild(expr)
	if (node.type === nodes.NodeType.URILiteral) return true
	if (isFunction(node)) return !!languageFacts.imageFunctions[node.getName() + "()"]
	return false
}

export function mustBackgroundPosition(expr: nodes.Node | null, prefix: string) {
	if (prefix === "position") return true
	if (prefix || expr == null) return false
	let hasKeyword = false
	let valid = true
	expr.getChildren().forEach(node => {
		node = getDeepFirstChild(node)
		if (positionKeywords.has(node.getText())) {
			hasKeyword = true
			return
		}
		if (!isNumericValue(node)) {
			valid = false
			return
		}
		const { value, unit } = node.getValue()
		if (!unit) {
			valid = value === "0"
			return
		}
		valid = percentageUnits.has(unit) || lengthUnits.has(unit)
	})
	return valid && hasKeyword
}

export function mustBackgroundSize(expr: nodes.Node | null, prefix: string) {
	if (prefix === "length") return true // bad design
	if (prefix || expr == null) return false
	let hasKeyword = false
	let valid = true
	expr.getChildren().forEach(node => {
		node = getDeepFirstChild(node)
		if (backgroundSizeKeywords.has(node.getText())) {
			hasKeyword = true
			return
		}
		if (!isNumericValue(node)) {
			valid = false
			return
		}
		const { value, unit } = node.getValue()
		if (!unit) {
			valid = value === "0"
			return
		}
		valid = percentageUnits.has(unit) || lengthUnits.has(unit)
	})
	return valid && hasKeyword
}

export function mustColor(expr: nodes.Node | null, prefix: string) {
	if (prefix === "color") return true
	if (prefix || expr == null) return false
	if (expr.getChildren().length !== 1) return false
	const first = getDeepFirstChild(expr)
	return isColor(first)
}

export function mustShadow(expr: nodes.Node | null, prefix: string) {
	if (prefix === "shadow") return true
	if (prefix || expr == null) return false
	if (expr.getChildren().length > 1) return true
	return false
}

export function mustFontFamily(expr: nodes.Node | null, prefix: string) {
	if (prefix || expr == null) return false
	return expr.getChildren().every(node => {
		node = getDeepFirstChild(node)
		return node.type === nodes.NodeType.Identifier || node.type === nodes.NodeType.StringLiteral
	})
}

export function mustUrl(expr: nodes.Node | null, prefix: string) {
	if (prefix === "url") return true
	if (prefix || expr == null) return false
	return getFirstOne(expr, nodes.NodeType.URILiteral) != null
}

export function mustVar(expr: nodes.Node | null, prefix: string) {
	if (prefix === "any") return true
	if (prefix || expr == null) return false
	const node = getFirstOne(expr, nodes.NodeType.Function)
	if (node == null) return false
	if (isFunction(node) && node.getName() === "var") return true
	return false
}

export function mustRelativeSize(expr: nodes.Node | null, prefix: string) {
	if (prefix === "relative-size") return true
	if (prefix || expr == null) return false
	const node = getFirstOneIdentifier(expr)
	if (!node) return false
	return relativeSizeKeywords.has(node.getText())
}

export function mustAbsoluteSize(expr: nodes.Node | null, prefix: string) {
	if (prefix === "absolute-size") return true
	if (prefix || expr == null) return false
	const node = getFirstOneIdentifier(expr)
	if (!node) return false
	return absoluteSizeKeywords.has(node.getText())
}

export function mustLineWidth(expr: nodes.Node | null, prefix: string) {
	if (prefix === "line-width") return true
	if (prefix || expr == null) return false
	const node = getDeepFirstChild(expr)
	return lineWidth.has(node.getText())
}

export function mustNone(expr: nodes.Node | null, prefix: string) {
	if (prefix || expr == null) return false
	const node = getDeepFirstChild(expr)
	return "none" === node.getText()
}

export function mustSize(expr: nodes.Node | null, prefix: string) {
	if (prefix === "size") return true
	if (prefix || expr == null) return false
	const node = getDeepFirstChild(expr)
	return sizeKeywords.has(node.getText())
}

export function mustLength(expr: nodes.Node | null, prefix: string) {
	if (prefix === "length") return true
	if (prefix || expr == null) return false
	const node = getDeepFirstChild(expr)
	if (!isNumericValue(node)) return false
	const { value, unit } = node.getValue()
	if (!unit) return value === "0"
	return lengthUnits.has(unit)
}

export function mustPercentage(expr: nodes.Node | null, prefix: string) {
	if (prefix === "percentage") return true
	if (prefix || expr == null) return false
	const node = getDeepFirstChild(expr)
	if (!isNumericValue(node)) return false
	const { value, unit } = node.getValue()
	if (!unit) return value === "0"
	return percentageUnits.has(unit)
}

export function mustNumber(expr: nodes.Node | null, prefix: string) {
	if (prefix === "number") return true
	if (prefix || expr == null) return false
	const node = getFirstOneNumericValue(expr)
	if (!node) return false
	const unit = node.getValue().unit
	return unit == null
}

export function IsFlex(context: Context, value: string) {
	const regex = /^([\w-]+):/
	const match = regex.exec(value)
	let prefix = ""
	if (match != null) {
		value = value.slice(regex.lastIndex)
		prefix = match[1]
	}
	const expr = parse(value)
	return mustFlex(expr, prefix)
}

export function mustFlex(expr: nodes.Node | null, prefix: string) {
	if (prefix === "flex") return true
	if (prefix || expr == null) return false
	const len = expr.getChildren().length
	if (len === 1) {
		// flex-basis | flex-grow
		if (!is(expr.getChild(0), "length", "percentage", "size", "number")) return false
		return true
	} else if (len === 2) {
		// flex-grow
		if (!is(expr.getChild(0), "number")) return false
		// flex-basis | flex-shrink
		if (!is(expr.getChild(1), "length", "percentage", "size", "number")) return false
		return true
	} else if (len === 3) {
		// flex-grow
		if (!is(expr.getChild(0), "number")) return false
		// flex-shrink
		if (!is(expr.getChild(1), "number")) return false
		// flex-basis
		if (!is(expr.getChild(2), "length", "percentage", "size")) return false
		return true
	}
	return false
}
