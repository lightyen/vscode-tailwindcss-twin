declare module "vscode-css-languageservice/lib/esm/services/lessCompletion" {
	import { TextDocument } from "vscode-css-languageservice/lib/esm/cssLanguageTypes"
	import { CSSDataManager } from "vscode-css-languageservice/lib/esm/languageFacts/dataManager"
	import * as nodes from "vscode-css-languageservice/lib/esm/parser/cssNodes"
	import { LintConfigurationSettings } from "vscode-css-languageservice/lib/esm/services/lintRules"
	export class LintVisitor implements nodes.IVisitor {
		private cssDataManager
		static entries(
			node: nodes.Node,
			document: TextDocument,
			settings: LintConfigurationSettings,
			cssDataManager: CSSDataManager,
			entryFilter?: number,
		): nodes.IMarker[]
		static prefixes: string[]
		private warnings
		private settings
		private keyframes
		private documentText
		private validProperties
		private constructor()
		private isValidPropertyDeclaration
		private fetch
		private fetchWithValue
		private findValueInExpression
		getEntries(filter?: number): nodes.IMarker[]
		private addEntry
		private getMissingNames
		visitNode(node: nodes.Node): boolean
		private completeValidations
		private visitUnknownAtRule
		private visitKeyframe
		private validateKeyframes
		private visitSimpleSelector
		private visitIdentifierSelector
		private visitImport
		private visitRuleSet
		private visitPrio
		private visitNumericValue
		private visitFontFace
		private isCSSDeclaration
		private visitHexColorValue
		private visitFunction
	}
}
