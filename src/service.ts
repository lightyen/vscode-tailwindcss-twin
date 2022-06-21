import { defaultExtractors, TextDocument } from "@/extractors"
import typescriptExtractor from "@/extractors/typescript"
import { defaultLogger as console } from "@/logger"
import * as parser from "@/parser"
import EventEmitter from "events"
import path from "path"
import typescript from "typescript"
import vscode from "vscode"
import { URI } from "vscode-uri"
import type { ServiceOptions } from "~/shared"
import { Settings } from "~/shared"
import { ICompletionItem } from "~/typings/completion"
import { createColorProvider } from "./service/colorProvider"
import completion from "./service/completion"
import completionResolve from "./service/completionResolve"
import { validate } from "./service/diagnostics"
import documentColors from "./service/documentColors"
import hover from "./service/hover"
import { createTailwindLoader } from "./service/tailwind"

const context = { console, typescriptExtractor, typescript }

export type Cache = Record<string, Record<string, ReturnType<typeof parser.spread>>>

export function createTailwindLanguageService(options: ServiceOptions) {
	const configPath = options.configPath
	const isDefaultConfig = options.configPath == undefined
	const state = createTailwindLoader(configPath, options.extensionUri, isDefaultConfig, options.extensionMode)
	const configPathMessage = configPath == undefined ? "tailwindcss/defaultConfig" : relativeWorkspace(configPath)
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
	const activatedEvent = new vscode.EventEmitter<void>()

	return {
		get configPath() {
			return configPath ?? URI.parse("tailwindcss/defaultConfig")
		},
		get workspaceFolder() {
			return options.workspaceFolder
		},
		getConfigPath() {
			return configPath
		},
		getState() {
			return state
		},
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
		activatedEvent,
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
			console.info("loading:", configPathMessage)
			const start = process.hrtime.bigint()
			state.readTailwindConfig(options.pnpContext)
			state.createContext()
			_colorProvider = createColorProvider(state.tw, state.separator)
			const end = process.hrtime.bigint()
			activated.emit("signal")
			console.info(`activated: ${configPathMessage} (${Number((end - start) / 10n ** 6n) / 10 ** 3}s)\n`)
			activatedEvent.fire()
		} catch (error) {
			console.error(error)
			console.error("load failed: " + configPathMessage + "\n")
		} finally {
			loading = false
		}
	}

	function reload() {
		if (!options.enabled || loading) return
		try {
			loading = true
			console.info("reloading:", configPathMessage)
			const start = process.hrtime.bigint()
			state.readTailwindConfig(options.pnpContext)
			state.createContext()
			_colorProvider?.dispose()
			_colorProvider = createColorProvider(state.tw, state.separator)
			const end = process.hrtime.bigint()
			activated.emit("signal")
			console.info(`activated: ${configPathMessage} (${Number((end - start) / 10n ** 6n) / 10 ** 3}s)\n`)
			activatedEvent.fire()
		} catch (error) {
			console.error(error)
			console.error("reload failed: " + configPathMessage + "\n")
		} finally {
			loading = false
		}
	}

	/** Update user settings.(no need to reload.) */
	function updateSettings(setting: Partial<Settings>) {
		options = { ...options, ...setting }
	}

	async function onCompletion(document: TextDocument, position: unknown) {
		return wait<vscode.ProviderResult<vscode.CompletionList<ICompletionItem>>>(undefined, defaultValue => {
			try {
				const token = defaultExtractors
					.concat(state.extractors)
					.filter(e => e.acceptLanguage(document.languageId))
					.map(extractor =>
						extractor.find(
							document.languageId,
							document.getText(),
							document.offsetAt(position),
							options.jsxPropImportChecking,
							context,
						),
					)
					.reduce((prev, current) => {
						return prev ?? current
					}, undefined)

				return completion(token, document, position, state, options)
			} catch (error) {
				console.error(error)
				return defaultValue
			}
		})
	}

	async function onCompletionResolve(item: ICompletionItem, tabSize: number) {
		if (!state.tw) return item
		return completionResolve(item, state, tabSize, options)
	}

	async function onHover(document: TextDocument, position: unknown, tabSize: number) {
		return wait<vscode.ProviderResult<vscode.Hover>>(undefined, defaultValue => {
			try {
				const token = defaultExtractors
					.concat(state.extractors)
					.filter(e => e.acceptLanguage(document.languageId))
					.map(extractor =>
						extractor.find(
							document.languageId,
							document.getText(),
							document.offsetAt(position) + 1,
							options.jsxPropImportChecking,
							context,
						),
					)
					.reduce((prev, current) => {
						return prev ?? current
					}, undefined)
				return hover(token, document, position, state, options, tabSize)
			} catch (error) {
				console.error(error)
				return defaultValue
			}
		})
	}

	async function renderColorDecoration(editor: vscode.TextEditor) {
		return wait(void 0, () => {
			if (!_colorProvider) return
			const document = editor.document
			try {
				const tokens = defaultExtractors
					.concat(state.extractors)
					.filter(e => e.acceptLanguage(document.languageId))
					.flatMap(extractor =>
						extractor.findAll(
							document.languageId,
							document.getText(),
							options.jsxPropImportChecking,
							context,
						),
					)
				_colorProvider.render(tokens, editor, options)
			} catch (error) {
				console.error(error)
			}
		})
	}

	async function provideDiagnostics(document: TextDocument) {
		return wait<vscode.Diagnostic[]>([], defaultValue => {
			try {
				const tokens = defaultExtractors
					.concat(state.extractors)
					.filter(e => e.acceptLanguage(document.languageId))
					.flatMap(extractor =>
						extractor.findAll(
							document.languageId,
							document.getText(),
							options.jsxPropImportChecking,
							context,
						),
					)
				return validate(tokens, document, state, options)
			} catch (error) {
				console.error(error)
				return defaultValue
			}
		})
	}

	async function onDocumentColors(document: TextDocument) {
		return wait<vscode.ProviderResult<vscode.ColorInformation[]>>(undefined, defaultValue => {
			try {
				const tokens = defaultExtractors
					.concat(state.extractors)
					.filter(e => e.acceptLanguage(document.languageId))
					.flatMap(extractor =>
						extractor.findAll(
							document.languageId,
							document.getText(),
							options.jsxPropImportChecking,
							context,
						),
					)
				return documentColors(tokens, document, state, options)
			} catch (error) {
				console.error(error)
				return defaultValue
			}
		})
	}

	async function wait<ReturnValue = unknown>(
		defaultValue: ReturnValue,
		callback: (defaultValue: ReturnValue) => ReturnValue,
	) {
		if (!loading) {
			if (!state.tw) start()
			return callback(defaultValue)
		}
		await ready()
		return callback(defaultValue)
	}
}
