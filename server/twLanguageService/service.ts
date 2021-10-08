import EventEmitter from "events"
import path from "path"
import { Settings } from "shared"
import * as lsp from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import { URI } from "vscode-uri"
import idebounce from "~/common/idebounce"
import { defaultLogger as console } from "~/common/logger"
import { resolveModuleName } from "~/common/module"
import { transformSourceMap } from "~/common/sourcemap"
import * as parser from "~/common/twin-parser"
import { createTailwindLoader, ExtensionMode } from "~/tailwind"
import completion from "./completion"
import completionResolve from "./completionResolve"
import { validate } from "./diagnostics"
import hover from "./hover"
import { provideColorDecorations } from "./provideColor"

interface Environment {
	configPath?: URI
	extensionUri: URI
	serverSourceMapUri: URI
	workspaceFolder: URI
	extensionMode: ExtensionMode
}

export type ServiceOptions = Settings & Environment

export type Cache = Record<string, Record<string, ReturnType<typeof parser.spread>>>

export function createTailwindLanguageService(documents: lsp.TextDocuments<TextDocument>, options: ServiceOptions) {
	const cache: Cache = {}
	const emitter = new EventEmitter()
	const defaultConfigUri = URI.file(
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		resolveModuleName("tailwindcss/defaultConfig", { paths: options.extensionUri.fsPath })!,
	)
	const configPath = options.configPath ?? defaultConfigUri
	const state = createTailwindLoader(configPath, options.extensionUri, options.extensionMode)
	const isDefault = options.configPath == undefined
	const configPathString = isDefault ? "tailwindcss/defaultConfig" : relativeWorkspace(configPath)
	let loading = false

	return {
		get configPath() {
			return configPath
		},
		configPathString,
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

	function relativeWorkspace(uri: URI) {
		return path.relative(options.workspaceFolder.path, uri.path)
	}

	/** Load tailwind.config to memory and run PostCSS. */
	async function start(): Promise<void> {
		if (!options.enabled || loading) return
		if (state.tw) return
		try {
			loading = true
			console.info("loading:", configPathString)
			const start = process.hrtime.bigint()
			state.readTailwindConfig()
			state.createContext()
			const end = process.hrtime.bigint()
			console.info(`activated: ${configPathString} (${Number((end - start) / 10n ** 6n) / 10 ** 3}s)\n`)
			emitter.emit("ready")
		} catch (error) {
			const err = error as Error
			if (err.stack) err.stack = transformSourceMap(options.serverSourceMapUri.fsPath, err.stack)
			console.error(err)
			console.error("load failed: " + configPathString + "\n")
		} finally {
			loading = false
		}
	}

	/** Reoad tailwind.config and run PostCSS. */
	async function reload() {
		if (!options.enabled || loading) return
		try {
			loading = true
			console.info("reloading:", configPathString)
			const start = process.hrtime.bigint()
			state.readTailwindConfig()
			state.createContext()
			const end = process.hrtime.bigint()
			console.info(`activated: ${configPathString} (${Number((end - start) / 10n ** 6n) / 10 ** 3}s)\n`)
		} catch (error) {
			const err = error as Error
			if (err.stack) err.stack = transformSourceMap(options.serverSourceMapUri.fsPath, err.stack)
			console.error(err)
			console.error("reload failed: " + configPathString + "\n")
		} finally {
			loading = false
		}
	}

	/** Update user settings.(no need to reload.) */
	function updateSettings(setting: Partial<Settings>) {
		options = { ...options, ...setting }
	}

	/** Provide auto complete feature. */
	// TODO: cache completionList
	async function onCompletion(params: lsp.CompletionParams) {
		if (!options.enabled || loading) return
		if (!state.tw) {
			start()
			return undefined
		}
		const document = documents.get(params.textDocument.uri)
		if (!document) return undefined
		return completion(document, params.position, state, options)
	}

	/** Provide completion resolve item feature. */
	async function onCompletionResolve(item: lsp.CompletionItem) {
		if (!state.tw) return item
		return completionResolve(item, state, options)
	}

	/** Provide on hover feature. */
	async function onHover(params: lsp.HoverParams) {
		if (!options.enabled || loading) return
		if (!state.tw) {
			start()
			return undefined
		}
		const document = documents.get(params.textDocument.uri)
		if (!document) return undefined
		return hover(document, params.position, state, options)
	}

	/** Provide validate feature. */
	async function onValidate(document: TextDocument) {
		if (!options.enabled || loading) return []
		if (cache[document.uri] == undefined) {
			cache[document.uri] = {}
		}
		if (!state.tw) {
			start()
			return []
		}
		if (!options.diagnostics.enabled) return []
		return await idebounce("validate" + document.uri, validate, document, state, options, cache)
	}

	/** Provide color decrators feature. */
	async function onProvideColorDecorations(document: TextDocument) {
		if (!options.enabled || loading) return
		if (cache[document.uri] == undefined) {
			cache[document.uri] = {}
		}
		if (!state.tw) {
			start()
			return []
		}
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
		if (!options.enabled || loading) return
		if (!state.tw) []
		// TODO: onDocumentColor
		return []
	}

	async function onColorPresentation(params: lsp.ColorPresentationParams) {
		if (!options.enabled || loading) return
		if (!state.tw) []
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
		if (!options.enabled || loading) return
		if (!state.tw) []
		// TODO: exclude custom classname
		return new Promise<string[]>(resolve => {
			if (state.tw) {
				resolve(Array.from(state.tw.colors.keys()))
			} else {
				emitter.once("ready", () => {
					resolve(Array.from(state.tw.colors.keys()))
				})
			}
		})
	}
}
