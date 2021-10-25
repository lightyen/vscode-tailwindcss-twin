declare module "vscode-css-languageservice/lib/esm/parser/cssErrors" {
	import * as nodes from "vscode-css-languageservice/lib/esm/parser/cssNodes"
	export class CSSIssueType implements nodes.IRule {
		id: string
		message: string
		constructor(id: string, message: string)
	}
	export const ParseError: {
		NumberExpected: CSSIssueType
		ConditionExpected: CSSIssueType
		RuleOrSelectorExpected: CSSIssueType
		DotExpected: CSSIssueType
		ColonExpected: CSSIssueType
		SemiColonExpected: CSSIssueType
		TermExpected: CSSIssueType
		ExpressionExpected: CSSIssueType
		OperatorExpected: CSSIssueType
		IdentifierExpected: CSSIssueType
		PercentageExpected: CSSIssueType
		URIOrStringExpected: CSSIssueType
		URIExpected: CSSIssueType
		VariableNameExpected: CSSIssueType
		VariableValueExpected: CSSIssueType
		PropertyValueExpected: CSSIssueType
		LeftCurlyExpected: CSSIssueType
		RightCurlyExpected: CSSIssueType
		LeftSquareBracketExpected: CSSIssueType
		RightSquareBracketExpected: CSSIssueType
		LeftParenthesisExpected: CSSIssueType
		RightParenthesisExpected: CSSIssueType
		CommaExpected: CSSIssueType
		PageDirectiveOrDeclarationExpected: CSSIssueType
		UnknownAtRule: CSSIssueType
		UnknownKeyword: CSSIssueType
		SelectorExpected: CSSIssueType
		StringLiteralExpected: CSSIssueType
		WhitespaceExpected: CSSIssueType
		MediaQueryExpected: CSSIssueType
		IdentifierOrWildcardExpected: CSSIssueType
		WildcardExpected: CSSIssueType
		IdentifierOrVariableExpected: CSSIssueType
	}
}
