import { ColorDecoration, Settings } from "shared"
import * as lsp from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"

export interface LanguageService {
	init(): Promise<void>
	hasConfig: boolean
	targetConfig: string
	reload(settings?: Settings): Promise<void>
	updateSettings(options: Partial<Settings>): void
	onCompletion: (params: lsp.CompletionParams) => Promise<lsp.CompletionList | undefined>
	onCompletionResolve: (params: lsp.CompletionItem) => Promise<lsp.CompletionItem>
	onHover: (params: lsp.HoverParams) => Promise<lsp.Hover | undefined>
	validate: (document: TextDocument) => Promise<lsp.Diagnostic[]>
	provideColorDecorations: (document: TextDocument) => Promise<Array<ColorDecoration & { range: lsp.Range }>>
	onDocumentColor: (params: lsp.DocumentColorParams) => Promise<lsp.ColorInformation[]>
	onColorPresentation: (params: lsp.ColorPresentationParams) => Promise<lsp.ColorPresentation[]>
}
