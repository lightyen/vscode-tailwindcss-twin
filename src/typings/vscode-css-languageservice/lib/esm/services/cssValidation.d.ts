declare module "vscode-css-languageservice/lib/esm/services/cssValidation" {
	import { Diagnostic, LanguageSettings, TextDocument } from "vscode-css-languageservice/lib/esm/cssLanguageTypes"
	import { CSSDataManager } from "vscode-css-languageservice/lib/esm/languageFacts/dataManager"
	import * as nodes from "vscode-css-languageservice/lib/esm/parser/cssNodes"
	export class CSSValidation {
		private cssDataManager
		private settings?
		constructor(cssDataManager: CSSDataManager)
		configure(settings?: LanguageSettings): void
		doValidation(
			document: TextDocument,
			stylesheet: nodes.Stylesheet,
			settings?: LanguageSettings | undefined,
		): Diagnostic[]
	}
}
