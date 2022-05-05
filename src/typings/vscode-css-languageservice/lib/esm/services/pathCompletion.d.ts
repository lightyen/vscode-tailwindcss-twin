declare module "vscode-css-languageservice/lib/esm/services/pathCompletion" {
	import {
		CompletionList,
		DocumentContext,
		FileType,
		ICompletionParticipant,
		ImportPathCompletionContext,
		TextDocument,
		URILiteralCompletionContext,
	} from "vscode-css-languageservice/lib/esm/cssLanguageTypes"
	import { DocumentUri } from "vscode-languageserver-types"
	export class PathCompletionParticipant implements ICompletionParticipant {
		private readonly readDirectory
		private literalCompletions
		private importCompletions
		constructor(readDirectory: (uri: DocumentUri) => Promise<[string, FileType][]>)
		onCssURILiteralValue(context: URILiteralCompletionContext): void
		onCssImportPath(context: ImportPathCompletionContext): void
		computeCompletions(document: TextDocument, documentContext: DocumentContext): Promise<CompletionList>
		private providePathSuggestions
	}
}
