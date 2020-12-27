import * as lsp from "vscode-languageserver/node"
import { TextDocument } from "vscode-languageserver-textdocument"
import { URI } from "vscode-uri"
import { InitOptions, TailwindLanguageService } from "./twLanguageService"
import { LanguageService } from "./LanguageService"

class Server {
	connection: lsp.Connection
	documents: lsp.TextDocuments<TextDocument>
	hasConfigurationCapability = false
	hasDiagnosticRelatedInformationCapability = false
	initOptions: InitOptions

	constructor() {
		const connection = lsp.createConnection(lsp.ProposedFeatures.all)
		this.connection = connection
		connection.listen()
		const documents = new lsp.TextDocuments(TextDocument)
		this.documents = documents
		documents.listen(this.connection)
		let srv: TailwindLanguageService
		connection.onInitialize(async (params, _cancel, progress) => {
			// interface InitializationOptions extends ConfigPath {}
			const { capabilities } = params
			// Does the client support the `workspace/configuration` request?
			// If not, we fall back using global settings.
			this.hasConfigurationCapability = capabilities.workspace?.configuration ?? false
			this.hasDiagnosticRelatedInformationCapability =
				capabilities.textDocument?.publishDiagnostics?.relatedInformation ?? false
			this.initOptions = params.initializationOptions
			// TODO: multiple instance?
			srv = new TailwindLanguageService(this.documents, this.initOptions)
			progress.begin("Initializing Tailwind CSS features")
			this.bindService(srv)
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
						triggerCharacters: ['"', "'", "`", " ", ".", ":", "(", "[", "_"],
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

			connection.workspace.onDidChangeWorkspaceFolders(_event => {
				console.log("Workspace folder change event received.")
			})
			connection.sendNotification("tailwindcss/info", `userConfig = ${srv.state.hasConfig}`)
			connection.sendNotification("tailwindcss/info", `configPath = ${srv.state.configPath}`)
			connection.sendNotification("tailwindcss/info", `tailwind path = ${srv.state.tailwindcssPath}`)
			connection.sendNotification("tailwindcss/info", `tailwindcss version = ${srv.state.tailwindcssVersion}`)
			connection.sendNotification("tailwindcss/info", `postcss path = ${srv.state.postcssPath}`)
			connection.sendNotification("tailwindcss/info", `postcss version = ${srv.state.postcssVersion}`)
			connection.sendNotification("tailwindcss/info", `user separator = ${srv.state.separator}`)
			connection.sendNotification("tailwindcss/info", `inner separator = ${srv.state.config.separator}`)
			connection.sendNotification("tailwindcss/info", `codeDecorators = ${this.initOptions.colorDecorators}`)
			connection.sendNotification("tailwindcss/info", `documentLinks = ${this.initOptions.links}`)
			connection.sendNotification("tailwindcss/info", `twin = ${this.initOptions.twin}`)
			connection.sendNotification("tailwindcss/info", `validate = ${this.initOptions.validate}`)
			connection.sendNotification(
				"tailwindcss/info",
				`diagnostics.conflict = ${this.initOptions.diagnostics.conflict}`,
			)
		})

		connection.onDidChangeWatchedFiles(async ({ changes }) => {
			connection.sendNotification("tailwindcss/info", `onDidChangeWatchedFiles`)
			const result = await connection.sendRequest<string[]>("tailwindcss/findConfig")
			if (result.length === 1) {
				this.initOptions.configPath = result[0]
				await srv.reload(this.initOptions)
			} else {
				for (const f of changes) {
					const p = URI.parse(f.uri).fsPath
					this.initOptions.configPath = p
					await srv.reload(this.initOptions)
					break
				}
			}
			documents.all().forEach(doc => srv.validate(doc))
			connection.sendNotification("tailwindcss/info", `hasConfig = ${srv.state.hasConfig}`)
			connection.sendNotification("tailwindcss/info", `configPath = ${srv.state.configPath}`)
			connection.sendNotification("tailwindcss/info", `tailwind path = ${srv.state.tailwindcssPath}`)
			connection.sendNotification("tailwindcss/info", `tailwindcss version = ${srv.state.tailwindcssVersion}`)
			connection.sendNotification("tailwindcss/info", `postcss version = ${srv.state.postcssVersion}`)
			connection.sendNotification("tailwindcss/info", `postcss path = ${srv.state.postcssPath}`)
			connection.sendNotification("tailwindcss/info", `user separator = ${srv.state.separator}`)
			connection.sendNotification("tailwindcss/info", `inner separator = ${srv.state.config.separator}`)
		})

		connection.onDidChangeConfiguration(async params => {
			if (this.hasConfigurationCapability) {
				const [tailwindcss, editor] = await connection.workspace.getConfiguration([
					{ section: "tailwindcss" },
					{ section: "editor" },
				])
				if (
					this.initOptions.twin !== tailwindcss.twin ||
					this.initOptions.fallbackDefaultConfig !== tailwindcss.fallbackDefaultConfig
				) {
					this.initOptions.twin = tailwindcss.twin
					this.initOptions.fallbackDefaultConfig = tailwindcss.fallbackDefaultConfig
					await srv.reload(this.initOptions)
				}
				connection.sendNotification("tailwindcss/info", `twin = ${this.initOptions.twin}`)

				this.initOptions.colorDecorators =
					typeof tailwindcss?.colorDecorators === "boolean"
						? tailwindcss.colorDecorators
						: editor.colorDecorators ?? false
				connection.sendNotification("tailwindcss/info", `codeDecorators = ${this.initOptions.colorDecorators}`)

				this.initOptions.links =
					typeof tailwindcss?.links === "boolean" ? tailwindcss.links : editor.links ?? false
				connection.sendNotification("tailwindcss/info", `documentLinks = ${this.initOptions.links}`)

				if (
					this.initOptions.validate !== tailwindcss.validate ||
					this.initOptions.diagnostics.conflict !== tailwindcss.diagnostics.conflict
				) {
					this.initOptions.validate = tailwindcss.validate
					this.initOptions.diagnostics.conflict = tailwindcss.diagnostics.conflict
					documents.all().forEach(doc => srv.validate(doc))
				}
				connection.sendNotification("tailwindcss/info", `validate = ${this.initOptions.validate}`)
				connection.sendNotification(
					"tailwindcss/info",
					`diagnostics.conflict = ${this.initOptions.diagnostics.conflict}`,
				)
			}
		})
	}

	bindService(service: LanguageService) {
		service.init()
		const { documents, connection } = this
		documents.onDidOpen(params => {
			if (!this.hasDiagnosticRelatedInformationCapability) {
				return
			}
			service.validate(params.document)
		})
		documents.onDidChangeContent(params => {
			if (!this.hasDiagnosticRelatedInformationCapability) {
				return
			}
			service.validate(params.document)
		})
		connection.onCompletion((...params) => service.onCompletion(...params))
		connection.onCompletionResolve((...params) => service.onCompletionResolve(...params))
		connection.onHover((...params) => service.onHover(...params))
		connection.onDocumentLinks((...params) => service.onDocumentLinks(...params))
		connection.onDocumentColor(params => {
			if (!this.initOptions.colorDecorators) {
				return []
			}
			const document = documents.get(params.textDocument.uri)
			const colors = service.provideColor(document)
			if (colors?.length > 0) {
				connection.sendNotification("tailwindcss/documentColors", {
					colors,
					uri: document.uri,
				})
			}
			return []
		})
	}
}

new Server()
