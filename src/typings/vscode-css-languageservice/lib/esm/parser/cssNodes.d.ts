declare module "vscode-css-languageservice/lib/esm/parser/cssNodes" {
	export enum NodeType {
		Undefined = 0,
		Identifier = 1,
		Stylesheet = 2,
		Ruleset = 3,
		Selector = 4,
		SimpleSelector = 5,
		SelectorInterpolation = 6,
		SelectorCombinator = 7,
		SelectorCombinatorParent = 8,
		SelectorCombinatorSibling = 9,
		SelectorCombinatorAllSiblings = 10,
		SelectorCombinatorShadowPiercingDescendant = 11,
		Page = 12,
		PageBoxMarginBox = 13,
		ClassSelector = 14,
		IdentifierSelector = 15,
		ElementNameSelector = 16,
		PseudoSelector = 17,
		AttributeSelector = 18,
		Declaration = 19,
		Declarations = 20,
		Property = 21,
		Expression = 22,
		BinaryExpression = 23,
		Term = 24,
		Operator = 25,
		Value = 26,
		StringLiteral = 27,
		URILiteral = 28,
		EscapedValue = 29,
		Function = 30,
		NumericValue = 31,
		HexColorValue = 32,
		RatioValue = 33,
		MixinDeclaration = 34,
		MixinReference = 35,
		VariableName = 36,
		VariableDeclaration = 37,
		Prio = 38,
		Interpolation = 39,
		NestedProperties = 40,
		ExtendsReference = 41,
		SelectorPlaceholder = 42,
		Debug = 43,
		If = 44,
		Else = 45,
		For = 46,
		Each = 47,
		While = 48,
		MixinContentReference = 49,
		MixinContentDeclaration = 50,
		Media = 51,
		Keyframe = 52,
		FontFace = 53,
		Import = 54,
		Namespace = 55,
		Invocation = 56,
		FunctionDeclaration = 57,
		ReturnStatement = 58,
		MediaQuery = 59,
		MediaCondition = 60,
		MediaFeature = 61,
		FunctionParameter = 62,
		FunctionArgument = 63,
		KeyframeSelector = 64,
		ViewPort = 65,
		Document = 66,
		AtApplyRule = 67,
		CustomPropertyDeclaration = 68,
		CustomPropertySet = 69,
		ListEntry = 70,
		Supports = 71,
		SupportsCondition = 72,
		NamespacePrefix = 73,
		GridLine = 74,
		Plugin = 75,
		UnknownAtRule = 76,
		Use = 77,
		ModuleConfiguration = 78,
		Forward = 79,
		ForwardVisibility = 80,
		Module = 81,
	}
	export enum ReferenceType {
		Mixin = 0,
		Rule = 1,
		Variable = 2,
		Function = 3,
		Keyframe = 4,
		Unknown = 5,
		Module = 6,
		Forward = 7,
		ForwardVisibility = 8,
	}
	export function getNodeAtOffset(node: Node, offset: number): Node | null
	export function getNodePath(node: Node, offset: number): Node[]
	export function getParentDeclaration(node: Node): Declaration | null
	export interface ITextProvider {
		(offset: number, length: number): string
	}
	export class Node {
		parent: Node | null
		offset: number
		length: number
		get end(): number
		options:
			| {
					[name: string]: any
			  }
			| undefined
		textProvider: ITextProvider | undefined
		private children
		private issues
		private nodeType
		constructor(offset?: number, len?: number, nodeType?: NodeType)
		set type(type: NodeType)
		get type(): NodeType
		private getTextProvider
		getText(): string
		matches(str: string): boolean
		startsWith(str: string): boolean
		endsWith(str: string): boolean
		accept(visitor: IVisitorFunction): void
		acceptVisitor(visitor: IVisitor): void
		adoptChild(node: Node, index?: number): Node
		attachTo(parent: Node, index?: number): Node
		collectIssues(results: any[]): void
		addIssue(issue: IMarker): void
		hasIssue(rule: IRule): boolean
		isErroneous(recursive?: boolean): boolean
		setNode(field: keyof this, node: Node | null, index?: number): boolean
		addChild(node: Node | null): node is Node
		private updateOffsetAndLength
		hasChildren(): boolean
		getChildren(): Node[]
		getChild(index: number): Node | null
		addChildren(nodes: Node[]): void
		findFirstChildBeforeOffset(offset: number): Node | null
		findChildAtOffset(offset: number, goDeep: boolean): Node | null
		encloses(candidate: Node): boolean
		getParent(): Node | null
		findParent(type: NodeType): Node | null
		findAParent(...types: NodeType[]): Node | null
		setData(key: string, value: any): void
		getData(key: string): any
	}
	export interface NodeConstructor<T> {
		new (offset: number, len: number): T
	}
	export class Nodelist extends Node {
		private _nodeList
		constructor(parent: Node, index?: number)
	}
	export class Identifier extends Node {
		referenceTypes?: ReferenceType[]
		isCustomProperty: boolean
		constructor(offset: number, length: number)
		get type(): NodeType
		containsInterpolation(): boolean
	}
	export class Stylesheet extends Node {
		constructor(offset: number, length: number)
		get type(): NodeType
	}
	export class Declarations extends Node {
		private _declarations
		constructor(offset: number, length: number)
		get type(): NodeType
	}
	export class BodyDeclaration extends Node {
		declarations?: Declarations
		constructor(offset: number, length: number)
		getDeclarations(): Declarations | undefined
		setDeclarations(decls: Declarations | null): decls is Declarations
	}
	export class RuleSet extends BodyDeclaration {
		private selectors?
		constructor(offset: number, length: number)
		get type(): NodeType
		getSelectors(): Nodelist
		isNested(): boolean
	}
	export class Selector extends Node {
		private _selector
		constructor(offset: number, length: number)
		get type(): NodeType
	}
	export class SimpleSelector extends Node {
		private _simpleSelector
		constructor(offset: number, length: number)
		get type(): NodeType
	}
	export class AtApplyRule extends Node {
		identifier?: Identifier
		constructor(offset: number, length: number)
		get type(): NodeType
		setIdentifier(node: Identifier | null): node is Identifier
		getIdentifier(): Identifier | undefined
		getName(): string
	}
	export abstract class AbstractDeclaration extends Node {
		colonPosition: number | undefined
		semicolonPosition: number | undefined
		constructor(offset: number, length: number)
	}
	export class CustomPropertySet extends BodyDeclaration {
		constructor(offset: number, length: number)
		get type(): NodeType
	}
	export class Declaration extends AbstractDeclaration {
		property: Property | null
		value?: Expression
		nestedProperties?: NestedProperties
		constructor(offset: number, length: number)
		get type(): NodeType
		setProperty(node: Property | null): node is Property
		getProperty(): Property | null
		getFullPropertyName(): string
		getNonPrefixedPropertyName(): string
		setValue(value: Expression | null): value is Expression
		getValue(): Expression | undefined
		setNestedProperties(value: NestedProperties | null): value is NestedProperties
		getNestedProperties(): NestedProperties | undefined
	}
	export class CustomPropertyDeclaration extends Declaration {
		propertySet?: CustomPropertySet
		constructor(offset: number, length: number)
		get type(): NodeType
		setPropertySet(value: CustomPropertySet | null): value is CustomPropertySet
		getPropertySet(): CustomPropertySet | undefined
	}
	export class Property extends Node {
		identifier?: Identifier
		constructor(offset: number, length: number)
		get type(): NodeType
		setIdentifier(value: Identifier | null): value is Identifier
		getIdentifier(): Identifier | undefined
		getName(): string
		isCustomProperty(): boolean
	}
	export class Invocation extends Node {
		private arguments?
		constructor(offset: number, length: number)
		get type(): NodeType
		getArguments(): Nodelist
	}
	export class Function extends Invocation {
		identifier?: Identifier
		constructor(offset: number, length: number)
		get type(): NodeType
		setIdentifier(node: Identifier | null): node is Identifier
		getIdentifier(): Identifier | undefined
		getName(): string
	}
	export class FunctionParameter extends Node {
		identifier?: Node
		defaultValue?: Node
		constructor(offset: number, length: number)
		get type(): NodeType
		setIdentifier(node: Node | null): node is Node
		getIdentifier(): Node | undefined
		getName(): string
		setDefaultValue(node: Node | null): node is Node
		getDefaultValue(): Node | undefined
	}
	export class FunctionArgument extends Node {
		identifier?: Node
		value?: Node
		constructor(offset: number, length: number)
		get type(): NodeType
		setIdentifier(node: Node | null): node is Node
		getIdentifier(): Node | undefined
		getName(): string
		setValue(node: Node | null): node is Node
		getValue(): Node | undefined
	}
	export class IfStatement extends BodyDeclaration {
		expression?: Expression
		elseClause?: BodyDeclaration
		constructor(offset: number, length: number)
		get type(): NodeType
		setExpression(node: Expression | null): node is Expression
		setElseClause(elseClause: BodyDeclaration | null): elseClause is BodyDeclaration
	}
	export class ForStatement extends BodyDeclaration {
		variable?: Variable
		constructor(offset: number, length: number)
		get type(): NodeType
		setVariable(node: Variable | null): node is Variable
	}
	export class EachStatement extends BodyDeclaration {
		variables?: Nodelist
		constructor(offset: number, length: number)
		get type(): NodeType
		getVariables(): Nodelist
	}
	export class WhileStatement extends BodyDeclaration {
		constructor(offset: number, length: number)
		get type(): NodeType
	}
	export class ElseStatement extends BodyDeclaration {
		constructor(offset: number, length: number)
		get type(): NodeType
	}
	export class FunctionDeclaration extends BodyDeclaration {
		identifier?: Identifier
		parameters?: Nodelist
		constructor(offset: number, length: number)
		get type(): NodeType
		setIdentifier(node: Identifier | null): node is Identifier
		getIdentifier(): Identifier | undefined
		getName(): string
		getParameters(): Nodelist
	}
	export class ViewPort extends BodyDeclaration {
		constructor(offset: number, length: number)
		get type(): NodeType
	}
	export class FontFace extends BodyDeclaration {
		constructor(offset: number, length: number)
		get type(): NodeType
	}
	export class NestedProperties extends BodyDeclaration {
		constructor(offset: number, length: number)
		get type(): NodeType
	}
	export class Keyframe extends BodyDeclaration {
		keyword?: Node
		identifier?: Identifier
		constructor(offset: number, length: number)
		get type(): NodeType
		setKeyword(keyword: Node | null): keyword is Node
		getKeyword(): Node | undefined
		setIdentifier(node: Node | null): node is Node
		getIdentifier(): Node | undefined
		getName(): string
	}
	export class KeyframeSelector extends BodyDeclaration {
		constructor(offset: number, length: number)
		get type(): NodeType
	}
	export class Import extends Node {
		constructor(offset: number, length: number)
		get type(): NodeType
		setMedialist(node: Node | null): node is Node
	}
	export class Use extends Node {
		identifier?: Identifier
		parameters?: Nodelist
		get type(): NodeType
		getParameters(): Nodelist
		setIdentifier(node: Identifier | null): node is Identifier
		getIdentifier(): Identifier | undefined
	}
	export class ModuleConfiguration extends Node {
		identifier?: Node
		value?: Node
		get type(): NodeType
		setIdentifier(node: Node | null): node is Node
		getIdentifier(): Node | undefined
		getName(): string
		setValue(node: Node | null): node is Node
		getValue(): Node | undefined
	}
	export class Forward extends Node {
		identifier?: Node
		members?: Nodelist
		parameters?: Nodelist
		get type(): NodeType
		setIdentifier(node: Node | null): node is Node
		getIdentifier(): Node | undefined
		getMembers(): Nodelist
		getParameters(): Nodelist
	}
	export class ForwardVisibility extends Node {
		identifier?: Node
		get type(): NodeType
		setIdentifier(node: Node | null): node is Node
		getIdentifier(): Node | undefined
	}
	export class Namespace extends Node {
		constructor(offset: number, length: number)
		get type(): NodeType
	}
	export class Media extends BodyDeclaration {
		constructor(offset: number, length: number)
		get type(): NodeType
	}
	export class Supports extends BodyDeclaration {
		constructor(offset: number, length: number)
		get type(): NodeType
	}
	export class Document extends BodyDeclaration {
		constructor(offset: number, length: number)
		get type(): NodeType
	}
	export class Medialist extends Node {
		private mediums?
		constructor(offset: number, length: number)
		getMediums(): Nodelist
	}
	export class MediaQuery extends Node {
		constructor(offset: number, length: number)
		get type(): NodeType
	}
	export class MediaCondition extends Node {
		constructor(offset: number, length: number)
		get type(): NodeType
	}
	export class MediaFeature extends Node {
		constructor(offset: number, length: number)
		get type(): NodeType
	}
	export class SupportsCondition extends Node {
		lParent?: number
		rParent?: number
		constructor(offset: number, length: number)
		get type(): NodeType
	}
	export class Page extends BodyDeclaration {
		constructor(offset: number, length: number)
		get type(): NodeType
	}
	export class PageBoxMarginBox extends BodyDeclaration {
		constructor(offset: number, length: number)
		get type(): NodeType
	}
	export class Expression extends Node {
		private _expression
		constructor(offset: number, length: number)
		get type(): NodeType
	}
	export class BinaryExpression extends Node {
		left?: Node
		right?: Node
		operator?: Node
		constructor(offset: number, length: number)
		get type(): NodeType
		setLeft(left: Node | null): left is Node
		getLeft(): Node | undefined
		setRight(right: Node | null): right is Node
		getRight(): Node | undefined
		setOperator(value: Node | null): value is Node
		getOperator(): Node | undefined
	}
	export class Term extends Node {
		operator?: Node
		expression?: Node
		constructor(offset: number, length: number)
		get type(): NodeType
		setOperator(value: Node | null): value is Node
		getOperator(): Node | undefined
		setExpression(value: Node | null): value is Node
		getExpression(): Node | undefined
	}
	export class AttributeSelector extends Node {
		namespacePrefix?: Node
		identifier?: Identifier
		operator?: Operator
		value?: BinaryExpression
		constructor(offset: number, length: number)
		get type(): NodeType
		setNamespacePrefix(value: Node | null): value is Node
		getNamespacePrefix(): Node | undefined
		setIdentifier(value: Identifier | null): value is Identifier
		getIdentifier(): Identifier | undefined
		setOperator(operator: Operator | null): operator is Operator
		getOperator(): Operator | undefined
		setValue(value: BinaryExpression | null): value is BinaryExpression
		getValue(): BinaryExpression | undefined
	}
	export class Operator extends Node {
		constructor(offset: number, length: number)
		get type(): NodeType
	}
	export class HexColorValue extends Node {
		private _hexColorValue
		constructor(offset: number, length: number)
		get type(): NodeType
	}
	export class RatioValue extends Node {
		constructor(offset: number, length: number)
		get type(): NodeType
	}
	export class NumericValue extends Node {
		constructor(offset: number, length: number)
		get type(): NodeType
		getValue(): {
			value: string
			unit?: string
		}
	}
	export class VariableDeclaration extends AbstractDeclaration {
		private variable
		private value
		needsSemicolon: boolean
		constructor(offset: number, length: number)
		get type(): NodeType
		setVariable(node: Variable | null): node is Variable
		getVariable(): Variable | null
		getName(): string
		setValue(node: Node | null): node is Node
		getValue(): Node | null
	}
	export class Interpolation extends Node {
		constructor(offset: number, length: number)
		get type(): NodeType
	}
	export class Variable extends Node {
		module?: Module
		constructor(offset: number, length: number)
		get type(): NodeType
		getName(): string
	}
	export class ExtendsReference extends Node {
		private selectors?
		constructor(offset: number, length: number)
		get type(): NodeType
		getSelectors(): Nodelist
	}
	export class MixinContentReference extends Node {
		private arguments?
		constructor(offset: number, length: number)
		get type(): NodeType
		getArguments(): Nodelist
	}
	export class MixinContentDeclaration extends BodyDeclaration {
		private parameters?
		constructor(offset: number, length: number)
		get type(): NodeType
		getParameters(): Nodelist
	}
	export class MixinReference extends Node {
		namespaces?: Nodelist
		identifier?: Identifier
		private arguments?
		content?: MixinContentDeclaration
		constructor(offset: number, length: number)
		get type(): NodeType
		getNamespaces(): Nodelist
		setIdentifier(node: Identifier | null): node is Identifier
		getIdentifier(): Identifier | undefined
		getName(): string
		getArguments(): Nodelist
		setContent(node: MixinContentDeclaration | null): node is MixinContentDeclaration
		getContent(): MixinContentDeclaration | undefined
	}
	export class MixinDeclaration extends BodyDeclaration {
		identifier?: Identifier
		private parameters?
		private guard?
		constructor(offset: number, length: number)
		get type(): NodeType
		setIdentifier(node: Identifier | null): node is Identifier
		getIdentifier(): Identifier | undefined
		getName(): string
		getParameters(): Nodelist
		setGuard(node: LessGuard | null): boolean
	}
	export class UnknownAtRule extends BodyDeclaration {
		atRuleName?: string
		constructor(offset: number, length: number)
		get type(): NodeType
		setAtRuleName(atRuleName: string): void
		getAtRuleName(): string | undefined
	}
	export class ListEntry extends Node {
		key?: Node
		value?: Node
		get type(): NodeType
		setKey(node: Node | null): node is Node
		setValue(node: Node | null): node is Node
	}
	export class LessGuard extends Node {
		isNegated?: boolean
		private conditions?
		getConditions(): Nodelist
	}
	export class GuardCondition extends Node {
		variable?: Node
		isEquals?: boolean
		isGreater?: boolean
		isEqualsGreater?: boolean
		isLess?: boolean
		isEqualsLess?: boolean
		setVariable(node: Node | null): node is Node
	}
	export class Module extends Node {
		identifier?: Identifier
		get type(): NodeType
		setIdentifier(node: Identifier | null): node is Identifier
		getIdentifier(): Identifier | undefined
	}
	export interface IRule {
		id: string
		message: string
	}
	export enum Level {
		Ignore = 1,
		Warning = 2,
		Error = 4,
	}
	export interface IMarker {
		getNode(): Node
		getMessage(): string
		getOffset(): number
		getLength(): number
		getRule(): IRule
		getLevel(): Level
	}
	export class Marker implements IMarker {
		private node
		private rule
		private level
		private message
		private offset
		private length
		constructor(node: Node, rule: IRule, level: Level, message?: string, offset?: number, length?: number)
		getRule(): IRule
		getLevel(): Level
		getOffset(): number
		getLength(): number
		getNode(): Node
		getMessage(): string
	}
	export interface IVisitor {
		visitNode: (node: Node) => boolean
	}
	export interface IVisitorFunction {
		(node: Node): boolean
	}
	export class ParseErrorCollector implements IVisitor {
		static entries(node: Node): IMarker[]
		entries: IMarker[]
		constructor()
		visitNode(node: Node): boolean
	}
}
