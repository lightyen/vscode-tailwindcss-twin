import * as nodes from "./nodes"
import * as parser from "./parse_regexp"
import { getVariant } from "./util"

interface VariantToken extends nodes.TokenString {
	type: nodes.NodeType.SimpleVariant | nodes.NodeType.ArbitraryVariant
}

export type SpreadDescription = {
	target: nodes.Classname | nodes.CssDeclaration | nodes.ArbitraryClassname
	value: string
	variants: VariantToken[]
	important: boolean
}

export function spread({
	text,
	start = 0,
	end = text.length,
	separator = ":",
}: {
	text: string
	start?: number
	end?: number
	separator?: string
}) {
	interface Context {
		variants: VariantToken[]
		important: boolean
	}

	const items: SpreadDescription[] = []
	const emptyGroup: nodes.Group[] = []
	const emptyVariants: nodes.VariantSpan[] = []
	const notClosed: nodes.BracketNode[] = []

	const walk = (node: nodes.TwExpression | undefined, ctx: Context): void => {
		if (node == undefined) return

		if (nodes.NodeType.VariantSpan === node.type) {
			if (nodes.NodeType.ArbitraryVariant === node.variant.type && !node.variant.closed) {
				notClosed.push(node.variant)
				return
			}
			if (node.child == undefined) {
				emptyVariants.push(node)
				return
			}
			const variants = ctx.variants.slice()
			variants.push({ type: node.variant.type, ...getVariant(node.variant) })
			walk(node.child, { ...ctx, variants })
		} else if (nodes.NodeType.Group === node.type) {
			if (!node.closed) {
				notClosed.push(node)
				return
			}

			if (node.expressions.length === 0) {
				emptyGroup.push(node)
				return
			}

			node.expressions.forEach(n => walk(n, { ...ctx, important: ctx.important || node.important }))
		} else if (nodes.NodeType.CssDeclaration === node.type) {
			if (!node.closed) {
				notClosed.push(node)
				return
			}

			items.push({
				target: node,
				value: text.slice(...node.range),
				...ctx,
				important: ctx.important || node.important,
			})
		} else if (nodes.NodeType.ArbitraryClassname === node.type) {
			if (!node.closed) {
				notClosed.push(node)
				return
			}

			if (node.e && node.e.type === nodes.NodeType.WithOpacity && node.e.closed === false) {
				notClosed.push(node.e)
				return
			}

			items.push({
				target: node,
				value: text.slice(...node.range),
				...ctx,
				important: ctx.important || node.important,
			})
		} else if (nodes.NodeType.ClassName === node.type) {
			items.push({
				target: node,
				value: node.value,
				...ctx,
				important: ctx.important || node.important,
			})
		}
	}

	parser.setSeparator(separator)
	const program = parser.parse({ text, start, end })
	program.expressions.forEach(expr => walk(expr, { variants: [], important: false }))

	return { items, emptyGroup, emptyVariants, notClosed }
}
