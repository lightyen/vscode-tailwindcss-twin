import { parse } from "./parse_regexp"
import { createTokenList, Token, TokenList } from "./token"
import * as nodes from "./twNodes"

export enum HoverResultType {
	Unknown,
	Variant,
	ClassName,
	CssProperty,
	ArbitraryStyle,
}

function hoverResultType(node: nodes.Node) {
	switch (node.kind) {
		case nodes.NodeKind.Variant:
			return HoverResultType.Variant
		case nodes.NodeKind.ClassName:
			return HoverResultType.ClassName
		case nodes.NodeKind.CssProperty:
			return HoverResultType.CssProperty
		case nodes.NodeKind.ArbitraryStyle:
			return HoverResultType.ArbitraryStyle
		default:
			return HoverResultType.Unknown
	}
}

interface HoverResult {
	target: Token
	type: HoverResultType
	variants: TokenList
	important: boolean
	prop?: nodes.CssPropertyPropNode | nodes.ArbitraryStylePropNode | undefined
	value?: nodes.CssValueNode | undefined
}

export function hover({
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
}): HoverResult | undefined {
	interface Context {
		important: boolean
		variants: TokenList
	}

	const inRange = (node: nodes.Node) => position >= node.start && position < node.end

	const travel = (node: nodes.Node, ctx: Context): HoverResult | undefined => {
		const walk = (node: nodes.Node): HoverResult | undefined => {
			if (nodes.isVariantSpan(node)) {
				const variants = ctx.variants.slice()
				if (inRange(node.variant)) {
					return {
						target: node.variant.child,
						type: hoverResultType(node.variant),
						important: false,
						variants,
					}
				}
				variants.push(node.variant.child)
				return travel(node.child, { ...ctx, variants })
			}

			if (nodes.isGroup(node)) {
				if (node.prefix && inRange(node.prefix)) {
					return undefined
					// return { target: node.prefix, important: false, variants: ctx.variants }
				}

				return travel(node.child, { ...ctx, important: ctx.important || node.important })
			}

			if (nodes.isClassName(node)) {
				return {
					target: node.child,
					type: hoverResultType(node),
					important: ctx.important || node.important,
					variants: ctx.variants,
				}
			}

			if (nodes.isCssProperty(node)) {
				return {
					target: node.child,
					type: hoverResultType(node),
					important: ctx.important || node.important,
					variants: ctx.variants,
					prop: node.prop,
					value: node.content,
				}
			}

			if (nodes.isArbitraryStyle(node)) {
				return {
					target: node.child,
					type: hoverResultType(node),
					important: ctx.important || node.important,
					variants: ctx.variants,
					prop: node.prop,
					value: node.content,
				}
			}

			return undefined
		}

		if (node == undefined) {
			return undefined
		}

		if (nodes.isDeclaration(node)) {
			const c = node.children.find(child => inRange(child))
			if (c) {
				return walk(c)
			}

			return undefined
		}

		if (inRange(node)) {
			return walk(node)
		}

		return undefined
	}

	return travel(parse({ text, start, end, separator, breac: position }), {
		important: false,
		variants: createTokenList(),
	})
}
