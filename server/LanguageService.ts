import * as lsp from "vscode-languageserver/node"
import { TextDocument } from "vscode-languageserver-textdocument"

export interface Settings {
	colorDecorators: boolean
	links: boolean
	validate: boolean
	fallbackDefaultConfig: boolean
	diagnostics: {
		conflict: "none" | "loose" | "strict"
	}
}

export interface ColorInformation {
	range: lsp.Range
	color?: string
	backgroundColor?: string
	borderColor?: string
}
export interface LanguageService {
	init(): Promise<void>
	isReady(): boolean
	updateSettings(options: Partial<Settings>): void
	onCompletion: Parameters<lsp.Connection["onCompletion"]>[0]
	onCompletionResolve: Parameters<lsp.Connection["onCompletionResolve"]>[0]
	onHover: Parameters<lsp.Connection["onHover"]>[0]
	onDocumentLinks: Parameters<lsp.Connection["onDocumentLinks"]>[0]
	validate: (document: TextDocument) => lsp.Diagnostic[]
	provideColor: (document: TextDocument) => ColorInformation[]
	provideSemanticTokens: Parameters<lsp.Connection["languages"]["semanticTokens"]["on"]>[0]
}
