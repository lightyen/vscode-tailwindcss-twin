declare module "vscode-css-languageservice/lib/esm/services/cssFolding" {
	import { FoldingRange, TextDocument } from "vscode-css-languageservice/lib/esm/cssLanguageTypes"
	export function getFoldingRanges(
		document: TextDocument,
		context: {
			rangeLimit?: number
		},
	): FoldingRange[]
}
