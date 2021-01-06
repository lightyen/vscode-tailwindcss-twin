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
					codeActionProvider: true,
				},
			}
		})

		connection.onInitialized(async e => {
			if (this.hasConfigurationCapability) {
				connection.client.register(lsp.DidChangeConfigurationNotification.type)
			}
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
						await this.reloadService(change.uri)
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
				if (this.settings.colorDecorators !== tailwindcss?.colorDecorators) {
					this.settings.colorDecorators =
						typeof tailwindcss?.colorDecorators === "boolean"
							? tailwindcss.colorDecorators
							: editor.colorDecorators ?? false
					for (const document of documents.all()) {
						const service = matchService(document.uri, this.services)
						if (service) {
							service.updateSettings(this.settings)
							connection.sendNotification("tailwindcss/documentColors", {
								colors: service.provideColor(document),
								uri: document.uri,
							})
						}
					}
					connection.sendNotification("tailwindcss/info", `codeDecorators = ${this.settings.colorDecorators}`)
				}

				if (this.settings.links !== tailwindcss?.links) {
					this.settings.links =
						typeof tailwindcss?.links === "boolean" ? tailwindcss.links : editor.links ?? false
					for (const document of documents.all()) {
						const service = matchService(document.uri, this.services)
						if (service) {
							service.updateSettings(this.settings)
						}
					}
					connection.sendNotification("tailwindcss/info", `documentLinks = ${this.settings.links}`)
				}

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
				const configPath = URI.parse(configUri).fsPath
				const srv = new TailwindLanguageService(this.documents, {
					...settings,
					workspaceFolder: URI.parse(workspaceFolder).fsPath,
					configPath,
				})
				this.services.set(configUri, srv)
				console.log("process:", configPath)
				if (srv.state) {
					console.log(`userConfig = ${srv.state.hasConfig}`)
					console.log(`configPath = ${srv.state.configPath}`)
					console.log(`tailwind path = ${srv.state.tailwindcssPath}`)
					console.log(`tailwindcss version = ${srv.state.tailwindcssVersion}`)
					console.log(`postcss path = ${srv.state.postcssPath}`)
					console.log(`postcss version = ${srv.state.postcssVersion}`)
				}
			} catch {}
		}
	}

	private removeService(configUri: string) {
		const srv = this.services.get(configUri)
		if (srv) {
			this.services.delete(configUri)
			console.log("remove:", URI.parse(configUri).fsPath)
		}
	}

	private async reloadService(configUri: string) {
		const srv = this.services.get(configUri) as TailwindLanguageService
		await srv?.reload()
		console.log("reload:", URI.parse(configUri).fsPath)
		if (srv?.state) {
			console.log(`userConfig = ${srv.state.hasConfig}`)
			console.log(`configPath = ${srv.state.configPath}`)
			console.log(`tailwind path = ${srv.state.tailwindcssPath}`)
			console.log(`tailwindcss version = ${srv.state.tailwindcssVersion}`)
			console.log(`postcss path = ${srv.state.postcssPath}`)
			console.log(`postcss version = ${srv.state.postcssVersion}`)
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
		connection.onCodeAction(params => {
			type Data = { text: string; newText: string }
			const diagnostics = params.context.diagnostics.filter(dia => {
				if (dia.source !== "tailwindcss") {
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
							[params.textDocument.uri.toString()]: [{ newText, range }],
						},
					},
				}
			})
		})
	}
}

new Server()
