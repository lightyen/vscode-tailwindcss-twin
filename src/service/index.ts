import { Extractor, TextDocument } from "@/extractors"
import { typescriptExtractor } from "@/extractors/typescript"
import { defaultLogger as console } from "@/logger"
import { resolveModuleName } from "@/module"
import * as parser from "@/parser"
import type { PnpApi } from "@/pnp"
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
	pnpContext: PnpApi | undefined
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

	async function start() {
		if (!options.enabled || loading) return
		if (state.tw) return
		try {
			loading = true
			console.info("loading:", configPathString)
			const start = process.hrtime.bigint()
			state.readTailwindConfig(options.pnpContext)
			await state.createContext()
			_colorProvider = createColorProvider(state.tw, state.separator)
			const end = process.hrtime.bigint()
			activated.emit("signal")
			console.info(`activated: ${configPathString} (${Number((end - start) / 10n ** 6n) / 10 ** 3}s)\n`)
		} catch (error) {
			console.error(error)
			console.error("load failed: " + configPathString + "\n")
		} finally {
			loading = false
		}
	}

	async function reload() {
		if (!options.enabled || loading) return
		try {
			loading = true
			console.info("reloading:", configPathString)
			const start = process.hrtime.bigint()
			state.readTailwindConfig(options.pnpContext)
			await state.createContext()
			_colorProvider?.dispose()
			_colorProvider = createColorProvider(state.tw, state.separator)
			const end = process.hrtime.bigint()
			activated.emit("signal")
			console.info(`activated: ${configPathString} (${Number((end - start) / 10n ** 6n) / 10 ** 3}s)\n`)
		} catch (error) {
			console.error(error)
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
		return wait(document, undefined, extractor =>
			completion(
				tryRun(
					() =>
						extractor.find(
							document.languageId,
							document.getText(),
							document.offsetAt(position),
							false,
							options.jsxPropImportChecking,
						),
					undefined,
				),
				document,
				position,
				state,
				options,
			),
		)
	}

	async function onCompletionResolve(item: ICompletionItem, tabSize: number) {
		if (!state.tw) return item
		return completionResolve(item, state, tabSize, options)
	}

	async function onHover(document: TextDocument, position: unknown, tabSize: number) {
		return wait(document, undefined, extractor =>
			hover(
				tryRun(
					() =>
						extractor.find(
							document.languageId,
							document.getText(),
							document.offsetAt(position),
							true,
							options.jsxPropImportChecking,
						),
					undefined,
				),
				document,
				position,
				state,
				options,
				tabSize,
			),
		)
	}

	async function renderColorDecoration(editor: vscode.TextEditor) {
		return wait(editor.document, undefined, extractor =>
			_colorProvider?.render(
				tryRun(
					() =>
						extractor.findAll(
							editor.document.languageId,
							editor.document.getText(),
							options.jsxPropImportChecking,
						),
					[],
				),
				editor,
			),
		)
	}

	async function provideDiagnostics(document: TextDocument) {
		return wait(document, [], extractor =>
			validate(
				tryRun(
					() => extractor.findAll(document.languageId, document.getText(), options.jsxPropImportChecking),
					[],
				),
				document,
				state,
				options,
			),
		)
	}

	async function onDocumentColors(document: TextDocument) {
		return wait(document, undefined, extractor =>
			documentColors(
				tryRun(
					() => extractor.findAll(document.languageId, document.getText(), options.jsxPropImportChecking),
					[],
				),
				document,
				state,
				options,
			),
		)
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function tryRun<T extends () => any>(callback: T, defaultValue: ReturnType<T>): ReturnType<T> {
		try {
			return callback()
		} catch (error) {
			console.error(error)
			return defaultValue
		}
	}

	async function wait<ReturnValue = unknown>(
		document: TextDocument,
		defaultValue: ReturnValue,
		feature: (extractor: Extractor) => ReturnValue,
	) {
		if (!loading) {
			if (!state.tw) start()
			return hub<ReturnValue>(document, defaultValue, feature)
		}
		await ready()
		return hub<ReturnValue>(document, defaultValue, feature)
	}

	function hub<ReturnValue = unknown>(
		document: TextDocument,
		defaultValue: ReturnValue,
		feature: (extractor: Extractor) => ReturnValue,
	) {
		// https://code.visualstudio.com/docs/languages/identifiers#_known-language-identifiers
		switch (document.languageId) {
			case "javascript":
			case "javascriptreact":
			case "typescript":
			case "typescriptreact":
				return feature(typescriptExtractor)
			default:
				return defaultValue
		}
	}
}
