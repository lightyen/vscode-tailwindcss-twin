import type { Token } from "./token"

export enum NodeKind {
	Undefined,
	Declaration,
	Identifier,
	ClassName, // 'bg-gray-100', '!@@@abc!'
	Group, // '(text-black bg-white)', '(helloworld  '
	VariantSpan,
	Variant, // 'hover:', 'lg:'
	Separator,
	CssValue,
	CssProperty, // color[black]
	CssPropertyProp,
	ArbitraryStyle, // text-[black]
	ArbitraryStyleProp,
}

export type Node =
	| DeclarationNode
	| IdentifierNode
	| ClassNameNode
	| GroupNode
	| VariantSpanNode
	| VariantNode
	| SeparatorNode
	| CssPropertyNode
	| ArbitraryStyleNode
	| CssPropertyPropNode
	| ArbitraryStylePropNode
	| CssValueNode

export type Leaf = IdentifierNode | SeparatorNode | CssPropertyPropNode | ArbitraryStylePropNode | CssValueNode

export interface NodeList extends Array<Node> {
	texts: string[]
	slice(start?: number, end?: number): NodeList
}

export function createNodeList(nodes: Node[]) {
	return new Proxy(nodes, {
		get: function (target, prop) {
			switch (prop) {
				case "texts":
					return target.map(t => t.value)
				case "slice":
					return function (start?: number, end?: number) {
						return createNodeList(target.slice(start, end))
					}
				default:
					return target[prop]
			}
		},
	}) as NodeList
}

export interface DeclarationNode extends Token {
	kind: NodeKind.Declaration
	children: NodeList
}

export interface IdentifierNode extends Token {
	kind: NodeKind.Identifier
}

export interface GroupNode extends Token {
	kind: NodeKind.Group
	closed: boolean
	exclamationLeft?: Node | undefined
	exclamationRight?: Node | undefined
	important: boolean
	child: DeclarationNode | VariantSpanNode | GroupNode | ClassNameNode | CssPropertyNode | ArbitraryStyleNode
	prefix?: Node // unused
}

export interface VariantSpanNode extends Token {
	kind: NodeKind.VariantSpan
	variant: VariantNode
	child: VariantSpanNode | GroupNode | CssPropertyNode | ArbitraryStyleNode | ClassNameNode
}

export interface VariantNode extends Token {
	kind: NodeKind.Variant
	child: IdentifierNode
	sep: SeparatorNode
}

interface SeparatorNode extends Token {
	kind: NodeKind.Separator
}

export interface CssPropertyNode extends Token {
	kind: NodeKind.CssProperty
	prop: CssPropertyPropNode
	content: CssValueNode
	closed: boolean
	exclamationLeft?: IdentifierNode | undefined
	exclamationRight?: IdentifierNode | undefined
	child: IdentifierNode
	important: boolean
}

export interface ArbitraryStyleNode extends Token {
	kind: NodeKind.ArbitraryStyle
	prop: ArbitraryStylePropNode
	content: CssValueNode
	closed: boolean
	exclamationLeft?: IdentifierNode | undefined
	exclamationRight?: IdentifierNode | undefined
	child: IdentifierNode
	important: boolean
}

export interface ClassNameNode extends Token {
	kind: NodeKind.ClassName
	child: IdentifierNode
	exclamationLeft?: IdentifierNode | undefined
	exclamationRight?: IdentifierNode | undefined
	important: boolean
}

export interface CssPropertyPropNode extends Token {
	kind: NodeKind.CssPropertyProp
}

export interface ArbitraryStylePropNode extends Token {
	kind: NodeKind.ArbitraryStyleProp
}

export interface CssValueNode extends Token {
	kind: NodeKind.CssValue
}

export function isDeclaration(node: Node): node is DeclarationNode {
	return node.kind === NodeKind.Declaration
}

export function isClassName(node: Node): node is ClassNameNode {
	return node.kind === NodeKind.ClassName
}

export function isCssProperty(node: Node): node is CssPropertyNode {
	return node.kind === NodeKind.CssProperty
}

export function isArbitraryStyle(node: Node): node is ArbitraryStyleNode {
	return node.kind === NodeKind.ArbitraryStyle
}

export function isGroup(node: Node): node is GroupNode {
	return node.kind === NodeKind.Group
}

export function isVariantSpan(node: Node): node is VariantSpanNode {
	return node.kind === NodeKind.VariantSpan
}

export function isVariant(node: Node): node is VariantNode {
	return node.kind === NodeKind.Variant
}

export function createDeclarationNode(params: { token: Token; children: NodeList }) {
	const { token, children } = params
	return new Proxy(token, {
		get(target, prop, ...rest) {
			switch (prop) {
				case "kind":
					return NodeKind.Declaration
				case "children":
					return children
				default:
					return Reflect.get(target, prop, ...rest)
			}
		},
	}) as DeclarationNode
}

export function createVariantSpanNode(params: {
	token: Token
	variant: VariantNode
	child: VariantSpanNode | GroupNode | CssPropertyNode | ArbitraryStyleNode | ClassNameNode
}) {
	const { token, variant, child } = params
	return new Proxy(token, {
		get(target, prop, ...rest) {
			switch (prop) {
				case "kind":
					return NodeKind.VariantSpan
				case "variant":
					return variant
				case "child":
					return child
				default:
					return Reflect.get(target, prop, ...rest)
			}
		},
	}) as VariantSpanNode
}

