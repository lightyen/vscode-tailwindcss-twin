import * as nodes from "./nodes"
import * as parser from "./parse_regexp"
import { getVariant } from "./util"

export interface SuggestionResult {
	target?:
		| nodes.Classname
		| nodes.CssDeclaration
		| nodes.ArbitraryClassname
		| nodes.SimpleVariant
		| nodes.ArbitraryVariant
	value: string
	variants: string[]
	inComment: boolean
}

export function suggest({
	position,
	text,
	start = 0,
	end = text.length,
	separator = ":",
}: {
	position: number
	text: string
	start?: number
	end?: number
	separator?: string
}): SuggestionResult {
	interface Context {
		variants: string[]
	}

	interface TravelResult extends Context {
		target?:
			| nodes.Classname
			| nodes.CssDeclaration
			| nodes.ArbitraryClassname
			| nodes.SimpleVariant
			| nodes.ArbitraryVariant
	}

	parser.setSeparator(separator)
	const result = travel(parser.parse({ text, start, end, breac: position }), { variants: [] })

	if (!result.target) {
		return {
			variants: result.variants,
			value: "",
			inComment: inComment({ position, text, start, end }),
		}
	}

	return {
		...result,
		value: result.target ? text.slice(result.target.range[0], result.target.range[1]) : "",
		inComment: inComment({ position, text, start, end }),
	}

	function inComment({
		position,
		text,
		start = 0,
		end = text.length,
	}: {
		position: number
		text: string
		start?: number
		end?: number
	}): boolean {
		const reg = /(")|(')|(\/\/[^\n]*(?:\n|$))|((?:\/\*).*?(?:\*\/|$))/gs
		let match: RegExpExecArray | null
		reg.lastIndex = start
		text = text.slice(0, end)
		let isStringLeterial: false | '"' | "'" = false
		while ((match = reg.exec(text))) {
			const [, doubleQuote, singleQuote, lineComment, blockComment] = match
			if (doubleQuote) {
				if (!isStringLeterial) {
					isStringLeterial = '"'
				} else {
					isStringLeterial = false
				}
			} else if (singleQuote) {
				if (!isStringLeterial) {
					isStringLeterial = "'"
				} else {
					isStringLeterial = false
				}
			} else if (!isStringLeterial && (lineComment || blockComment)) {
				if (position >= match.index && position <= reg.lastIndex) {
					return true
				}
			}
		}

		return false
	}

	function inRange(node: nodes.Node) {
		return position >= node.range[0] && position <= node.range[1]
	}

	function travel(node: nodes.Node, ctx: Context): TravelResult {
		if (node == undefined) {
			return { variants: [] }
		}

		if (nodes.NodeType.Program === node.type) {
			const expr = node.expressions.find(inRange)
			if (expr) return walk(expr)
			return { ...ctx }
		}

		if (inRange(node)) return walk(node)

		return { ...ctx }

		function walk(node: nodes.Node) {
			if (nodes.NodeType.VariantSpan === node.type) {
				const variants = ctx.variants.slice()
				if (inRange(node.variant)) {
					if (position === node.variant.range[1]) variants.push(getVariant(node.variant).value)
					return { target: node.variant, variants }
				}
				if (!node.child) return { variants: [] }
				variants.push(getVariant(node.variant).value)
				return travel(node.child, { ...ctx, variants })
			}

			if (nodes.NodeType.Group === node.type) {
				return travel(
					{ type: nodes.NodeType.Program, expressions: node.expressions, range: node.range },
					{ ...ctx },
				)
			}

			if (nodes.NodeType.CssDeclaration === node.type || nodes.NodeType.ArbitraryClassname === node.type) {
				return { target: node, variants: ctx.variants }
			}

			if (nodes.NodeType.ClassName === node.type) {
				return { target: node, variants: ctx.variants }
			}

			return { variants: [] }
		}
	}
}
