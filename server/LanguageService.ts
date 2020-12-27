import * as lsp from "vscode-languageserver/node"
import { TextDocument } from "vscode-languageserver-textdocument"

export interface ColorInformation {
	range: lsp.Range
	color?: string
	backgroundColor?: string
	borderColor?: string
}

export interface LanguageService {
	init(): Promise<void>
	onCompletion: Parameters<lsp.Connection["onCompletion"]>[0]
	onCompletionResolve: Parameters<lsp.Connection["onCompletionResolve"]>[0]
	onHover: Parameters<lsp.Connection["onHover"]>[0]
	onDocumentLinks: Parameters<lsp.Connection["onDocumentLinks"]>[0]
	validate: (document: TextDocument) => lsp.Diagnostic[]
	provideColor: (document: TextDocument) => ColorInformation[]
}
