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

	const completionItemProvider: vscode.CompletionItemProvider<ICompletionItem> = {
		provideCompletionItems(document, position, token, context) {
			return onCompletion(document, position)
		},
		resolveCompletionItem(item, token) {
			return onCompletionResolve(item)
		},
	}

	const hoverProvider: vscode.HoverProvider = {
		provideHover(document, position, token) {
			return onHover(document, position)
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
		provideDiagnostics(document: TextDocument) {
			return new Promise<ReturnType<typeof validate> | undefined>(resolve => {
				if (!options.enabled) resolve(undefined)
				if (!loading) {
					if (!state.tw) start()
					resolve(validate(document, state, options))
				} else {
					activated.once("signal", () => {
						resolve(validate(document, state, options))
					})
				}
			})
		},
		colorProvider: {
			dispose() {
				_colorProvider?.dispose()
			},
			render: renderColorDecoration,
		},
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
		if (!options.enabled || loading) return
		if (!state.tw) {
			start()
			return new vscode.CompletionList([], true)
		}
		return completion(document, position, state, options)
	}

	/** Provide completion resolve item feature. */
	async function onCompletionResolve(item: ICompletionItem) {
		if (!state.tw) return item
		return completionResolve(item, state, options)
	}

	// /** Provide on hover feature. */
	async function onHover(document: TextDocument, position: unknown) {
		if (!options.enabled || loading) return
		if (!state.tw) {
			start()
			return undefined
		}
		return hover(document, position, state, options)
	}

	async function renderColorDecoration(editor: vscode.TextEditor) {
		if (!options.enabled) return
		return new Promise<void>(resolve => {
			if (!loading) {
				if (!state.tw) {
					start()
				}
				const a = process.hrtime.bigint()
				_colorProvider?.render(editor)
				const b = process.hrtime.bigint()
				console.trace(`colors (${Number((b - a) / 10n ** 6n)}ms)`)
				resolve()
			} else {
				activated.once("signal", () => {
					const a = process.hrtime.bigint()
					_colorProvider?.render(editor)
					const b = process.hrtime.bigint()
					console.trace(`async colors (${Number((b - a) / 10n ** 6n)}ms)`)
					resolve()
				})
			}
		})
	}
}
