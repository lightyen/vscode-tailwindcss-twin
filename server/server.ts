import { deepStrictEqual } from "assert"
import path from "path"
import { DIAGNOSTICS_ID, NAME, SECTION_ID, Settings } from "shared"
import { TextDocument } from "vscode-languageserver-textdocument"
import * as lsp from "vscode-languageserver/node"
import { FileChangeType } from "vscode-languageserver/node"
import { URI } from "vscode-uri"
import { requireModule } from "~/common/module"
import { LanguageService } from "./LanguageService"
import { TailwindLanguageService } from "./twLanguageService"

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
	configs: string[] = []
	defaultConfigUri!: string
	/** uri */
	workspaceFolder!: string
	settings!: Settings

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
			this.defaultConfigUri = URI.parse(path.join(workspaceFolder, "tailwind.config.js")).toString()
			this.settings = settings
			progress.begin(`Initializing ${NAME}`)

			console.log("tailwindcss version:", requireModule("tailwindcss/package.json").version)
			console.log("postcss version:", requireModule("postcss/package.json").version)

			for (const configUri of configs) {
				this.addService(configUri, workspaceFolder, settings)
			}
			if (configs.length === 0) {
				console.log("add default service...")
				this.addService(this.defaultConfigUri, workspaceFolder, settings)
			}

			documents.all().forEach(document => {
				matchService(document.uri, this.services)?.init()
			})

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
			if (this.hasConfigurationCapability) {
				connection.client.register(lsp.DidChangeConfigurationNotification.type)
			}
		})

		// when changed tailwind.config.js
		connection.onDidChangeWatchedFiles(async ({ changes }) => {
			console.log(`[changes were detected]`)
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
			documents.all().forEach(document => matchService(document.uri, this.services)?.validate(document))
		})

		connection.onDidChangeConfiguration(async params => {
			console.log(`[setting changes were detected]`)
			if (this.hasConfigurationCapability) {
				interface EditorConfig {
					colorDecorators: boolean
				}
				const configs = await connection.workspace.getConfiguration([
					{ section: SECTION_ID },
					{ section: "editor" },
				])
				const extSettings: Settings = configs[0]
				const editor: EditorConfig = configs[1]

				let needToUpdate = false
				let needToReload = false
				let needToRenderColors = false
				let needToDiagnostics = false

				if (this.settings.enabled !== extSettings.enabled) {
					this.settings.enabled = extSettings.enabled
					needToUpdate = true
					console.log(`enabled = ${this.settings.enabled}`)
				}

				if (this.settings.preferVariantWithParentheses !== extSettings.preferVariantWithParentheses) {
					this.settings.preferVariantWithParentheses = extSettings.preferVariantWithParentheses
					needToUpdate = true
					console.log(`preferVariantWithParentheses = ${this.settings.preferVariantWithParentheses}`)
				}

				if (this.settings.references !== extSettings.references) {
					this.settings.references = extSettings.references
					needToUpdate = true
					console.log(`references = ${this.settings.references}`)
				}

				if (this.settings.jsxPropImportChecking !== extSettings.jsxPropImportChecking) {
					this.settings.jsxPropImportChecking = extSettings.jsxPropImportChecking
					needToUpdate = true
					console.log(`jsxPropImportChecking = ${this.settings.jsxPropImportChecking}`)
				}

				const colorDecorators = extSettings.colorDecorators ?? editor.colorDecorators
				if (this.settings.colorDecorators !== colorDecorators) {
					this.settings.colorDecorators = colorDecorators
					needToUpdate = true
					needToRenderColors = true
					console.log(`codeDecorators = ${this.settings.colorDecorators}`)
				}

				if (this.settings.fallbackDefaultConfig !== extSettings.fallbackDefaultConfig) {
					this.settings.fallbackDefaultConfig = extSettings.fallbackDefaultConfig
					needToReload = true
					console.log(`fallbackDefaultConfig = ${this.settings.fallbackDefaultConfig}`)
				}

				try {
					deepStrictEqual(this.settings.diagnostics, extSettings.diagnostics)
				} catch {
					this.settings.diagnostics = extSettings.diagnostics
					needToUpdate = true
					needToDiagnostics = true
					console.log(`diagnostics = ${JSON.stringify(this.settings.diagnostics)}`)
				}

				if (needToReload) {
					for (const [, service] of this.services) {
						service.reload(this.settings)
					}
				} else if (needToUpdate) {
					for (const document of documents.all()) {
						const service = matchService(document.uri, this.services)
						if (service) {
							service.updateSettings(this.settings)
						}
					}
				}

				if (needToRenderColors) {
					await Promise.all(documents.all().map(document => this.colorDecorations(document)))
				}

				if (needToDiagnostics) {
					await Promise.all(
						documents.all().map(async document => {
							const service = matchService(document.uri, this.services)
							if (service) {
								service.updateSettings(this.settings)
								await this.diagnostics(document)
							}
						}),
					)
				}
			}
		})
	}

	private addService(configUri: string, workspaceFolder: string, settings: Settings) {
		if (configUri === this.defaultConfigUri) {
			const srv = this.services.get(configUri)
			if (srv) {
				console.log("remove default service...")
				this.services.delete(configUri)
			}
		}
		if (!this.services.has(configUri)) {
			try {
				const configPath = URI.parse(configUri).fsPath
				console.log("loading:", configPath)
				const srv = new TailwindLanguageService(this.documents, {
					...settings,
					workspaceFolder: URI.parse(workspaceFolder).fsPath,
					configPath,
				})
				this.services.set(configUri, srv)
				if (srv.state) {
					console.log(`config = ${srv.state.hasConfig}`)
					console.log(`target = ${srv.state.distConfigPath}\n`)
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
		if (this.services.size === 0) {
			console.log("add default service...")
			try {
				const configPath = URI.parse(this.defaultConfigUri).fsPath
				const srv = new TailwindLanguageService(this.documents, {
					...this.settings,
					workspaceFolder: URI.parse(this.workspaceFolder).fsPath,
					configPath,
				})
				this.services.set(configUri, srv)
				if (srv.state) {
					console.log(`config = ${srv.state.hasConfig}`)
					console.log(`target = ${srv.state.distConfigPath}\n`)
				}
			} catch {}
		}
	}

	private async reloadService(configUri: string) {
		const srv = this.services.get(configUri)
		console.log("reloading:", URI.parse(configUri).fsPath)
		await srv?.reload()
		if (srv) {
			console.log(`config = ${srv.hasConfig}`)
			console.log(`target = ${srv.targetConfig}\n`)
		}
	}

	private async colorDecorations(document: TextDocument) {
		if (!this.settings.colorDecorators) {
			return
		}
		const service = matchService(document.uri, this.services)
		if (service) {
			this.connection.sendNotification("tailwindcss/documentColors", {
				uri: document.uri,
				colors: await service.provideColorDecorations(document),
			})
		}
	}

	private async diagnostics(document: TextDocument) {
		if (!this.hasDiagnosticRelatedInformationCapability) {
			return
		}
		if (!this.settings.diagnostics.enabled) {
			return
		}
		const service = matchService(document.uri, this.services)
		if (service) {
			this.connection.sendDiagnostics({
				uri: document.uri,
				diagnostics: await service.validate(document),
			})
		}
	}

	bind() {
		const { documents, connection } = this

		documents.onDidOpen(async params => {
			const service = matchService(params.document.uri, this.services)
			await service?.init()
			this.diagnostics(params.document)
		})

		documents.onDidChangeContent(async params => {
			this.diagnostics(params.document)
		})

		connection.onCompletion(params => matchService(params.textDocument.uri, this.services)?.onCompletion(params))

		connection.onCompletionResolve(params =>
			matchService(params.data.uri, this.services)?.onCompletionResolve(params),
		)

		connection.onHover(params => matchService(params.textDocument.uri, this.services)?.onHover(params))

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
			this.colorDecorations(document)
			return matchService(params.textDocument.uri, this.services)?.onDocumentColor(params)
		})

		connection.onColorPresentation(params =>
			matchService(params.textDocument.uri, this.services)?.onColorPresentation(params),
		)
	}
}

new Server()
