declare module "vscode-css-languageservice/lib/esm/parser/scssParser" {
	import * as nodes from "vscode-css-languageservice/lib/esm/parser/cssNodes"
	import * as cssParser from "vscode-css-languageservice/lib/esm/parser/cssParser"
	import { TokenType } from "vscode-css-languageservice/lib/esm/parser/cssScanner"
	export class SCSSParser extends cssParser.Parser {
		constructor()
		_parseStylesheetStatement(isNested?: boolean): nodes.Node | null
		_parseImport(): nodes.Node | null
		_parseVariableDeclaration(panic?: TokenType[]): nodes.VariableDeclaration | null
		_parseMediaContentStart(): nodes.Node | null
		_parseMediaFeatureName(): nodes.Node | null
		_parseKeyframeSelector(): nodes.Node | null
		_parseVariable(): nodes.Variable | null
		_parseModuleMember(): nodes.Module | null
		_parseIdent(referenceTypes?: nodes.ReferenceType[]): nodes.Identifier | null
		_parseTermExpression(): nodes.Node | null
		_parseInterpolation(): nodes.Node | null
		_parseOperator(): nodes.Node | null
		_parseUnaryOperator(): nodes.Node | null
		_parseRuleSetDeclaration(): nodes.Node | null
		_parseDeclaration(stopTokens?: TokenType[]): nodes.Declaration | null
		_parseNestedProperties(): nodes.NestedProperties
		_parseExtends(): nodes.Node | null
		_parseSimpleSelectorBody(): nodes.Node | null
		_parseSelectorCombinator(): nodes.Node | null
		_parseSelectorPlaceholder(): nodes.Node | null
		_parseElementName(): nodes.Node | null
		_tryParsePseudoIdentifier(): nodes.Node | null
		_parseWarnAndDebug(): nodes.Node | null
		_parseControlStatement(parseStatement?: () => nodes.Node | null): nodes.Node | null
		_parseIfStatement(parseStatement: () => nodes.Node | null): nodes.Node | null
		private _internalParseIfStatement
		_parseForStatement(parseStatement: () => nodes.Node | null): nodes.Node | null
		_parseEachStatement(parseStatement: () => nodes.Node | null): nodes.Node | null
		_parseWhileStatement(parseStatement: () => nodes.Node | null): nodes.Node | null
		_parseFunctionBodyDeclaration(): nodes.Node | null
		_parseFunctionDeclaration(): nodes.Node | null
		_parseReturnStatement(): nodes.Node | null
		_parseMixinDeclaration(): nodes.Node | null
		_parseParameterDeclaration(): nodes.Node | null
		_parseMixinContent(): nodes.Node | null
		_parseMixinReference(): nodes.Node | null
		_parseMixinContentDeclaration(): nodes.MixinContentDeclaration
		_parseMixinReferenceBodyStatement(): nodes.Node | null
		_parseFunctionArgument(): nodes.Node | null
		_parseURLArgument(): nodes.Node | null
		_parseOperation(): nodes.Node | null
		_parseListElement(): nodes.Node | null
		_parseUse(): nodes.Node | null
		_parseModuleConfigDeclaration(): nodes.Node | null
		_parseForward(): nodes.Node | null
		_parseForwardVisibility(): nodes.Node | null
		protected _parseSupportsCondition(): nodes.Node
	}
}
