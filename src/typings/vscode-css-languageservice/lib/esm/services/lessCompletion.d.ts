declare module "vscode-css-languageservice/lib/esm/services/lessCompletion" {
	import {
		CompletionList,
		IPropertyData,
		LanguageServiceOptions,
	} from "vscode-css-languageservice/lib/esm/cssLanguageTypes"
	import { CSSDataManager } from "vscode-css-languageservice/lib/esm/languageFacts/dataManager"
	import * as nodes from "vscode-css-languageservice/lib/esm/parser/cssNodes"
	import { CSSCompletion } from "vscode-css-languageservice/lib/esm/services/cssCompletion"
	export class LESSCompletion extends CSSCompletion {
		private static builtInProposals
		private static colorProposals
		constructor(lsOptions: LanguageServiceOptions, cssDataManager: CSSDataManager)
		private createFunctionProposals
		getTermProposals(
			entry: IPropertyData | undefined,
			existingNode: nodes.Node,
			result: CompletionList,
		): CompletionList
		protected getColorProposals(
			entry: IPropertyData,
			existingNode: nodes.Node,
			result: CompletionList,
		): CompletionList
		getCompletionsForDeclarationProperty(declaration: nodes.Declaration, result: CompletionList): CompletionList
	}
}
