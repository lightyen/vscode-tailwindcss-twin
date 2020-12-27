import * as lsp from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import { Tailwind } from "~/tailwind"
import { LanguageService } from "~/LanguageService"
import { completion, completionResolve } from "./completion"
import { hover } from "./hover"
import { documentLinks } from "./documentLinks"
import { validate } from "~/diagnostics"
import { provideColor } from "./colorDecoration"

export interface InitOptions {
	workspaceFolder: string
	configPath: string
	colorDecorators: boolean
	links: boolean
	twin: boolean
	validate: boolean
	fallbackDefaultConfig: boolean
	diagnostics: {
		conflict: "none" | "loose" | "strict"
	}
}

export class TailwindLanguageService implements LanguageService {
	public state: Tailwind
	initOptions: InitOptions
	documents: lsp.TextDocuments<TextDocument>
	constructor(documents: lsp.TextDocuments<TextDocument>, initOptions: InitOptions) {
		this.initOptions = initOptions
		this.documents = documents
		this.state = new Tailwind(initOptions)
	}
	init() {
		return this.state.process()
	}
	reload(...params: Parameters<Tailwind["reload"]>) {
		return this.state.reload(...params)
	}
	isReady() {
		return !!this.state.classnames
	}
	onCompletion(params: lsp.TextDocumentPositionParams) {
		if (!this.isReady()) return null
		const document = this.documents.get(params.textDocument.uri)
		return completion(document, params.position, this.state, this.initOptions)
	}
	onCompletionResolve(item: lsp.CompletionItem) {
		if (!this.isReady()) return null
		return completionResolve(item, this.state)
	}
	onHover(params: lsp.HoverParams) {
		if (!this.isReady()) return null
		const document = this.documents.get(params.textDocument.uri)
		return hover(document, params.position, this.state, this.initOptions)
	}
	onDocumentLinks(params: lsp.DocumentLinkParams) {
		if (!this.initOptions.links) return []
		if (!this.isReady()) return []
		const document = this.documents.get(params.textDocument.uri)
		return documentLinks(document, this.state, this.initOptions)
	}
	validate(document: TextDocument) {
		if (!this.initOptions.validate) return []
		if (!this.isReady()) return []
		return validate(document, this.state, this.initOptions)
	}
	provideColor(document: TextDocument) {
		if (!this.initOptions.colorDecorators) return []
		if (!this.isReady()) return []
		return provideColor(document, this.state, this.initOptions)
	}
}
