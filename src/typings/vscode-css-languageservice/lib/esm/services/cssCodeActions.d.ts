declare module "vscode-css-languageservice/lib/esm/services/cssCodeActions" {
	import {
		CodeAction,
		CodeActionContext,
		Command,
		Range,
		TextDocument,
	} from "vscode-css-languageservice/lib/esm/cssLanguageTypes"
	import { CSSDataManager } from "vscode-css-languageservice/lib/esm/languageFacts/dataManager"
	import * as nodes from "vscode-css-languageservice/lib/esm/parser/cssNodes"
	export class CSSCodeActions {
		private readonly cssDataManager
		constructor(cssDataManager: CSSDataManager)
		doCodeActions(
			document: TextDocument,
			range: Range,
			context: CodeActionContext,
			stylesheet: nodes.Stylesheet,
		): Command[]
		doCodeActions2(
			document: TextDocument,
			range: Range,
			context: CodeActionContext,
			stylesheet: nodes.Stylesheet,
		): CodeAction[]
		private getFixesForUnknownProperty
		private appendFixesForMarker
	}
}
