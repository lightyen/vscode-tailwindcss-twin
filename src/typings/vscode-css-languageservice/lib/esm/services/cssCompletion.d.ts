declare module "vscode-css-languageservice/lib/esm/services/cssCompletion" {
	import {
		CompletionList,
		CompletionSettings,
		DocumentContext,
		ICompletionParticipant,
		IPropertyData,
		LanguageServiceOptions,
		Position,
		Range,
		TextDocument,
	} from "vscode-css-languageservice/lib/esm/cssLanguageTypes"
	import { CSSDataManager } from "vscode-css-languageservice/lib/esm/languageFacts/dataManager"
	import * as nodes from "vscode-css-languageservice/lib/esm/parser/cssNodes"
	import { Symbols } from "vscode-css-languageservice/lib/esm/parser/cssSymbolScope"
	export class CSSCompletion {
		variablePrefix: string | null
		private lsOptions
		private cssDataManager
		private defaultSettings?
		private supportsMarkdown
		position: Position
		offset: number
		currentWord: string
		textDocument: TextDocument
		styleSheet: nodes.Stylesheet
		symbolContext: Symbols
		defaultReplaceRange: Range
		nodePath: nodes.Node[]
		completionParticipants: ICompletionParticipant[]
		documentSettings?: CompletionSettings
		constructor(variablePrefix: string | null, lsOptions: LanguageServiceOptions, cssDataManager: CSSDataManager)
		configure(settings?: CompletionSettings): void
		protected getSymbolContext(): Symbols
		setCompletionParticipants(registeredCompletionParticipants: ICompletionParticipant[]): void
		doComplete2(
			document: TextDocument,
			position: Position,
			styleSheet: nodes.Stylesheet,
			documentContext: DocumentContext,
			completionSettings?: CompletionSettings | undefined,
		): Promise<CompletionList>
		doComplete(
			document: TextDocument,
			position: Position,
			styleSheet: nodes.Stylesheet,
			documentSettings: CompletionSettings | undefined,
		): CompletionList
		protected isImportPathParent(type: nodes.NodeType): boolean
		private finalize
		private findInNodePath
		getCompletionsForDeclarationProperty(
			declaration: nodes.Declaration | null,
			result: CompletionList,
		): CompletionList
		private getPropertyProposals
		private get isTriggerPropertyValueCompletionEnabled()
		private get isCompletePropertyWithSemicolonEnabled()
		getCompletionsForDeclarationValue(node: nodes.Declaration, result: CompletionList): CompletionList
		getValueEnumProposals(
			entry: IPropertyData,
			existingNode: nodes.Node | null,
			result: CompletionList,
		): CompletionList
		getCSSWideKeywordProposals(
			entry: IPropertyData,
			existingNode: nodes.Node | null,
			result: CompletionList,
		): CompletionList
		getCompletionsForInterpolation(node: nodes.Interpolation, result: CompletionList): CompletionList
		getVariableProposals(existingNode: nodes.Node | null, result: CompletionList): CompletionList
		getVariableProposalsForCSSVarFunction(result: CompletionList): CompletionList
		getUnitProposals(entry: IPropertyData, existingNode: nodes.Node | null, result: CompletionList): CompletionList
		protected getCompletionRange(existingNode: nodes.Node | null): Range
		protected getColorProposals(
			entry: IPropertyData,
			existingNode: nodes.Node | null,
			result: CompletionList,
		): CompletionList
		protected getPositionProposals(
			entry: IPropertyData,
			existingNode: nodes.Node | null,
			result: CompletionList,
		): CompletionList
		protected getRepeatStyleProposals(
			entry: IPropertyData,
			existingNode: nodes.Node | null,
			result: CompletionList,
		): CompletionList
		protected getLineStyleProposals(
			entry: IPropertyData,
			existingNode: nodes.Node | null,
			result: CompletionList,
		): CompletionList
		protected getLineWidthProposals(
			entry: IPropertyData,
			existingNode: nodes.Node | null,
			result: CompletionList,
		): CompletionList
		protected getGeometryBoxProposals(
			entry: IPropertyData,
			existingNode: nodes.Node | null,
			result: CompletionList,
		): CompletionList
		protected getBoxProposals(
			entry: IPropertyData,
			existingNode: nodes.Node | null,
			result: CompletionList,
		): CompletionList
		protected getImageProposals(
			entry: IPropertyData,
			existingNode: nodes.Node | null,
			result: CompletionList,
		): CompletionList
		protected getTimingFunctionProposals(
			entry: IPropertyData,
			existingNode: nodes.Node | null,
			result: CompletionList,
		): CompletionList
		protected getBasicShapeProposals(
			entry: IPropertyData,
			existingNode: nodes.Node | null,
			result: CompletionList,
		): CompletionList
		getCompletionsForStylesheet(result: CompletionList): CompletionList
		getCompletionForTopLevel(result: CompletionList): CompletionList
		getCompletionsForRuleSet(ruleSet: nodes.RuleSet, result: CompletionList): CompletionList
		getCompletionsForSelector(
			ruleSet: nodes.RuleSet | null,
			isNested: boolean,
			result: CompletionList,
		): CompletionList
		getCompletionsForDeclarations(
			declarations: nodes.Declarations | null | undefined,
			result: CompletionList,
		): CompletionList
		getCompletionsForVariableDeclaration(
			declaration: nodes.VariableDeclaration,
			result: CompletionList,
		): CompletionList
		getCompletionsForExpression(expression: nodes.Expression, result: CompletionList): CompletionList
		getCompletionsForFunctionArgument(
			arg: nodes.FunctionArgument | null,
			func: nodes.Function,
			result: CompletionList,
		): CompletionList
		getCompletionsForFunctionDeclaration(decl: nodes.FunctionDeclaration, result: CompletionList): CompletionList
		getCompletionsForMixinReference(ref: nodes.MixinReference, result: CompletionList): CompletionList
		getTermProposals(
			entry: IPropertyData | undefined,
			existingNode: nodes.Node | null,
			result: CompletionList,
		): CompletionList
		private makeTermProposal
		getCompletionsForSupportsCondition(
			supportsCondition: nodes.SupportsCondition,
			result: CompletionList,
		): CompletionList
		getCompletionsForSupports(supports: nodes.Supports, result: CompletionList): CompletionList
		getCompletionsForExtendsReference(
			extendsRef: nodes.ExtendsReference,
			existingNode: nodes.Node | null,
			result: CompletionList,
		): CompletionList
		getCompletionForUriLiteralValue(uriLiteralNode: nodes.Node, result: CompletionList): CompletionList
		getCompletionForImportPath(importPathNode: nodes.Node, result: CompletionList): CompletionList
		private hasCharacterAtPosition
		private doesSupportMarkdown
	}
}
