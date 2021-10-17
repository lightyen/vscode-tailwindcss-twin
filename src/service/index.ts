import { TextDocument } from "@/ast"
import { defaultLogger as console } from "@/logger"
import { resolveModuleName } from "@/module"
import { transformSourceMap } from "@/sourcemap"
import * as parser from "@/twin-parser"
import EventEmitter from "events"
import path from "path"
import vscode from "vscode"
import { URI } from "vscode-uri"
import { Settings } from "~/shared"
import { ICompletionItem } from "~/typings/completion"
import { createColorProvider } from "./colorProvider"
import completion from "./completion"
import completionResolve from "./completionResolve"
import { validate } from "./diagnostics"
import documentColors from "./documentColors"
import hover from "./hover"
import { createTailwindLoader, ExtensionMode } from "./tailwind"

interface Environment {
	configPath?: URI
	workspaceFolder: URI
	extensionUri: URI
	serverSourceMapUri: URI
	extensionMode: ExtensionMode
}

export type ServiceOptions = Settings & Environment

export type Cache = Record<string, Record<string, ReturnType<typeof parser.spread>>>

export function createTailwindLanguageService(options: ServiceOptions) {
	const defaultConfigUri = URI.file(
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		resolveModuleName("tailwindcss/defaultConfig", { paths: options.extensionUri.fsPath })!,
	)
	const configPath = options.configPath ?? defaultConfigUri
	const state = createTailwindLoader(configPath, options.extensionUri, options.extensionMode)
	const isDefault = options.configPath == undefined
	const configPathString = isDefault ? "tailwindcss/defaultConfig" : relativeWorkspace(configPath)
	let loading = false
	let _colorProvider: ReturnType<typeof createColorProvider> | undefined

	const completionItemProvider: vscode.CompletionItemProvider<ICompletionItem> & { tabSize: number } = {
		tabSize: 4,
		provideCompletionItems(document, position) {
			return onCompletion(document, position)
		},
		resolveCompletionItem(item) {
			return onCompletionResolve(item, this.tabSize)
		},
	}

	const hoverProvider: vscode.HoverProvider & { tabSize: number } = {
		tabSize: 4,
		provideHover(document, position) {
			return onHover(document, position, this.tabSize)
		},
	}

	const documentColorProvider: vscode.DocumentColorProvider = {
		provideDocumentColors(document) {
			return onDocumentColors(document)
		},
		provideColorPresentations(document) {
			return undefined
		},
	}

	const activated = new EventEmitter()

	return {
		get configPath() {
			return configPath
		},
		configPathString,
		start,
		reload,
		updateSettings,
		onCompletion,
		onCompletionResolve,
		onHover,
		completionItemProvider,
		hoverProvider,
		provideDiagnostics,
		colorProvider: {
			dispose() {
				_colorProvider?.dispose()
			},
			render: renderColorDecoration,
		},
		documentColorProvider,
	}

	function ready() {
		return new Promise<void>(resolve => {
			activated.once("signal", () => {
				resolve()
			})
		})
	}

	function relativeWorkspace(uri: URI) {
		return path.relative(options.workspaceFolder.path, uri.path)
	}

	function start() {
		if (!options.enabled || loading) return
		if (state.tw) return
		try {
			loading = true
			console.info("loading:", configPathString)
			const start = process.hrtime.bigint()
			state.readTailwindConfig()
			state.createContext()
			_colorProvider = createColorProvider(state.tw)
			const end = process.hrtime.bigint()
			activated.emit("signal")
			console.info(`activated: ${configPathString} (${Number((end - start) / 10n ** 6n) / 10 ** 3}s)\n`)
		} catch (error) {
			const err = error as Error
			if (err.stack) err.stack = transformSourceMap(options.serverSourceMapUri.fsPath, err.stack)
			console.error(err)
			console.error("load failed: " + configPathString + "\n")
		} finally {
			loading = false
		}
	}

	function reload() {
		if (!options.enabled || loading) return
		try {
			loading = true
			console.info("reloading:", configPathString)
			const start = process.hrtime.bigint()
			state.readTailwindConfig()
			state.createContext()
			_colorProvider?.dispose()
			_colorProvider = createColorProvider(state.tw)
			const end = process.hrtime.bigint()
			activated.emit("signal")
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
	async function onCompletion(document: TextDocument, position: unknown) {
		if (!options.enabled) return undefined
		if (!loading) {
			if (!state.tw) start()
			return completion(document, position, state, options)
		}
		await ready()
		return completion(document, position, state, options)
	}

	/** Provide completion resolve item feature. */
	async function onCompletionResolve(item: ICompletionItem, tabSize: number) {
		if (!state.tw) return item
		return completionResolve(item, state, tabSize, options)
	}

	// /** Provide on hover feature. */
	async function onHover(document: TextDocument, position: unknown, tabSize: number) {
		if (!options.enabled) return undefined
		if (!loading) {
			if (!state.tw) start()
			return hover(document, position, state, tabSize, options)
		}
		await ready()
		return hover(document, position, state, tabSize, options)
	}

	async function renderColorDecoration(editor: vscode.TextEditor) {
		if (!options.enabled) return
		if (!loading) {
			if (!state.tw) start()
			const a = process.hrtime.bigint()
			_colorProvider?.render(editor)
			const b = process.hrtime.bigint()
			console.trace(`colors (${Number((b - a) / 10n ** 6n)}ms)`)
			return
		}
		await ready()
		const a = process.hrtime.bigint()
		_colorProvider?.render(editor)
		const b = process.hrtime.bigint()
		console.trace(`colors (${Number((b - a) / 10n ** 6n)}ms)`)
	}

	async function provideDiagnostics(document: TextDocument) {
		if (!options.enabled) return []
		if (!loading) {
			if (!state.tw) start()
			return validate(document, state, options)
		}
		await ready()
		return validate(document, state, options)
	}

	async function onDocumentColors(document: TextDocument) {
		if (!loading) {
			if (!state.tw) start()
			return documentColors(document, state, options)
		}
		await ready()
		return []
	}
}
