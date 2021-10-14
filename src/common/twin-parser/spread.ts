import { parse } from "./parse_regexp"
import { Token } from "./token"
import * as nodes from "./twNodes"

export type SpreadDescription = {
	target: Token
	type: SpreadResultType
	variants: nodes.NodeList<nodes.VariantNode | nodes.ArbitraryVariantNode>
	important: boolean
	prop?: nodes.CssPropertyPropNode | nodes.ArbitraryStylePropNode
	content?: nodes.CssValueNode
	e?: nodes.IdentifierNode
}

export enum SpreadResultType {
	Unknown,
	ClassName,
	CssProperty,
	ArbitraryStyle,
}

function spreadResultType(node: nodes.Node) {
	switch (node.kind) {
		case nodes.NodeKind.ClassName:
			return SpreadResultType.ClassName
		case nodes.NodeKind.CssProperty:
			return SpreadResultType.CssProperty
		case nodes.NodeKind.ArbitraryStyle:
			return SpreadResultType.ArbitraryStyle
		default:
			return SpreadResultType.Unknown
	}
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
		variants: nodes.NodeList<nodes.VariantNode | nodes.ArbitraryVariantNode>
		important: boolean
	}

	const items: SpreadDescription[] = []
	const emptyGroup: nodes.GroupNode[] = []
	const emptyVariants: nodes.VariantSpanNode[] = []
	const notClosed: Array<
		| nodes.GroupNode
		| nodes.CssPropertyNode
		| nodes.ArbitraryStyleNode
		| nodes.ArbitraryVariantNode
		| nodes.IdentifierNode
	> = []

	const walk = (node: nodes.Node | undefined, ctx: Context): void => {
		if (node == undefined) {
			return
		}
		if (nodes.isDeclaration(node)) {
			for (let i = 0; i < node.children.length; i++) {
				walk(node.children[i], ctx)
			}
		} else if (nodes.isVariantSpan(node)) {
			if (nodes.isArbitraryVariant(node.variant) && !node.variant.closed) {
				notClosed.push(node.variant)
				return
			}
			if (node.child == undefined || node.child.value.trim() === "") {
				emptyVariants.push(node)
				return
			}
			const variants = ctx.variants.slice()
			variants.push(node.variant)
			walk(node.child, { ...ctx, variants })
		} else if (nodes.isGroup(node)) {
			if (!node.closed) {
				notClosed.push(node)
				return
			}

			if (node.child == undefined || node.child.value.trim() === "") {
				emptyGroup.push(node)
				return
			}

			walk(node.child, { ...ctx, important: ctx.important || node.important })
		} else if (nodes.isCssProperty(node)) {
			if (!node.closed) {
				notClosed.push(node)
				return
			}

			items.push({
				target: node.child,
				type: spreadResultType(node),
				prop: node.prop,
				content: node.content,
				...ctx,
				important: ctx.important || node.important,
			})
		} else if (nodes.isArbitraryStyle(node)) {
			if (!node.closed) {
				notClosed.push(node)
				return
			}

			if (node.endOpacity && node.endOpacity.closed === false) {
				notClosed.push(node.endOpacity.value)
				return
			}

			items.push({
				target: node.child,
				type: spreadResultType(node),
				prop: node.prop,
				content: node.content,
				e: node.endOpacity?.value,
				...ctx,
				important: ctx.important || node.important,
			})
		} else if (nodes.isClassName(node)) {
			items.push({
				target: node.child,
				type: spreadResultType(node),
				...ctx,
				important: ctx.important || node.important,
			})
		}
	}

	walk(parse({ text, start, end, separator }), { variants: nodes.createNodeList(), important: false })

	return { items, emptyGroup, emptyVariants, notClosed }
}
