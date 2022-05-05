declare module "vscode-css-languageservice/lib/esm/services/cssHover" {
	import {
		ClientCapabilities,
		Hover,
		HoverSettings,
		Position,
		TextDocument,
	} from "vscode-css-languageservice/lib/esm/cssLanguageTypes"
	import { CSSDataManager } from "vscode-css-languageservice/lib/esm/languageFacts/dataManager"
	import * as nodes from "vscode-css-languageservice/lib/esm/parser/cssNodes"
	export class CSSHover {
		private readonly clientCapabilities
		private readonly cssDataManager
		private supportsMarkdown
		private readonly selectorPrinting
		private defaultSettings?
		constructor(clientCapabilities: ClientCapabilities | undefined, cssDataManager: CSSDataManager)
		configure(settings: HoverSettings | undefined): void
		doHover(
			document: TextDocument,
			position: Position,
			stylesheet: nodes.Stylesheet,
			settings?: HoverSettings | undefined,
		): Hover | null
		private convertContents
		private doesSupportMarkdown
	}
}
