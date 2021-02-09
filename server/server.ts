import * as lsp from "vscode-languageserver/node"
import { TextDocument } from "vscode-languageserver-textdocument"
import { URI } from "vscode-uri"
import { TailwindLanguageService } from "./twLanguageService"
import { LanguageService } from "./LanguageService"
import { FileChangeType } from "vscode-languageserver/node"
import path from "path"
import { deepStrictEqual } from "assert"
import { Settings } from "./LanguageService"
import { TModule } from "~/common/module"

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
	defaultConfigUri: string
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
			this.defaultConfigUri = URI.parse(path.join(workspaceFolder, "tailwind.config.js")).toString()
			this.settings = settings
			progress.begin("Initializing Tailwind CSS features")

			console.log("tailwindcss version:", TModule.require({ moduleId: "tailwindcss/package.json" }).version)
			console.log("postcss version:", TModule.require({ moduleId: "postcss/package.json" }).version)

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
					documentLinkProvider: {
						resolveProvider: false,
					},
					codeActionProvider: true,
					semanticTokensProvider: {
						documentSelector: [
							{ language: "typescriptreact", scheme: "file" },
							{ language: "javascriptreact", scheme: "file" },
							{ language: "typescript", scheme: "file" },
							{ language: "javascript", scheme: "file" },
						],
						legend: {
							tokenModifiers: ["documentation"],
							tokenTypes: ["keyword", "number", "interface", "variable", "function", "enumMember"],
						},
						range: true,
					},
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
			console.log(`[some changes were detected]`)
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
			console.log(`[setting changes were detected]`)
			if (this.hasConfigurationCapability) {
				type Config = {
					colorDecorators?: boolean
					links?: boolean
					validate: boolean
					preferVariantWithParentheses: boolean
					fallbackDefaultConfig: boolean
					diagnostics: {
						conflict: "none" | "loose" | "strict"
						emptyClass: boolean
						emptyGroup: boolean
					}
				}
				type EditorConfig = {
					colorDecorators: boolean
					links: boolean
				}
				const configs = await connection.workspace.getConfiguration([
					{ section: "tailwindcss" },
					{ section: "editor" },
				])
				const tailwindcss: Config = configs[0]
				const editor: EditorConfig = configs[1]

				const preferVariantWithParentheses = tailwindcss?.preferVariantWithParentheses || false
				if (this.settings.preferVariantWithParentheses !== preferVariantWithParentheses) {
					this.settings.preferVariantWithParentheses = preferVariantWithParentheses
					for (const document of documents.all()) {
						const service = matchService(document.uri, this.services)
						if (service) {
							service.updateSettings(this.settings)
						}
					}
					console.log(`preferVariantWithParentheses = ${this.settings.preferVariantWithParentheses}`)
				}

				if (this.settings.fallbackDefaultConfig !== tailwindcss.fallbackDefaultConfig) {
					this.settings.fallbackDefaultConfig = tailwindcss.fallbackDefaultConfig
					for (const [, service] of this.services) {
						;(service as TailwindLanguageService).reload(this.settings)
					}
				}

				const colorDecorators = tailwindcss?.colorDecorators ?? editor.colorDecorators
				if (this.settings.colorDecorators !== colorDecorators) {
					this.settings.colorDecorators = colorDecorators
					for (const document of documents.all()) {
						const service = matchService(document.uri, this.services)
						if (service) {
							service.updateSettings(this.settings)
							connection.sendNotification("tailwindcss/documentColors", {
								colors: await service.provideColor(document),
								uri: document.uri,
							})
						}
					}
					console.log(`codeDecorators = ${this.settings.colorDecorators}`)
				}

				const links = tailwindcss?.links ?? editor.links
				if (this.settings.links !== links) {
					this.settings.links = links
					for (const document of documents.all()) {
						const service = matchService(document.uri, this.services)
						if (service) {
							service.updateSettings(this.settings)
						}
					}
					console.log(`documentLinks = ${this.settings.links}`)
				}

				try {
					deepStrictEqual(this.settings.validate, tailwindcss?.validate)
					deepStrictEqual(this.settings.diagnostics, tailwindcss?.diagnostics)
				} catch {
					this.settings.validate = tailwindcss?.validate
					this.settings.diagnostics = tailwindcss?.diagnostics
					documents.all().forEach(async document => {
						const service = matchService(document.uri, this.services)
						if (service) {
							service.updateSettings(this.settings)
							const diagnostics = await service.validate(document)
							this.connection.sendDiagnostics({ uri: document.uri, diagnostics })
						}
					})
					console.log(`validate = ${this.settings.validate}`)
					console.log(`diagnostics = ${JSON.stringify(this.settings.diagnostics)}`)
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
				console.log("add:", configPath)
				const srv = new TailwindLanguageService(this.documents, {
					...settings,
					workspaceFolder: URI.parse(workspaceFolder).fsPath,
					configPath,
				})
				this.services.set(configUri, srv)
				if (srv.state) {
					console.log(`userConfig = ${srv.state.hasConfig}`)
					console.log(`distConfig = ${srv.state.distConfigPath}`)
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
					console.log(`userConfig = ${srv.state.hasConfig}`)
					console.log(`distConfig = ${srv.state.distConfigPath}`)
				}
			} catch {}
		}
	}

	private async reloadService(configUri: string) {
		const srv = this.services.get(configUri) as TailwindLanguageService
		console.log("reload:", URI.parse(configUri).fsPath)
		await srv?.reload()
		if (srv?.state) {
			console.log(`userConfig = ${srv.state.hasConfig}`)
			console.log(`distConfig = ${srv.state.distConfigPath}`)
		}
	}

	bind() {
		const { documents, connection } = this
		documents.onDidOpen(async params => {
			const service = matchService(params.document.uri, this.services)
			await service?.init()
			if (!this.hasDiagnosticRelatedInformationCapability) {
				return
			}
			if (service) {
				const diagnostics = await service.validate(params.document)
				this.connection.sendDiagnostics({ uri: params.document.uri, diagnostics })
			}
		})

		documents.onDidChangeContent(async params => {
			if (!this.hasDiagnosticRelatedInformationCapability) {
				return
			}
			if (!this.settings.validate) {
				return
			}
			const service = matchService(params.document.uri, this.services)
			if (service) {
				const diagnostics = await service.validate(params.document)
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
		connection.onDocumentLinks(async params => {
			if (!this.settings.links) {
				return []
			}
			const service = matchService(params.textDocument.uri, this.services)
			if (service) {
				const document = documents.get(params.textDocument.uri)
				return await service.onDocumentLinks(document)
			}
			return []
		})
		connection.onDocumentColor(async params => {
			if (!this.settings.colorDecorators) {
				return []
			}
			const document = documents.get(params.textDocument.uri)
			const service = matchService(params.textDocument.uri, this.services)
			if (service) {
				connection.sendNotification("tailwindcss/documentColors", {
					colors: await service.provideColor(document),
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
		connection.languages.semanticTokens.onRange(async (...params) => {
			return await matchService(params[0].textDocument.uri, this.services)?.provideSemanticTokens(...params)
		})
	}
}

new Server()
