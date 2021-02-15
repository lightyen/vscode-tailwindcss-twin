import * as lsp from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import { Settings } from "settings"
import { Tailwind, TailwindOptions } from "~/tailwind"
import { LanguageService } from "~/LanguageService"
import completion from "./completion"
import completionResolve from "./completionResolve"
import hover from "./hover"
import { validate } from "./diagnostics"
import provideColor from "./provideColor"
import provideSemanticTokens from "./semanticTokens"
import findAllElements from "~/common/findAllElements"
import idebounce from "~/common/idebounce"

export type ServiceOptions = TailwindOptions & Settings

export type Cache = Record<string, Record<string, ReturnType<typeof findAllElements>>>

export class TailwindLanguageService implements LanguageService {
	public state: Tailwind
	options: ServiceOptions
	documents: lsp.TextDocuments<TextDocument>
	cache: Cache
	constructor(documents: lsp.TextDocuments<TextDocument>, options: ServiceOptions) {
		this.options = options
		this.documents = documents
		this.state = new Tailwind(options)
		this.cache = {}
	}
	init() {
		if (this.isReady()) return void 0
		return this.state.process()
	}
	reload(...params: Parameters<Tailwind["reload"]>) {
		return this.state.reload(...params)
	}
	updateSettings(setting: Partial<Settings>) {
		this.options = { ...this.options, ...setting }
	}
	isReady() {
		return !!this.state.classnames
	}
	onCompletion(params: lsp.TextDocumentPositionParams) {
		if (!this.isReady()) return null
		const document = this.documents.get(params.textDocument.uri)
		return completion(document, params.position, this.state, this.options)
	}
	onCompletionResolve(item: lsp.CompletionItem) {
		if (!this.isReady()) return null
		return completionResolve(item, this.state, this.options)
	}
	onHover(params: lsp.HoverParams) {
		if (!this.isReady()) return null
		const document = this.documents.get(params.textDocument.uri)
		return hover(document, params.position, this.state, this.options)
	}
	async validate(document: TextDocument) {
		const uri = document.uri.toString()
		this.cache[uri] = {}
		if (!this.options.diagnostics.enabled) return []
		if (!this.isReady()) return []
		return await idebounce("validate" + document.uri, validate, document, this.state, this.options, this.cache)
	}
	async provideColor(document: TextDocument, colors: lsp.ColorInformation[]) {
		if (!this.options.colorDecorators) return []
		if (!this.isReady()) return []
		return await idebounce(
			"provideColor" + document.uri,
			provideColor,
			document,
			this.state,
			this.options,
			this.cache,
			colors,
		)
	}
	async provideSemanticTokens(params: lsp.SemanticTokensParams) {
		if (!this.isReady()) return null
		// TODO: use cache
		const document = this.documents.get(params.textDocument.uri)
		return await idebounce(
			"provideSemanticTokens" + document.uri,
			provideSemanticTokens,
			document,
			this.state,
			this.options,
		)
	}
}
