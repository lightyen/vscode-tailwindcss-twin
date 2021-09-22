import EventEmitter from "events"
import { Settings } from "shared"
import * as lsp from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import idebounce from "~/common/idebounce"
import * as parser from "~/common/twin-parser"
import { LanguageService } from "~/LanguageService"
import { Tailwind, TailwindOptions } from "~/tailwind"
import completion from "./completion"
import completionResolve from "./completionResolve"
import { validate } from "./diagnostics"
import hover from "./hover"
import { provideColorDecorations } from "./provideColor"

export type ServiceOptions = TailwindOptions & Settings

export type Cache = Record<string, Record<string, ReturnType<typeof parser.spread>>>

export class TailwindLanguageService implements LanguageService {
	public state: Tailwind
	options: ServiceOptions
	documents: lsp.TextDocuments<TextDocument>
	cache: Cache
	em = new EventEmitter()
	constructor(documents: lsp.TextDocuments<TextDocument>, options: ServiceOptions) {
		this.options = options
		this.documents = documents
		this.state = new Tailwind(options)
		this.cache = {}
	}
	get ready() {
		if (!this.options.enabled) return false
		return !!this.state.twin
	}
	get hasConfig() {
		return this.state.hasConfig
	}
	get targetConfig(): string {
		return this.state.distConfigPath
	}
	async init() {
		if (this.ready) return void 0
		await this.state.process()
		this.em.emit("ready")
		return void 0
	}
	getColors() {
		return new Promise<string[]>(resolve => {
			if (this.ready) resolve(this.state.twin.colors.map(c => c.key))
			this.em.on("ready", () => {
				resolve(this.state.twin.colors.map(c => c.key))
			})
		})
	}
	async reload(...params: Parameters<Tailwind["reload"]>) {
		return this.state.reload(...params)
	}
	updateSettings(setting: Partial<Settings>) {
		this.options = { ...this.options, ...setting }
	}
	async onCompletion(params: lsp.CompletionParams) {
		if (!this.ready) return undefined
		const document = this.documents.get(params.textDocument.uri)
		if (!document) return undefined
		return completion(document, params.position, this.state, this.options)
	}
	async onCompletionResolve(item: lsp.CompletionItem) {
		if (!this.ready) return item
		return completionResolve(item, this.state, this.options)
	}
	async onHover(params: lsp.HoverParams) {
		if (!this.ready) return undefined
		const document = this.documents.get(params.textDocument.uri)
		if (!document) return undefined
		return hover(document, params.position, this.state, this.options)
	}
	async validate(document: TextDocument) {
		if (this.cache[document.uri] == undefined) {
			this.cache[document.uri] = {}
		}
		if (!this.ready) return []
		if (!this.options.diagnostics.enabled) return []
		return await idebounce("validate" + document.uri, validate, document, this.state, this.options, this.cache)
	}
	async provideColorDecorations(document: TextDocument) {
		if (this.cache[document.uri] == undefined) {
			this.cache[document.uri] = {}
		}
		if (!this.ready) return []
		if (this.options.colorDecorators !== "on") {
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
