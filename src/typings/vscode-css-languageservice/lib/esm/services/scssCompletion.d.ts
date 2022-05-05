declare module "vscode-css-languageservice/lib/esm/services/scssCompletion" {
	import {
		CompletionList,
		IPropertyData,
		LanguageServiceOptions,
	} from "vscode-css-languageservice/lib/esm/cssLanguageTypes"
	import { CSSDataManager } from "vscode-css-languageservice/lib/esm/languageFacts/dataManager"
	import * as nodes from "vscode-css-languageservice/lib/esm/parser/cssNodes"
	import { CSSCompletion } from "vscode-css-languageservice/lib/esm/services/cssCompletion"
	export class SCSSCompletion extends CSSCompletion {
		private static variableDefaults
		private static colorProposals
		private static selectorFuncs
		private static builtInFuncs
		private static scssAtDirectives
		private static scssModuleLoaders
		private static scssModuleBuiltIns
		constructor(lsServiceOptions: LanguageServiceOptions, cssDataManager: CSSDataManager)
		protected isImportPathParent(type: nodes.NodeType): boolean
		getCompletionForImportPath(importPathNode: nodes.Node, result: CompletionList): CompletionList
		private createReplaceFunction
		private createFunctionProposals
		getCompletionsForSelector(
			ruleSet: nodes.RuleSet | null,
			isNested: boolean,
			result: CompletionList,
		): CompletionList
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
		getCompletionsForExtendsReference(
			_extendsRef: nodes.ExtendsReference,
			existingNode: nodes.Node,
			result: CompletionList,
		): CompletionList
		getCompletionForAtDirectives(result: CompletionList): CompletionList
		getCompletionForTopLevel(result: CompletionList): CompletionList
		getCompletionForModuleLoaders(result: CompletionList): CompletionList
	}
}
