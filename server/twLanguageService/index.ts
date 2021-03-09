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
	get ready() {
		if (!this.options.enabled) return false
		return !!this.state.classnames
	}
	get hasConfig() {
		return this.state.hasConfig
	}
	get targetConfig(): string {
		return this.state.distConfigPath
	}
	async init() {
		if (this.ready) return void 0
		return this.state.process()
	}
	async reload(...params: Parameters<Tailwind["reload"]>) {
		return this.state.reload(...params)
	}
	updateSettings(setting: Partial<Settings>) {
		this.options = { ...this.options, ...setting }
	}
	async onCompletion(params: lsp.CompletionParams) {
		if (!this.ready) return null
		const document = this.documents.get(params.textDocument.uri)
		return completion(document, params.position, this.state, this.options)
	}
	async onCompletionResolve(item: lsp.CompletionItem) {
		if (!this.ready) return null
		return completionResolve(item, this.state, this.options)
	}
	async onHover(params: lsp.HoverParams) {
		if (!this.ready) return null
		const document = this.documents.get(params.textDocument.uri)
		return hover(document, params.position, this.state, this.options)
	}
	async validate(document: TextDocument) {
		this.cache[document.uri] = {}
		if (!this.ready) return []
		if (!this.options.diagnostics.enabled) return []
		return await idebounce("validate" + document.uri, validate, document, this.state, this.options, this.cache)
	}
	async provideColorDecorations(document: TextDocument) {
		if (!this.ready) return []
		if (!this.options.colorDecorators) return []
		return await idebounce(
			"provideColorDecorations" + document.uri,
			provideColorDecorations,
			document,
			this.state,
			this.options,
			this.cache,
		)
	}
	async onDocumentColor(params: lsp.DocumentColorParams) {
		if (!this.ready) []
		// TODO: onDocumentColor
		return []
	}
	async onColorPresentation(params: lsp.ColorPresentationParams) {
		if (!this.ready) []
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
