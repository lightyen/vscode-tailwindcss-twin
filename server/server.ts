import * as lsp from "vscode-languageserver/node"
import { TextDocument } from "vscode-languageserver-textdocument"
import { URI } from "vscode-uri"
import { TailwindLanguageService } from "./twLanguageService"
import { LanguageService } from "./LanguageService"
import { FileChangeType } from "vscode-languageserver/node"
import path from "path"
import { Settings } from "./LanguageService"

interface InitializationOptions extends Settings {
	/** uri */
	workspaceFolder: string
	/** uri */
	configs: string[]
}

function matchService(uri: string, services: Map<string, LanguageService>) {
	const arr = Array.from(services)
		.filter(([cfg]) => {
			const rel = path.relative(path.dirname(cfg), uri)
			return !rel.startsWith("..")
		})
		.sort((a, b) => b[0].localeCompare(a[0]))
	return arr[0]?.[1]
}

class Server {
	services: Map<string, LanguageService>
	connection: lsp.Connection
	documents: lsp.TextDocuments<TextDocument>
	hasConfigurationCapability = false
	hasDiagnosticRelatedInformationCapability = false
	/** uri */
	configs: string[]
	/** uri */
	workspaceFolder: string
	settings: Settings

	constructor() {
		this.services = new Map()
		const connection = lsp.createConnection(lsp.ProposedFeatures.all)
		this.connection = connection
		connection.listen()
		const documents = new lsp.TextDocuments(TextDocument)
		this.documents = documents
		documents.listen(this.connection)

		connection.onInitialize(async (params, _cancel, progress) => {
			const { capabilities } = params
			this.hasConfigurationCapability = capabilities.workspace?.configuration ?? false
			this.hasDiagnosticRelatedInformationCapability =
				capabilities.textDocument?.publishDiagnostics?.relatedInformation ?? false

			const { configs, workspaceFolder, ...settings } = params.initializationOptions as InitializationOptions
			this.configs = configs
			this.workspaceFolder = workspaceFolder
			this.settings = settings
			progress.begin("Initializing Tailwind CSS features")
			for (const configUri of configs) {
				this.addService(configUri, workspaceFolder, settings)
			}
			if (configs.length === 0) {
				this.addService(path.join(workspaceFolder, "tailwind.config.js"), workspaceFolder, settings)
			}
			documents.all().forEach(document => {
				matchService(document.uri, this.services)?.init()
			})
			// console.log(Array.from(this.services).map(v => v[0]))
			this.bind()
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
						change: lsp.TextDocumentSyncKind.Full, // trigger validate
						willSaveWaitUntil: false,
						save: {
							includeText: false,
						},
					},
					colorProvider: true,
					completionProvider: {
						resolveProvider: true,
						triggerCharacters: ['"', "'", "`", " ", ".", ":", "("],
					},
					hoverProvider: true,
					documentLinkProvider: {
						resolveProvider: false,
					},
				},
			}
		})

		connection.onInitialized(async e => {
			if (this.hasConfigurationCapability) {
				connection.client.register(lsp.DidChangeConfigurationNotification.type)
			}

			// for (const [cfg, service] of this.services) {
			// 	const srv = service as TailwindLanguageService
			// 	connection.sendNotification("tailwindcss/info", `=>${cfg.toString()}`)
			// 	connection.sendNotification("tailwindcss/info", `userConfig = ${srv.state.hasConfig}`)
			// 	connection.sendNotification("tailwindcss/info", `configPath = ${srv.state.configPath}`)
			// 	connection.sendNotification("tailwindcss/info", `tailwind path = ${srv.state.tailwindcssPath}`)
			// 	connection.sendNotification("tailwindcss/info", `tailwindcss version = ${srv.state.tailwindcssVersion}`)
			// 	connection.sendNotification("tailwindcss/info", `postcss path = ${srv.state.postcssPath}`)
			// 	connection.sendNotification("tailwindcss/info", `postcss version = ${srv.state.postcssVersion}`)
			// 	connection.sendNotification("tailwindcss/info", `user separator = ${srv.state.separator}`)
			// 	connection.sendNotification("tailwindcss/info", `inner separator = ${srv.state.config.separator}`)
			// 	connection.sendNotification("tailwindcss/info", `codeDecorators = ${this.settings.colorDecorators}`)
			// 	connection.sendNotification("tailwindcss/info", `documentLinks = ${this.settings.links}`)
			// 	connection.sendNotification("tailwindcss/info", `twin = ${this.settings.twin}`)
			// 	connection.sendNotification("tailwindcss/info", `validate = ${this.settings.validate}`)
			// 	connection.sendNotification(
			// 		"tailwindcss/info",
			// 		`diagnostics.conflict = ${this.settings.diagnostics.conflict}`,
			// 	)
			// }
		})

		// when changed tailwind.config.js
		connection.onDidChangeWatchedFiles(async ({ changes }) => {
			connection.sendNotification("tailwindcss/info", `some changes were detected`)
			for (const change of changes) {
				switch (change.type) {
					case FileChangeType.Created:
						this.addService(change.uri, this.workspaceFolder, this.settings)
						break
					case FileChangeType.Deleted:
						this.removeService(change.uri)
						break
					case FileChangeType.Changed:
						{
							const srv = this.services.get(change.uri) as TailwindLanguageService
							await srv?.reload()
						}
						break
				}
			}
			this.configs = Array.from(this.services).map(([cfg]) => cfg)

			documents.all().forEach(document => {
				matchService(document.uri, this.services)?.validate(document)
			})
		})

		connection.onDidChangeConfiguration(async params => {
			if (this.hasConfigurationCapability) {
				const [tailwindcss, editor] = await connection.workspace.getConfiguration([
					{ section: "tailwindcss" },
					{ section: "editor" },
				])
				if (this.settings.fallbackDefaultConfig !== tailwindcss.fallbackDefaultConfig) {
					this.settings.fallbackDefaultConfig = tailwindcss.fallbackDefaultConfig
					for (const [, service] of this.services) {
						;(service as TailwindLanguageService).reload(this.settings)
					}
				}
				this.settings.colorDecorators =
					typeof tailwindcss?.colorDecorators === "boolean"
						? tailwindcss.colorDecorators
						: editor.colorDecorators ?? false
				connection.sendNotification("tailwindcss/info", `codeDecorators = ${this.settings.colorDecorators}`)

				this.settings.links =
					typeof tailwindcss?.links === "boolean" ? tailwindcss.links : editor.links ?? false
				connection.sendNotification("tailwindcss/info", `documentLinks = ${this.settings.links}`)

				if (
					this.settings.validate !== tailwindcss.validate ||
					this.settings.diagnostics.conflict !== tailwindcss.diagnostics.conflict
				) {
					this.settings.validate = tailwindcss.validate
					this.settings.diagnostics.conflict = tailwindcss.diagnostics.conflict
					documents.all().forEach(document => {
						const service = matchService(document.uri, this.services)
						if (service) {
							service.updateSettings(this.settings)
							const diagnostics = service.validate(document)
							this.connection.sendDiagnostics({ uri: document.uri, diagnostics })
						}
					})
				}
				connection.sendNotification("tailwindcss/info", `validate = ${this.settings.validate}`)
				connection.sendNotification(
					"tailwindcss/info",
					`diagnostics.conflict = ${this.settings.diagnostics.conflict}`,
				)
			}
		})
	}

	private addService(configUri: string, workspaceFolder: string, settings: Settings) {
		if (!this.services.has(configUri)) {
			try {
				const srv = new TailwindLanguageService(this.documents, {
					...settings,
					workspaceFolder: URI.parse(workspaceFolder).fsPath,
					configPath: URI.parse(configUri).fsPath,
				})
				this.services.set(configUri, srv)
			} catch {}
		}
	}

	private removeService(configUri: string) {
		const srv = this.services.get(configUri)
		if (srv) {
			this.services.delete(configUri)
		}
	}

	bind() {
		const { documents, connection } = this
		documents.onDidOpen(params => {
			const service = matchService(params.document.uri, this.services)
			service?.init()
			if (!this.hasDiagnosticRelatedInformationCapability) {
				return
			}
			if (service) {
				const diagnostics = service.validate(params.document)
				this.connection.sendDiagnostics({ uri: params.document.uri, diagnostics })
			}
		})

		documents.onDidChangeContent(params => {
			if (!this.hasDiagnosticRelatedInformationCapability) {
				return
			}
			if (!this.settings.validate) {
				return
			}
			const service = matchService(params.document.uri, this.services)
			if (service) {
				const diagnostics = service.validate(params.document)
				this.connection.sendDiagnostics({ uri: params.document.uri, diagnostics })
			}
		})

		connection.onCompletion((...params) => {
			return matchService(params[0].textDocument.uri, this.services)?.onCompletion(...params)
		})
		connection.onCompletionResolve((...params) => {
			const uri = params[0].data.uri
			return matchService(uri, this.services)?.onCompletionResolve(...params)
		})
		connection.onHover((...params) => {
			return matchService(params[0].textDocument.uri, this.services)?.onHover(...params)
		})
		connection.onDocumentLinks((...params) => {
			if (!this.settings.links) {
				return []
			}
			return matchService(params[0].textDocument.uri, this.services)?.onDocumentLinks(...params) ?? []
		})
		connection.onDocumentColor(params => {
			if (!this.settings.colorDecorators) {
				return []
			}
			const document = documents.get(params.textDocument.uri)
			const service = matchService(params.textDocument.uri, this.services)
			if (service) {
				connection.sendNotification("tailwindcss/documentColors", {
					colors: service.provideColor(document),
					uri: document.uri,
				})
			}
			return []
		})
	}
}

new Server()
