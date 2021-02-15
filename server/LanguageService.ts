import * as lsp from "vscode-languageserver/node"
import { TextDocument } from "vscode-languageserver-textdocument"
import { Settings } from "settings"

export interface ColorInformation {
	range: lsp.Range
	color?: string
	backgroundColor?: string
	borderColor?: string
}
export interface LanguageService {
	init(): Promise<void>
	reload(settings?: Settings): Promise<void>
	isReady(): boolean
	updateSettings(options: Partial<Settings>): void
	onCompletion: Parameters<lsp.Connection["onCompletion"]>[0]
	onCompletionResolve: Parameters<lsp.Connection["onCompletionResolve"]>[0]
	onHover: Parameters<lsp.Connection["onHover"]>[0]
	validate: (document: TextDocument) => Promise<lsp.Diagnostic[]>
	provideColor: (document: TextDocument, colors: lsp.ColorInformation[]) => Promise<ColorInformation[]>
	provideSemanticTokens: Parameters<lsp.Connection["languages"]["semanticTokens"]["on"]>[0]
}
