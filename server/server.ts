import { deepStrictEqual } from "assert"
import path from "path"
import { DIAGNOSTICS_ID, NAME, SECTION_ID, Settings } from "shared"
import { TextDocument } from "vscode-languageserver-textdocument"
import * as lsp from "vscode-languageserver/node"
import { FileChangeType } from "vscode-languageserver/node"
import { URI, Utils } from "vscode-uri"
import { defaultLogger as console } from "~/common/logger"
import { importFrom } from "~/common/module"
import packageInfo from "../package.json"
import { intl } from "./locale"
import { ExtensionMode } from "./tailwind"
import { createTailwindLanguageService } from "./twLanguageService/service"

interface InitializationOptions extends Settings {
	extensionMode: ExtensionMode
	/** uri */
	workspaceFolder: string
	/** uri */
	configs: string[]
	/** uri */
	extensionFolder: string
	/** uri */
	serverSourceMapUri: string
}

function matchService(uri: string, services: Map<string, ReturnType<typeof createTailwindLanguageService>>) {
	const arr = Array.from(services)
		.filter(([workingDir]) => {
			const rel = path.relative(workingDir, uri)
			return !rel.startsWith("..")
		})
		.sort((a, b) => b[0].localeCompare(a[0]))
	return arr[0]?.[1]
}

const priority = [".ts", ".js", ".cjs"]

