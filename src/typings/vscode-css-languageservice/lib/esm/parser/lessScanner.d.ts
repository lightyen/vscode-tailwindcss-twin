declare module "vscode-css-languageservice/lib/esm/parser/lessScanner" {
	import * as scanner from "vscode-css-languageservice/lib/esm/parser/cssScanner"
	export const Ellipsis: scanner.TokenType
	export class LESSScanner extends scanner.Scanner {
		protected scanNext(offset: number): scanner.IToken
		protected comment(): boolean
		private escapedJavaScript
	}
}
