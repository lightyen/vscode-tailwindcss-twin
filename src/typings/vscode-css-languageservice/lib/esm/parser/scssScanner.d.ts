declare module "vscode-css-languageservice/lib/esm/parser/scssScanner" {
	import { IToken, Scanner, TokenType } from "vscode-css-languageservice/lib/esm/parser/cssScanner"
	export const VariableName: number
	export const InterpolationFunction: TokenType
	export const Default: TokenType
	export const EqualsOperator: TokenType
	export const NotEqualsOperator: TokenType
	export const GreaterEqualsOperator: TokenType
	export const SmallerEqualsOperator: TokenType
	export const Ellipsis: TokenType
	export const Module: TokenType
	export class SCSSScanner extends Scanner {
		protected scanNext(offset: number): IToken
		protected comment(): boolean
	}
}
