declare module "vscode-css-languageservice/lib/esm/services/cssSelectionRange" {
	import { Position, SelectionRange, TextDocument } from "vscode-css-languageservice/lib/esm/cssLanguageTypes"
	import { Stylesheet } from "vscode-css-languageservice/lib/esm/parser/cssNodes"
	export function getSelectionRanges(
		document: TextDocument,
		positions: Position[],
		stylesheet: Stylesheet,
	): SelectionRange[]
}