export function createVariantNode(params: { token: Token; sep: SeparatorNode; child: IdentifierNode }) {
	const { token, sep, child } = params
	return new Proxy(token, {
		get(target, prop, ...rest) {
			switch (prop) {
				case "kind":
					return NodeKind.Variant
				case "sep":
					return sep
				case "child":
					return child
				default:
					return Reflect.get(target, prop, ...rest)
			}
		},
	}) as VariantNode
}

export function createSeparatorNode(token: Token) {
	return new Proxy(token, {
		get(target, prop, ...rest) {
			switch (prop) {
				case "kind":
					return NodeKind.Separator
				default:
					return Reflect.get(target, prop, ...rest)
			}
		},
	}) as SeparatorNode
}

export function createClassNameNode(params: {
	token: Token
	child: IdentifierNode
	exclamationLeft?: IdentifierNode | undefined
	exclamationRight?: IdentifierNode | undefined
}) {
	// const { token, child, exclamationLeft, exclamationRight } = params
	return new Proxy(params.token, {
		get(target, prop, ...rest) {
			switch (prop) {
				case "kind":
					return NodeKind.ClassName
				case "exclamationLeft":
					return params.exclamationLeft
				case "exclamationRight":
					return params.exclamationRight
				case "important":
					return params.exclamationLeft != undefined || params.exclamationRight != undefined
				case "child":
					return params.child
				default:
					return Reflect.get(target, prop, ...rest)
			}
		},
	}) as ClassNameNode
}

export function createGroupNode(params: {
	token: Token
	closed: boolean
	exclamationLeft?: IdentifierNode | undefined
	exclamationRight?: IdentifierNode | undefined
	child: DeclarationNode | VariantSpanNode | GroupNode | ClassNameNode | CssPropertyNode | ArbitraryStyleNode
	prefix?: Node // unused
}) {
	const { token, closed, exclamationLeft, exclamationRight, child, prefix } = params
	return new Proxy(token, {
		get(target, prop, ...rest) {
			switch (prop) {
				case "kind":
					return NodeKind.Group
				case "closed":
					return closed
				case "exclamationLeft":
					return exclamationLeft
				case "exclamationRight":
					return exclamationRight
				case "important":
					return exclamationLeft != undefined || exclamationRight != undefined
				case "prefix":
					return prefix
				case "child":
					return child
				default:
					return Reflect.get(target, prop, ...rest)
			}
		},
	}) as GroupNode
}

export function createCssPropertyNode(params: {
	token: Token
	closed: boolean
	exclamationLeft?: IdentifierNode | undefined
	exclamationRight?: IdentifierNode | undefined
	prop: CssPropertyPropNode
	content: CssValueNode
	child: IdentifierNode
}) {
	const { token, closed, exclamationLeft, exclamationRight, prop: propName, content, child } = params
	return new Proxy(token, {
		get(target, prop, ...rest) {
			switch (prop) {
				case "kind":
					return NodeKind.CssProperty
				case "closed":
					return closed
				case "exclamationLeft":
					return exclamationLeft
				case "exclamationRight":
					return exclamationRight
				case "important":
					return exclamationLeft != undefined || exclamationRight != undefined
				case "prop":
					return propName
				case "content":
					return content
				case "child":
					return child
				default:
					return Reflect.get(target, prop, ...rest)
			}
		},
	}) as CssPropertyNode
}

export function createArbitraryStyleNode(params: {
	token: Token
	closed: boolean
	exclamationLeft?: Node | undefined
	exclamationRight?: Node | undefined
	prop: ArbitraryStylePropNode
	content: CssValueNode
	child: IdentifierNode
}) {
	const { token, closed, exclamationLeft, exclamationRight, prop: propName, content, child } = params
	return new Proxy(token, {
		get(target, prop, ...rest) {
			switch (prop) {
				case "kind":
					return NodeKind.ArbitraryStyle
				case "closed":
					return closed
				case "exclamationLeft":
					return exclamationLeft
				case "exclamationRight":
					return exclamationRight
				case "important":
					return exclamationLeft != undefined || exclamationRight != undefined
				case "prop":
					return propName
				case "content":
					return content
				case "child":
					return child
				default:
					return Reflect.get(target, prop, ...rest)
			}
		},
	}) as ArbitraryStyleNode
}

export function createCssPropertyPropNode(token: Token) {
	return new Proxy(token, {
		get(target, prop, ...rest) {
			switch (prop) {
				case "kind":
					return NodeKind.CssPropertyProp
				default:
					return Reflect.get(target, prop, ...rest)
			}
		},
	}) as CssPropertyPropNode
}

export function createArbitraryStylePropNode(token: Token) {
	return new Proxy(token, {
		get(target, prop, ...rest) {
			switch (prop) {
				case "kind":
					return NodeKind.ArbitraryStyleProp
				default:
					return Reflect.get(target, prop, ...rest)
			}
		},
	}) as ArbitraryStylePropNode
}

export function createCssValueNode(token: Token) {
	return new Proxy(token, {
		get(target, prop, ...rest) {
			switch (prop) {
				case "kind":
					return NodeKind.CssValue
				default:
					return Reflect.get(target, prop, ...rest)
			}
		},
	}) as CssValueNode
}

export function createIdentifierNode(token: Token) {
	return new Proxy(token, {
		get(target, prop, ...rest) {
			switch (prop) {
				case "kind":
					return NodeKind.Identifier
				default:
					return Reflect.get(target, prop, ...rest)
			}
		},
	}) as IdentifierNode
}

export function createNode(token: Token, kind: NodeKind) {
	return new Proxy(token, {
		get(target, prop, ...rest) {
			switch (prop) {
				case "kind":
					return kind
				default:
					return Reflect.get(target, prop, ...rest)
			}
		},
	}) as Node
}
