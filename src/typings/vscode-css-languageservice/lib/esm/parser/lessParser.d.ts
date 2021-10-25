declare module "vscode-css-languageservice/lib/esm/parser/lessParser" {
	import * as nodes from "vscode-css-languageservice/lib/esm/parser/cssNodes"
	import * as cssParser from "vscode-css-languageservice/lib/esm/parser/cssParser"
	import { TokenType } from "vscode-css-languageservice/lib/esm/parser/cssScanner"
	export class LESSParser extends cssParser.Parser {
		constructor()
		_parseStylesheetStatement(isNested?: boolean): nodes.Node | null
		_parseImport(): nodes.Node | null
		_parsePlugin(): nodes.Node | null
		_parseMediaQuery(resyncStopToken: TokenType[]): nodes.Node | null
		_parseMediaDeclaration(isNested?: boolean): nodes.Node | null
		_parseMediaFeatureName(): nodes.Node | null
		_parseVariableDeclaration(panic?: TokenType[]): nodes.VariableDeclaration | null
		_parseDetachedRuleSet(): nodes.Node | null
		_parseDetachedRuleSetBody(): nodes.Node | null
		_addLookupChildren(node: nodes.Node): boolean
		_parseLookupValue(): nodes.Node | null
		_parseVariable(declaration?: boolean, insideLookup?: boolean): nodes.Variable | null
		_parseTermExpression(): nodes.Node | null
		_parseEscaped(): nodes.Node | null
		_parseOperator(): nodes.Node | null
		_parseGuardOperator(): nodes.Node | null
		_parseRuleSetDeclaration(): nodes.Node | null
		_parseKeyframeIdent(): nodes.Node | null
		_parseKeyframeSelector(): nodes.Node | null
		_parseSimpleSelectorBody(): nodes.Node | null
		_parseSelector(isNested: boolean): nodes.Selector | null
		_parseSelectorCombinator(): nodes.Node | null
		_parseSelectorIdent(): nodes.Node | null
		_parsePropertyIdentifier(inLookup?: boolean): nodes.Identifier | null
		private peekInterpolatedIdent
		_acceptInterpolatedIdent(node: nodes.Node, identRegex?: RegExp): boolean
		_parseInterpolation(): nodes.Node | null
		_tryParseMixinDeclaration(): nodes.Node | null
		private _parseMixInBodyDeclaration
		private _parseMixinDeclarationIdentifier
		_parsePseudo(): nodes.Node | null
		_parseExtend(): nodes.Node | null
		private _completeExtends
		_parseDetachedRuleSetMixin(): nodes.Node | null
		_tryParseMixinReference(atRoot?: boolean): nodes.Node | null
		_parseMixinArgument(): nodes.Node | null
		_parseMixinParameter(): nodes.Node | null
		_parseGuard(): nodes.LessGuard | null
		_parseGuardCondition(): nodes.Node | null
		_parseFunction(): nodes.Function | null
		_parseFunctionIdentifier(): nodes.Identifier | null
		_parseURLArgument(): nodes.Node | null
	}
}
