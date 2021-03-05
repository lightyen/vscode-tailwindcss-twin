import { Settings } from "shared"
import * as lsp from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import findAllElements from "~/common/findAllElements"
import idebounce from "~/common/idebounce"
import { LanguageService } from "~/LanguageService"
import { Tailwind, TailwindOptions } from "~/tailwind"
import completion from "./completion"
import completionResolve from "./completionResolve"
import { validate } from "./diagnostics"
import hover from "./hover"
import { provideColorDecorations } from "./provideColor"
import provideSemanticTokens from "./semanticTokens"

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
	async init() {
		if (this.isReady()) return void 0
		return this.state.process()
	}
	async reload(...params: Parameters<Tailwind["reload"]>) {
		return this.state.reload(...params)
	}
	updateSettings(setting: Partial<Settings>) {
		this.options = { ...this.options, ...setting }
	}
	isReady() {
		if (!this.options.enabled && !this.state.classnames) {
			console.log("not ready")
		}
		if (!this.options.enabled) return false
		return !!this.state.classnames
	}
	async onCompletion(params: lsp.CompletionParams) {
		if (!this.isReady()) return null
		const document = this.documents.get(params.textDocument.uri)
		return completion(document, params.position, this.state, this.options)
	}
	async onCompletionResolve(item: lsp.CompletionItem) {
		if (!this.isReady()) return null
		return completionResolve(item, this.state, this.options)
	}
	async onHover(params: lsp.HoverParams) {
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
	async provideColorDecorations(document: TextDocument) {
		if (!this.options.colorDecorators) return []
		if (!this.isReady()) {
			return []
		}
		return await idebounce(
			"provideColorDecorations" + document.uri,
			provideColorDecorations,
			document,
			this.state,
			this.options,
			this.cache,
		)
	}
	async provideSemanticTokens(params: lsp.SemanticTokensParams) {
		const builder = new lsp.SemanticTokensBuilder()
		if (!this.isReady()) return builder.build()
		// TODO: use cache
		const document = this.documents.get(params.textDocument.uri)
		return await idebounce(
			"provideSemanticTokens" + document.uri,
			provideSemanticTokens,
			builder,
			document,
			this.state,
			this.options,
		)
	}
	async onDocumentColor(params: lsp.DocumentColorParams) {
		// TODO: onDocumentColor
		return []
	}
	async onColorPresentation(params: lsp.ColorPresentationParams) {
		// TODO: onColorPresentation
		// const c = chroma(color.red * 255, color.green * 255, color.blue * 255, color.alpha)
		// 	return [
		// 		lsp.ColorPresentation.create(c.css(), lsp.TextEdit.replace(range, c.css())),
		// 		lsp.ColorPresentation.create(c.hex(), lsp.TextEdit.replace(range, c.hex())),
		// 		lsp.ColorPresentation.create(c.css("hsl"), lsp.TextEdit.replace(range, c.css("hsl"))),
		// 	]
		return []
	}
}
