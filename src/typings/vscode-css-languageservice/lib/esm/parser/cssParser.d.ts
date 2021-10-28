declare module "vscode-css-languageservice/lib/esm/parser/cssParser" {
	import { TextDocument } from "vscode-css-languageservice/lib/esm/cssLanguageTypes"
	import { CSSIssueType } from "vscode-css-languageservice/lib/esm/parser/cssErrors"
	import * as nodes from "vscode-css-languageservice/lib/esm/parser/cssNodes"
	import { IToken, Scanner, TokenType } from "vscode-css-languageservice/lib/esm/parser/cssScanner"

	export interface IMark {
		prev?: IToken
		curr: IToken
		pos: number
	}
	export class Parser {
		scanner: Scanner
		token: IToken
		prevToken?: IToken
		private lastErrorToken?
		constructor(scnr?: Scanner)
		peekIdent(text: string): boolean
		peekKeyword(text: string): boolean
		peekDelim(text: string): boolean
		peek(type: TokenType): boolean
		peekOne(...types: TokenType[]): boolean
		peekRegExp(type: TokenType, regEx: RegExp): boolean
		hasWhitespace(): boolean
		consumeToken(): void
		mark(): IMark
		restoreAtMark(mark: IMark): void
		try(func: () => nodes.Node | null): nodes.Node | null
		acceptOneKeyword(keywords: string[]): boolean
		accept(type: TokenType): boolean
		acceptIdent(text: string): boolean
		acceptKeyword(text: string): boolean
		acceptDelim(text: string): boolean
		acceptRegexp(regEx: RegExp): boolean
		_parseRegexp(regEx: RegExp): nodes.Node
		protected acceptUnquotedString(): boolean
		resync(resyncTokens: TokenType[] | undefined, resyncStopTokens: TokenType[] | undefined): boolean
		createNode(nodeType: nodes.NodeType): nodes.Node
		create<T>(ctor: nodes.NodeConstructor<T>): T
		finish<T extends nodes.Node>(
			node: T,
			error?: CSSIssueType,
			resyncTokens?: TokenType[],
			resyncStopTokens?: TokenType[],
		): T
		markError<T extends nodes.Node>(
			node: T,
			error: CSSIssueType,
			resyncTokens?: TokenType[],
			resyncStopTokens?: TokenType[],
		): void
		parseStylesheet(textDocument: TextDocument): nodes.Stylesheet
		internalParse<T extends nodes.Node, U extends T | null>(
			input: string,
			parseFunc: () => U,
			textProvider?: nodes.ITextProvider,
		): U
		_parseStylesheet(): nodes.Stylesheet
		_parseStylesheetStart(): nodes.Node | null
		_parseStylesheetStatement(isNested?: boolean): nodes.Node | null
		_parseStylesheetAtStatement(isNested?: boolean): nodes.Node | null
		_tryParseRuleset(isNested: boolean): nodes.RuleSet | null
		_parseRuleset(isNested?: boolean): nodes.RuleSet | null
		protected _parseRuleSetDeclarationAtStatement(): nodes.Node | null
		_parseRuleSetDeclaration(): nodes.Node | null
		_needsSemicolonAfter(node: nodes.Node): boolean
		_parseDeclarations(parseDeclaration: () => nodes.Node | null): nodes.Declarations | null
		_parseBody<T extends nodes.BodyDeclaration>(node: T, parseDeclaration: () => nodes.Node | null): T
		_parseSelector(isNested: boolean): nodes.Selector | null
		_parseDeclaration(stopTokens?: TokenType[]): nodes.Declaration | null
		_tryParseCustomPropertyDeclaration(stopTokens?: TokenType[]): nodes.CustomPropertyDeclaration | null
		/**
		 * Parse custom property values.
		 *
		 * Based on https://www.w3.org/TR/css-variables/#syntax
		 *
		 * This code is somewhat unusual, as the allowed syntax is incredibly broad,
		 * parsing almost any sequence of tokens, save for a small set of exceptions.
		 * Unbalanced delimitors, invalid tokens, and declaration
		 * terminators like semicolons and !important directives (when not inside
		 * of delimitors).
		 */
		_parseCustomPropertyValue(stopTokens?: TokenType[]): nodes.Node
		_tryToParseDeclaration(stopTokens?: TokenType[]): nodes.Declaration | null
		_parseProperty(): nodes.Property | null
		_parsePropertyIdentifier(): nodes.Identifier | null
		_parseCharset(): nodes.Node | null
		_parseImport(): nodes.Node | null
		_parseNamespace(): nodes.Node | null
		_parseFontFace(): nodes.Node | null
		_parseViewPort(): nodes.Node | null
		private keyframeRegex
		_parseKeyframe(): nodes.Node | null
		_parseKeyframeIdent(): nodes.Node | null
		_parseKeyframeSelector(): nodes.Node | null
		_tryParseKeyframeSelector(): nodes.Node | null
		_parseSupports(isNested?: boolean): nodes.Node | null
		_parseSupportsDeclaration(isNested?: boolean): nodes.Node | null
		protected _parseSupportsCondition(): nodes.Node
		private _parseSupportsConditionInParens
		_parseMediaDeclaration(isNested?: boolean): nodes.Node | null
		_parseMedia(isNested?: boolean): nodes.Node | null
		_parseMediaQueryList(): nodes.Medialist
		_parseMediaQuery(): nodes.Node | null
		_parseRatio(): nodes.Node | null
		_parseMediaCondition(): nodes.Node | null
		_parseMediaFeature(): nodes.Node | null
		_parseMediaFeatureName(): nodes.Node | null
		_parseMediaFeatureValue(): nodes.Node | null
		_parseMedium(): nodes.Node | null
		_parsePageDeclaration(): nodes.Node | null
		_parsePage(): nodes.Node | null
		_parsePageMarginBox(): nodes.Node | null
		_parsePageSelector(): nodes.Node | null
		_parseDocument(): nodes.Node | null
		_parseUnknownAtRule(): nodes.Node | null
		_parseUnknownAtRuleName(): nodes.Node
		_parseOperator(): nodes.Operator | null
		_parseUnaryOperator(): nodes.Node | null
		_parseCombinator(): nodes.Node | null
		_parseSimpleSelector(): nodes.SimpleSelector | null
		_parseSimpleSelectorBody(): nodes.Node | null
		_parseSelectorIdent(): nodes.Node | null
		_parseHash(): nodes.Node | null
		_parseClass(): nodes.Node | null
		_parseElementName(): nodes.Node | null
		_parseNamespacePrefix(): nodes.Node | null
		_parseAttrib(): nodes.Node | null
		_parsePseudo(): nodes.Node | null
		_tryParsePseudoIdentifier(): nodes.Node | null
		_tryParsePrio(): nodes.Node | null
		_parsePrio(): nodes.Node | null
		_parseExpr(stopOnComma?: boolean): nodes.Expression | null
		_parseNamedLine(): nodes.Node | null
		_parseBinaryExpr(
			preparsedLeft?: nodes.BinaryExpression,
			preparsedOper?: nodes.Node,
		): nodes.BinaryExpression | null
		_parseTerm(): nodes.Term | null
		_parseTermExpression(): nodes.Node | null
		_parseOperation(): nodes.Node | null
		_parseNumeric(): nodes.NumericValue | null
		_parseStringLiteral(): nodes.Node | null
		_parseURILiteral(): nodes.Node | null
		_parseURLArgument(): nodes.Node | null
		_parseIdent(referenceTypes?: nodes.ReferenceType[]): nodes.Identifier | null
		_parseFunction(): nodes.Function | null
		_parseFunctionIdentifier(): nodes.Identifier | null
		_parseFunctionArgument(): nodes.Node | null
		_parseHexColor(): nodes.Node | null
	}
}
