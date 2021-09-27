import EventEmitter from "events"
import path from "path"
import { Settings } from "shared"
import * as lsp from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import { URI } from "vscode-uri"
import idebounce from "~/common/idebounce"
import * as parser from "~/common/twin-parser"
import { createTailwindLoader, defaultConfigUri, ExtensionMode } from "~/tailwind"
import completion from "./completion"
import completionResolve from "./completionResolve"
import { validate } from "./diagnostics"
import hover from "./hover"
import { provideColorDecorations } from "./provideColor"

interface Environment {
	configPath?: URI
	extensionUri: URI
	workspaceFolder: URI
	extensionMode: ExtensionMode
}

export type ServiceOptions = Settings & Environment

export type Cache = Record<string, Record<string, ReturnType<typeof parser.spread>>>

export function createTailwindLanguageService(documents: lsp.TextDocuments<TextDocument>, options: ServiceOptions) {
	const cache: Cache = {}
	const emitter = new EventEmitter()
	const configPath = options.configPath ?? defaultConfigUri
	const state = createTailwindLoader(configPath, options.extensionUri, options.extensionMode)
	const isDefault = options.configPath == undefined
	const configStr = isDefault ? "tailwindcss/defaultConfig" : relativeWorkspace(configPath)

	return {
		get configPath() {
			return configPath
		},
		start,
		getColors,
		reload,
		updateSettings,
		onCompletion,
		onCompletionResolve,
		onHover,
		validate: onValidate,
		provideColorDecorations: onProvideColorDecorations,
		onDocumentColor,
		onColorPresentation,
	}

	/** Ask whether state machine is ready. */
	function ready() {
		if (!options.enabled) return false
		return !!state.twin
	}

	function relativeWorkspace(uri: URI) {
		return path.relative(options.workspaceFolder.path, uri.path)
	}

	/** Load tailwind.config to memory and run PostCSS. */
	async function start(): Promise<void> {
		if (ready()) return
		try {
			await state.readTailwindConfig()
			console.info("loading:", configStr)
			const start = process.hrtime.bigint()
			await state.runPostCSS()
			const end = process.hrtime.bigint()
			console.info(`activated: ${configStr} (${Number((end - start) / 10n ** 6n) / 10 ** 3}s)\n`)
			emitter.emit("ready")
		} catch (error) {
			console.error(error)
			console.error("failed:", configStr)
		}
	}

	/** Reoad tailwind.config and run PostCSS. */
	async function reload() {
		try {
			await state.readTailwindConfig()
			console.info("reloading:", configStr)
			const start = process.hrtime.bigint()
			await state.runPostCSS()
			const end = process.hrtime.bigint()
			console.info(`activated: ${configStr} (${Number((end - start) / 10n ** 6n) / 10 ** 3}s)\n`)
		} catch (error) {
			console.error(error)
			console.error("failed:", configStr)
		}
	}

	/** Update user settings.(no need to reload.) */
	function updateSettings(setting: Partial<Settings>) {
		options = { ...options, ...setting }
	}

	/** Provide auto complete feature. */
	async function onCompletion(params: lsp.CompletionParams) {
		if (!ready()) return undefined
		const document = documents.get(params.textDocument.uri)
		if (!document) return undefined
		return completion(document, params.position, state, options)
	}

	/** Provide completion resolve item feature. */
	async function onCompletionResolve(item: lsp.CompletionItem) {
		if (!ready()) return item
		return completionResolve(item, state, options)
	}

	/** Provide on hover feature. */
	async function onHover(params: lsp.HoverParams) {
		if (!ready()) return undefined
		const document = documents.get(params.textDocument.uri)
		if (!document) return undefined
		return hover(document, params.position, state, options)
	}

	/** Provide validate feature. */
	async function onValidate(document: TextDocument) {
		if (cache[document.uri] == undefined) {
			cache[document.uri] = {}
		}
		if (!ready()) return []
		if (!options.diagnostics.enabled) return []
		return await idebounce("validate" + document.uri, validate, document, state, options, cache)
	}

	/** Provide color decrators feature. */
	async function onProvideColorDecorations(document: TextDocument) {
		if (cache[document.uri] == undefined) {
			cache[document.uri] = {}
		}
		if (!ready()) return []
		if (options.colorDecorators !== "on") {
			return []
		}
		return await idebounce(
			"provideColorDecorations" + document.uri,
			provideColorDecorations,
			document,
			state,
			options,
			cache,
		)
	}

	async function onDocumentColor(params: lsp.DocumentColorParams) {
		if (!ready()) []
		// TODO: onDocumentColor
		return []
	}

	async function onColorPresentation(params: lsp.ColorPresentationParams) {
		if (!ready()) []
		// TODO: onColorPresentation
		// const c = chroma(color.red * 255, color.green * 255, color.blue * 255, color.alpha)
		// 	return [
		// 		lsp.ColorPresentation.create(c.css(), lsp.TextEdit.replace(range, c.css())),
		// 		lsp.ColorPresentation.create(c.hex(), lsp.TextEdit.replace(range, c.hex())),
		// 		lsp.ColorPresentation.create(c.css("hsl"), lsp.TextEdit.replace(range, c.css("hsl"))),
		// 	]
		return []
	}

	function getColors() {
		return new Promise<string[]>(resolve => {
			if (ready()) {
				resolve(state.twin.colors.map(c => c.key))
			} else {
				emitter.once("ready", () => {
					resolve(state.twin.colors.map(c => c.key))
				})
			}
		})
	}
}