function connectLsp() {
	const connection: lsp.Connection = lsp.createConnection(lsp.ProposedFeatures.all)
	const documents = new lsp.TextDocuments(TextDocument)
	const services: Map<string, ReturnType<typeof createTailwindLanguageService>> = new Map()
	const configFolders: Map<string, URI[]> = new Map()
	let hasConfigurationCapability = false
	let hasDiagnosticRelatedInformationCapability = false
	let workspaceFolder: URI
	let extensionMode: ExtensionMode
	let defaultServiceRunning = false
	let settings: Settings
	let serverSourceMapUri: URI
	let extensionUri: URI

	connection.listen()
	documents.listen(connection)

	const prioritySorter = (a: URI, b: URI) => {
		if (a.toString().length === b.toString().length) {
			return priority.indexOf(Utils.extname(a)) - priority.indexOf(Utils.extname(b))
		}
		return b.toString().length - a.toString().length
	}

	connection.onInitialize(async (params, _cancel, progress) => {
		const { capabilities } = params
		hasConfigurationCapability = capabilities.workspace?.configuration ?? false
		hasDiagnosticRelatedInformationCapability =
			capabilities.textDocument?.publishDiagnostics?.relatedInformation ?? false
		const options = params.initializationOptions as InitializationOptions
		serverSourceMapUri = URI.parse(options.serverSourceMapUri)
		extensionUri = URI.parse(options.extensionFolder)
		workspaceFolder = URI.parse(options.workspaceFolder)
		extensionMode = options.extensionMode
		const configs = options.configs.map(c => URI.parse(c)).sort(prioritySorter)
		console.level = options.logLevel
		settings = options
		delete settings["workspaceFolder"]
		delete settings["configs"]

		// backward compatibility
		if (typeof settings.rootFontSize === "boolean") {
			settings.rootFontSize = settings.rootFontSize ? 16 : 0
		}
		if (typeof settings.colorDecorators === "boolean") {
			settings.colorDecorators = settings.colorDecorators ? "on" : "off"
		}

		progress.begin(`Initializing ${NAME}`)

		function getLibVersion(lib: string) {
			return packageInfo.dependencies[lib]
		}

		globalThis.console.info(
			`TypeScript ${intl.formatMessage({ id: "ext.debug-outout.version" })}:`,
			importFrom("typescript", { cache: true, base: extensionUri.fsPath }).version,
		)
		globalThis.console.info(
			`Tailwind ${intl.formatMessage({ id: "ext.debug-outout.version" })}:`,
			getLibVersion("tailwindcss"),
		)
		globalThis.console.info(
			`PostCSS ${intl.formatMessage({ id: "ext.debug-outout.version" })}:`,
			getLibVersion("postcss"),
		)

		for (const configPath of configs) {
			addService(configPath, settings)
		}

		addDefaultService(settings)

		documents.all().forEach(document => {
			matchService(document.uri, services)?.start()
		})

		bind()

		progress.done()

		return {
			capabilities: {
				workspace: {
					workspaceFolders: {
						supported: true,
					},
				},
				textDocumentSync: {
					openClose: true,
					change: lsp.TextDocumentSyncKind.Incremental, // trigger validate
				},
				colorProvider: true,
				completionProvider: {
					resolveProvider: true,
					triggerCharacters: [
						'"',
						"'",
						"`",
						" ",
						"(",
						":",
						"-",
						"/",
						".",
						"0",
						"1",
						"2",
						"3",
						"4",
						"5",
						"6",
						"7",
						"8",
						"9",
						"[",
					],
				},
				hoverProvider: true,
				codeActionProvider: true,
			},
		}
	})

	connection.onInitialized(async e => {
		if (hasConfigurationCapability) {
			connection.client.register(lsp.DidChangeConfigurationNotification.type)
		}
	})

	// when tailwind.config changed
	connection.onDidChangeWatchedFiles(async ({ changes }) => {
		for (const change of changes) {
			switch (change.type) {
				case FileChangeType.Created:
					addService(URI.parse(change.uri), settings, true)
					break
				case FileChangeType.Deleted:
					removeService(URI.parse(change.uri), settings, true)
					break
				case FileChangeType.Changed:
					await reloadService(URI.parse(change.uri))
					break
			}
		}
		documents.all().forEach(document => matchService(document.uri, services)?.validate(document))
	})

	connection.onDidChangeConfiguration(async params => {
		console.info(`[setting changes were detected]`)
		if (hasConfigurationCapability) {
			const extSettings: Settings = await connection.workspace.getConfiguration({ section: SECTION_ID })

			let needToUpdate = false
			let needToRenderColors = false
			let needToDiagnostics = false

			if (settings.logLevel !== extSettings.logLevel) {
				settings.logLevel = extSettings.logLevel
				needToUpdate = true
				console.info(`logLevel = ${settings.logLevel}`)
				console.level = settings.logLevel
			}

			if (settings.enabled !== extSettings.enabled) {
				settings.enabled = extSettings.enabled
				needToUpdate = true
				console.info(`enabled = ${settings.enabled}`)
			}

			if (settings.preferVariantWithParentheses !== extSettings.preferVariantWithParentheses) {
				settings.preferVariantWithParentheses = extSettings.preferVariantWithParentheses
				needToUpdate = true
				console.info(`preferVariantWithParentheses = ${settings.preferVariantWithParentheses}`)
			}

			if (settings.references !== extSettings.references) {
				settings.references = extSettings.references
				needToUpdate = true
				console.info(`references = ${settings.references}`)
			}

			if (settings.jsxPropImportChecking !== extSettings.jsxPropImportChecking) {
				settings.jsxPropImportChecking = extSettings.jsxPropImportChecking
				needToUpdate = true
				console.info(`jsxPropImportChecking = ${settings.jsxPropImportChecking}`)
			}

			// backward compatibility
			if (typeof extSettings.rootFontSize === "boolean") {
				extSettings.rootFontSize = extSettings.rootFontSize ? 16 : 0
			}
			if (settings.rootFontSize !== extSettings.rootFontSize) {
				settings.rootFontSize = extSettings.rootFontSize
				needToUpdate = true
				console.info(`rootFontSize = ${settings.rootFontSize}`)
			}

			// backward compatibility
			if (typeof extSettings.colorDecorators === "boolean") {
				extSettings.colorDecorators = extSettings.colorDecorators ? "on" : "off"
			}
			if (extSettings.colorDecorators === "inherit") {
				const editor = await connection.workspace.getConfiguration({ section: "editor" })
				extSettings.colorDecorators = editor.colorDecorators ? "on" : "off"
			}
			if (settings.colorDecorators !== extSettings.colorDecorators) {
				settings.colorDecorators = extSettings.colorDecorators
				needToUpdate = true
				needToRenderColors = true
				console.info(`codeDecorators = ${settings.colorDecorators}`)
			}

			// if (settings.fallbackDefaultConfig !== extSettings.fallbackDefaultConfig) {
			// 	settings.fallbackDefaultConfig = extSettings.fallbackDefaultConfig
			// 	needToReload = true
			// 	console.info(`fallbackDefaultConfig = ${settings.fallbackDefaultConfig}`)
			// }

			try {
				deepStrictEqual(settings.diagnostics, extSettings.diagnostics)
			} catch {
				settings.diagnostics = extSettings.diagnostics
				needToUpdate = true
				needToDiagnostics = true
				console.info(`diagnostics = ${JSON.stringify(settings.diagnostics)}`)
			}

			if (needToUpdate) {
				for (const document of documents.all()) {
					const service = matchService(document.uri, services)
					if (service) {
						service.updateSettings(settings)
					}
				}
			}

			if (needToRenderColors) {
				await Promise.all(documents.all().map(document => colorDecorations(document)))
			}

			if (needToDiagnostics) {
				await Promise.all(
					documents.all().map(async document => {
						const service = matchService(document.uri, services)
						if (service) {
							service.updateSettings(settings)
							await diagnostics(document)
						}
					}),
				)
			}
		}
	})

	return

	function addDefaultService(settings: Settings, startNow = false) {
		if (!settings.fallbackDefaultConfig) {
			return
		}
		if (services.size > 0) {
			return
		}
		if (defaultServiceRunning) {
			console.info("Default service is ready.")
			return
		}

		const srv = createTailwindLanguageService(documents, {
			...settings,
			serverSourceMapUri,
			extensionUri,
			workspaceFolder,
			extensionMode,
		})
		services.set(workspaceFolder.toString(), srv)
		if (startNow) srv.start()
		defaultServiceRunning = true
	}

	function addService(configPath: URI, settings: Settings, startNow = false) {
		if (defaultServiceRunning) {
			services.clear()
			defaultServiceRunning = false
		}

		const folder = Utils.dirname(configPath).toString()
		const set = configFolders.get(folder)
		if (!set) {
			configFolders.set(folder, [configPath])
		} else {
			configFolders.set(folder, [...set, configPath])
		}

		const key = Utils.dirname(configPath).toString()
		const srv = services.get(key)

		if (!srv) {
			const srv = createTailwindLanguageService(documents, {
				...settings,
				configPath,
				serverSourceMapUri,
				extensionUri,
				workspaceFolder,
				extensionMode,
			})
			services.set(key, srv)
			if (startNow) srv.start()
		} else {
			const ext = Utils.extname(configPath)
			const srvExt = Utils.extname(srv.configPath)
			if (priority.indexOf(ext) < priority.indexOf(srvExt)) {
				const s = createTailwindLanguageService(documents, {
					...settings,
					configPath,
					serverSourceMapUri,
					extensionUri,
					workspaceFolder,
					extensionMode,
				})
				console.info("remove:", path.relative(workspaceFolder.path, srv.configPath.path))
				services.delete(key)
				services.set(key, s)
				if (startNow) s.start()
			} else {
				console.info("abort:", path.relative(workspaceFolder.path, configPath.path))
			}
		}
	}

	function removeService(configPath: URI, settings: Settings, startNow = false) {
		const folder = Utils.dirname(configPath).toString()
		const srv = services.get(folder)
		if (srv && srv.configPath.toString() === configPath.toString()) {
			console.info("remove:", path.relative(workspaceFolder.path, srv.configPath.path))
			services.delete(folder)
			const set = configFolders.get(folder)
			if (set) {
				const index = set.findIndex(p => p.toString() === configPath.toString())
				if (index >= 0) {
					set.splice(index, 1)
					configFolders.set(folder, set)
				}
				if (set.length > 0) {
					const configPath = set.sort(prioritySorter)[0]
					const srv = createTailwindLanguageService(documents, {
						...settings,
						configPath,
						serverSourceMapUri,
						extensionUri,
						workspaceFolder,
						extensionMode,
					})
					services.set(folder, srv)
					if (startNow) srv.start()
				}
			}
		}

		if (services.size === 0) {
			addDefaultService(settings, true)
		}
	}

	async function reloadService(configPath: URI) {
		const key = Utils.dirname(configPath).toString()
		const srv = services.get(key)
		if (srv && srv.configPath.toString() === configPath.toString()) {
			await srv.reload()
		}
	}

	async function colorDecorations(document: TextDocument) {
		if (!settings.colorDecorators) {
			return
		}
		const service = matchService(document.uri, services)
		if (service) {
			connection.sendNotification("tailwindcss/documentColors", {
				uri: document.uri,
				colors: await service.provideColorDecorations(document),
			})
		}
	}

	async function diagnostics(document: TextDocument) {
		if (!hasDiagnosticRelatedInformationCapability) {
			return
		}
		if (!settings.diagnostics.enabled) {
			return
		}
		const service = matchService(document.uri, services)
		if (service) {
			connection.sendDiagnostics({
				uri: document.uri,
				diagnostics: await service.validate(document),
			})
		}
	}

	function bind() {
		documents.onDidOpen(async params => diagnostics(params.document))

		documents.onDidChangeContent(async params => diagnostics(params.document))

		connection.onCompletion(params => matchService(params.textDocument.uri, services)?.onCompletion(params))

		connection.onCompletionResolve(params => matchService(params.data.uri, services)?.onCompletionResolve(params))

		connection.onHover(params => matchService(params.textDocument.uri, services)?.onHover(params))

		connection.onCodeAction(params => {
			type Data = { text: string; newText: string }
			const diagnostics = params.context.diagnostics.filter(dia => {
				if (dia.source !== DIAGNOSTICS_ID) {
					return false
				}
				if (!dia.data) {
					return false
				}
				const { text, newText } = dia.data as Data
				return !!text && !!newText
			})

			return diagnostics.map<lsp.CodeAction>(dia => {
				const range = dia.range
				const { text, newText } = dia.data as Data
				return {
					title: `Replace '${text}' with '${newText}'`,
					diagnostics: [dia],
					kind: lsp.CodeActionKind.QuickFix,
					edit: {
						changes: {
							[params.textDocument.uri]: [lsp.TextEdit.replace(range, newText)],
						},
					},
				}
			})
		})

		connection.onDocumentColor(params => {
			const document = documents.get(params.textDocument.uri)
			if (!document) {
				return undefined
			}
			colorDecorations(document)
			return matchService(params.textDocument.uri, services)?.onDocumentColor(params)
		})

		connection.onColorPresentation(params =>
			matchService(params.textDocument.uri, services)?.onColorPresentation(params),
		)

		connection.onRequest("tw/colors", async ({ uri }) => {
			return matchService(uri, services)?.getColors()
		})
	}
}

process.setMaxListeners(Infinity)
connectLsp()
