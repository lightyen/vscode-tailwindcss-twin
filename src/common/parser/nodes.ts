export enum NodeType {
	Program = "Program",
	Group = "Group",
	VariantSpan = "VariantSpan",
	SimpleVariant = "SimpleVariant",
	ArbitraryVariant = "ArbitraryVariant",
	CssSelector = "CssSelector",
	Identifier = "Identifier",
	ClassName = "ClassName",
	CssDeclaration = "CssDeclaration",
	CssProperty = "CssProperty",
	CssExpression = "CssExpression",
	ArbitraryClassname = "ArbitraryClassname",
	WithOpacity = "WithOpacity",
	EndOpacity = "EndOpacity",
}

export type Range = [number, number]

export interface NodeToken {
	range: Range
}

export interface NodeData {
	value: string
}

export type TokenString = NodeToken & NodeData

export interface BaseNode extends NodeToken {
	// parent?: BaseNode
	type: NodeType
}

export interface Important {
	important: boolean
}

export interface Bracket {
	closed: boolean
}

export interface Identifier extends BaseNode, NodeData {
	type: NodeType.Identifier
}

export interface SimpleVariant extends BaseNode {
	type: NodeType.SimpleVariant
	id: Identifier
}

export interface ArbitraryVariant extends BaseNode, Bracket {
	type: NodeType.ArbitraryVariant
	selector: CssSelector
}

export type Variant = SimpleVariant | ArbitraryVariant

export interface CssSelector extends BaseNode, NodeData {
	type: NodeType.CssSelector
}

export interface Classname extends BaseNode, NodeData, Important {
	type: NodeType.ClassName
}

export interface CssExpression extends BaseNode, NodeData {
	type: NodeType.CssExpression
}

export interface WithOpacity extends BaseNode, Bracket {
	type: NodeType.WithOpacity
	opacity: Identifier
}

export interface EndOpacity extends BaseNode, NodeData {
	type: NodeType.EndOpacity
}

export interface ArbitraryClassname extends BaseNode, Important, Bracket {
	type: NodeType.ArbitraryClassname
	prop: Identifier
	expr?: CssExpression
	e?: WithOpacity | EndOpacity
}

export interface CssDeclaration extends BaseNode, Important, Bracket {
	type: NodeType.CssDeclaration
	prop: Identifier
	expr: CssExpression
}

export interface VariantSpan extends BaseNode {
	type: NodeType.VariantSpan
	variant: SimpleVariant | ArbitraryVariant
	child?: TwExpression
}

export type TwExpression = Classname | CssDeclaration | ArbitraryClassname | VariantSpan | Group

export interface Group extends BaseNode, Important, Bracket {
	type: NodeType.Group
	expressions: TwExpression[]
}

export interface Program extends BaseNode {
	type: NodeType.Program
	expressions: TwExpression[]
}

export type Node =
	| Program
	| TwExpression
	| SimpleVariant
	| ArbitraryVariant
	| CssSelector
	| CssExpression
	| WithOpacity
	| EndOpacity

export type BracketNode = Group | ArbitraryVariant | ArbitraryClassname | CssDeclaration | WithOpacity
