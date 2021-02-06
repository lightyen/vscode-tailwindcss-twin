import * as lsp from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import { Tailwind } from "~/tailwind"
import { LanguageService } from "~/LanguageService"
import completion from "./completion"
import completionResolve from "./completionResolve"
import hover from "./hover"
import documentLinks from "./documentLinks"
import { validate } from "./diagnostics"
import provideColor from "./provideColor"
import provideSemanticTokens from "./semanticTokens"
import findAllClasses from "~/common/findAllClasses"
import idebounce from "~/common/idebounce"

export interface InitOptions {
	workspaceFolder: string
	configPath: string
	colorDecorators: boolean
	links: boolean
	validate: boolean
	preferVariantWithParentheses: boolean
	fallbackDefaultConfig: boolean
	diagnostics: {
		conflict: "none" | "loose" | "strict"
		emptyClass: boolean
		emptyGroup: boolean
	}
}

export type Cache = Record<string, Record<string, ReturnType<typeof findAllClasses>>>

export class TailwindLanguageService implements LanguageService {
	public state: Tailwind
	initOptions: InitOptions
	documents: lsp.TextDocuments<TextDocument>
	cache: Cache
	constructor(documents: lsp.TextDocuments<TextDocument>, initOptions: InitOptions) {
		this.initOptions = initOptions
		this.documents = documents
		this.state = new Tailwind(this.initOptions)
		this.cache = {}
	}
	init() {
		if (this.isReady()) return void 0
		return this.state.process()
	}
	reload(...params: Parameters<Tailwind["reload"]>) {
		return this.state.reload(...params)
	}
	updateSettings(setting: Partial<InitOptions>) {
		this.initOptions = { ...this.initOptions, ...setting }
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
	async validate(document: TextDocument) {
		const uri = document.uri.toString()
		this.cache[uri] = {}
		if (!this.initOptions.validate) return []
		if (!this.isReady()) return []
		return await idebounce("validate", validate, document, this.state, this.initOptions, this.cache)
	}
	async onDocumentLinks(document: TextDocument) {
		if (!this.initOptions.links) return []
		if (!this.isReady()) return []
		return await idebounce("documentLinks", documentLinks, document, this.state, this.initOptions, this.cache)
	}
	async provideColor(document: TextDocument) {
		if (!this.initOptions.colorDecorators) return []
		if (!this.isReady()) return []
		return await idebounce("provideColor", provideColor, document, this.state, this.initOptions, this.cache)
	}
	async provideSemanticTokens(params: lsp.SemanticTokensParams) {
		if (!this.isReady()) return null
		// TODO: use cache
		const document = this.documents.get(params.textDocument.uri)
		return await idebounce("provideSemanticTokens", provideSemanticTokens, document, this.state, this.initOptions)
	}
}
