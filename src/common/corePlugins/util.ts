import * as languageFacts from "vscode-css-languageservice/lib/esm/languageFacts/facts"
import * as nodes from "vscode-css-languageservice/lib/esm/parser/cssNodes"
import { Parser } from "vscode-css-languageservice/lib/esm/parser/cssParser"

export function isArbitraryValue(value: string) {
	return value.charCodeAt(0) === 91 && value.charCodeAt(value.length - 1) === 93
}

const parser = new Parser()

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

const typeMap = {
	image: mustImage,
	color: mustColor,
	length: mustLength,
	percentage: mustPercentage,
	url: mustUrl,
	number: mustNumber,
	"line-width": mustLineWidth,
	"absolute-size": mustAbsoluteSize,
	"relative-size": mustRelativeSize,
}

export function is(value: string, ...types: (keyof typeof typeMap)[]) {
	for (const t of types) {
		if (typeMap[t](value)) return true
	}

	return false
}

export function mustImage(value: string): boolean {
	if (value.startsWith("image:")) return true
	const expr = parser.internalParse(value, parser._parseExpr.bind(parser))
	if (!expr) return false
	const url = getFirstOne(expr, nodes.NodeType.URILiteral)
	if (url) return true

	const node = getFirstOne(expr, nodes.NodeType.Function)
	if (!node) return false

	if (isFunction(node)) {
		return !!languageFacts.imageFunctions[node.getName() + "()"]
	}

	return false
}

function getFirstOne(expr: nodes.Expression | null, type: nodes.NodeType) {
	if (!expr) return null
	if (expr.hasChildren()) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		for (let node = expr.getChild(0)!; node != null; node = node.getChild(0)!) {
			if (node.type === type) return node
			if (!node.hasChildren()) return null
		}
	}
	return null
}

function getOneURILiteral(expr: nodes.Expression | null) {
	return getFirstOne(expr, nodes.NodeType.URILiteral)
}

function getOneNumericValue(expr: nodes.Expression | null) {
	const node = getFirstOne(expr, nodes.NodeType.NumericValue)
	if (!node) return null
	if (isNumericValue(node)) return node
	return null
}

function getOneIdentifier(expr: nodes.Expression | null) {
	const node = getFirstOne(expr, nodes.NodeType.Identifier)
	if (!node) return null
	if (isIdentifier(node)) return node
	return null
}

export function mustColor(value: string) {
	if (value.startsWith("color:")) return true
	const expr = parser.internalParse(value, parser._parseExpr.bind(parser))
	if (!expr) return false
	const children = expr.getChildren()
	if (children.length !== 1) return false
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	for (let node = expr.getChild(0)!; node != null; node = node.getChild(0)!) {
		if (isIdentifier(node)) {
			const color = node.getText().toLowerCase()
			if (color === "transparent") {
				return true
			} else if (color in languageFacts.colors) {
				return true
			}
			return false
		} else if (isHexColorValue(node)) {
			const color = node.getText()
			if (/(^#[0-9A-F]{8}$)|(^#[0-9A-F]{6}$)|(^#[0-9A-F]{4}$)|(^#[0-9A-F]{3}$)/i.test(color)) {
				return true
			}
			return false
		} else if (isFunction(node)) {
			const fnName: string = node.getName()
			if (fnName && /^(rgb|rgba|hsl|hsla)/i.test(fnName)) {
				let args: string[] = node
					.getArguments()
					.getChildren()
					.map(token => value.substr(token.offset, token.length))

				if (args.length === 1) {
					args = args[0].split(/\s+/).filter(t => t && t !== "/")
				}

				if (args.length < 3) return true
				return true
			}

			return false
		}

		if (!node.hasChildren()) return false
	}
	return false
}

export function mustUrl(value: string) {
	if (value.startsWith("url:")) return true
	const expr = parser.internalParse(value, parser._parseExpr.bind(parser))
	return getOneURILiteral(expr) != null
}

const relativeSizes = new Set(["larger", "smaller"])
const absoluteSizes = new Set(["xx-small", "x-small", "small", "medium", "large", "x-large", "xx-large", "xxx-large"])

export function mustRelativeSize(value: string) {
	if (value.startsWith("relative-size:")) return true
	const expr = parser.internalParse(value, parser._parseExpr.bind(parser))

	const node = getOneIdentifier(expr)
	if (!node) return false

	return relativeSizes.has(node.getText())
}

export function mustAbsoluteSize(value: string) {
	if (value.startsWith("absolute-size:")) return true
	const expr = parser.internalParse(value, parser._parseExpr.bind(parser))

	const node = getOneIdentifier(expr)
	if (!node) return false

	return absoluteSizes.has(node.getText())
}

export function mustLineWidth(value: string) {
	if (value.startsWith("line-width:")) return true
	const expr = parser.internalParse(value, parser._parseExpr.bind(parser))

	const node = getOneIdentifier(expr)
	if (!node) return false

	return languageFacts.lineWidthKeywords.indexOf(node.getText()) !== -1
}

export function mustLength(value: string) {
	if (value.startsWith("length:")) return true

	const expr = parser.internalParse(value, parser._parseExpr.bind(parser))

	const node = getOneNumericValue(expr)
	if (!node) return false

	const unit = node.getValue().unit
	if (!unit) return false

	return languageFacts.units["length"].indexOf(unit) !== -1
}

export function mustNumber(value: string) {
	if (value.startsWith("number:")) return true

	const expr = parser.internalParse(value, parser._parseExpr.bind(parser))
	const node = getOneNumericValue(expr)
	if (!node) return false

	const unit = node.getValue().unit
	return !unit
}

export function mustPercentage(value: string) {
	if (value.startsWith("percentage:")) return true

	const expr = parser.internalParse(value, parser._parseExpr.bind(parser))
	const node = getOneNumericValue(expr)
	if (!node) return false

	const unit = node.getValue().unit
	if (!unit) return false

	return languageFacts.units["percentage"].indexOf(unit) !== -1
}
