import {
	ProposedFeatures,
	DidChangeConfigurationNotification,
	TextDocuments,
	TextDocumentSyncKind,
} from "vscode-languageserver"
import { createConnection } from "vscode-languageserver/node"
import { TextDocument } from "vscode-languageserver-textdocument"
import { URI } from "vscode-uri"

import { state, init } from "./tailwind"

// features
import { completion, completionResolve } from "./completion"
import { documentLinks } from "./documentLinks"
import hover from "./hover"
import colorDecoration from "./colorDecoration"
import { didOpenTextDocument, didChangeChangeTextDocument } from "./document"
import { validateTextDocument } from "./diagnostics"

interface InitializationOptions {
	workspaceFoloder: string
	tailwindConfigPath: string
	colorDecorators: boolean
	links: boolean
	twin: boolean
	validate: boolean
	fallbackDefaultConfig: boolean
	diagnostics: {
		conflict: "none" | "loose" | "strict"
	}
}

export let settings: Partial<InitializationOptions> = {}

export const connection = createConnection(ProposedFeatures.all)
export let documents: TextDocuments<TextDocument>

let hasConfigurationCapability = false
let hasDiagnosticRelatedInformationCapability = false

connection.onInitialize(async (params, _cancel, progress) => {
	// interface InitializationOptions extends ConfigPath {}
	const { capabilities } = params
	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = capabilities.workspace?.configuration ?? false
	hasDiagnosticRelatedInformationCapability =
		capabilities.textDocument?.publishDiagnostics?.relatedInformation ?? false
	settings = params.initializationOptions
	progress.begin("Initializing Tailwind CSS features")
	await init(connection, params.initializationOptions)
	progress.done()
	setupDocumentsListeners()
	return {
		capabilities: {
			workspace: {
				workspaceFolders: {
					supported: true,
				},
			},
			textDocumentSync: {
				openClose: true,
				change: TextDocumentSyncKind.Incremental,
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
	if (hasConfigurationCapability) {
		connection.client.register(DidChangeConfigurationNotification.type)
	}

	connection.workspace.onDidChangeWorkspaceFolders(_event => {
		console.log("Workspace folder change event received.")
	})
	if (state) {
		connection.sendNotification("tailwindcss/info", `userConfig = ${state.userConfig}`)
		connection.sendNotification("tailwindcss/info", `configPath = ${state.configPath}`)
		connection.sendNotification("tailwindcss/info", `tailwindRoot = ${state.tailwindRoot}`)
		connection.sendNotification("tailwindcss/info", `tailwindcss version = ${state.versions.tailwindcss}`)
		connection.sendNotification("tailwindcss/info", `postcssRoot = ${state.postcssRoot}`)
		connection.sendNotification("tailwindcss/info", `postcss version = ${state.versions.postcss}`)
		connection.sendNotification("tailwindcss/info", `user separator = ${state.separator}`)
		connection.sendNotification("tailwindcss/info", `inner separator = ${state.config.separator}`)
		connection.sendNotification("tailwindcss/info", `codeDecorators = ${settings.colorDecorators}`)
		connection.sendNotification("tailwindcss/info", `documentLinks = ${settings.links}`)
		connection.sendNotification("tailwindcss/info", `twin = ${settings.twin}`)
		connection.sendNotification("tailwindcss/info", `validate = ${settings.validate}`)
		// connection.sendNotification("tailwindcss/info", `theme = ${state.config.theme.colors.red["100"]}`)
	}
})

connection.onDidChangeWatchedFiles(async ({ changes }) => {
	connection.sendNotification("tailwindcss/info", `onDidChangeWatchedFiles`)
	const result = await connection.sendRequest<string[]>("tailwindcss/findConfig")
	if (result.length === 1) {
		settings.tailwindConfigPath = result[0]
		await init(connection, settings)
	} else {
		for (const f of changes) {
			const p = URI.parse(f.uri).fsPath
			settings.tailwindConfigPath = p
			await init(connection, settings)
			break
		}
	}
	documents.all().forEach(validateTextDocument)
	if (state) {
		connection.sendNotification("tailwindcss/info", `userConfig = ${state.userConfig}`)
		connection.sendNotification("tailwindcss/info", `configPath = ${state.configPath}`)
		connection.sendNotification("tailwindcss/info", `tailwindRoot = ${state.tailwindRoot}`)
		connection.sendNotification("tailwindcss/info", `tailwindcss version = ${state.versions.tailwindcss}`)
		connection.sendNotification("tailwindcss/info", `postcss version = ${state.versions.postcss}`)
		connection.sendNotification("tailwindcss/info", `postcssRoot = ${state.postcssRoot}`)
		connection.sendNotification("tailwindcss/info", `user separator = ${state.separator}`)
		connection.sendNotification("tailwindcss/info", `inner separator = ${state.config.separator}`)
	}
})

connection.onDidChangeConfiguration(async params => {
	if (hasConfigurationCapability) {
		const [tailwindcss, editor] = await connection.workspace.getConfiguration([
			{ section: "tailwindcss" },
			{ section: "editor" },
		])
		if (
			settings.twin !== tailwindcss.twin ||
			settings.fallbackDefaultConfig !== tailwindcss.fallbackDefaultConfig
		) {
			settings.twin = tailwindcss.twin
			settings.fallbackDefaultConfig = tailwindcss.fallbackDefaultConfig
			await init(connection, settings)
		}
		connection.sendNotification("tailwindcss/info", `twin = ${settings.twin}`)

		settings.colorDecorators =
			typeof tailwindcss?.colorDecorators === "boolean"
				? tailwindcss.colorDecorators
				: editor.colorDecorators ?? false
		connection.sendNotification("tailwindcss/info", `codeDecorators = ${settings.colorDecorators}`)

		settings.links = typeof tailwindcss?.links === "boolean" ? tailwindcss.links : editor.links ?? false
		connection.sendNotification("tailwindcss/info", `documentLinks = ${settings.links}`)

		if (
			settings.validate !== tailwindcss.validate ||
			settings.diagnostics.conflict !== tailwindcss.diagnostics.conflict
		) {
			settings.validate = tailwindcss.validate
			settings.diagnostics.conflict = tailwindcss.diagnostics.conflict
			documents.all().forEach(validateTextDocument)
		}
		connection.sendNotification("tailwindcss/info", `diagnostics = ${settings.validate}`)
	}
})

function setupDocumentsListeners() {
	documents = new TextDocuments(TextDocument)
	documents.listen(connection)
	documents.onDidOpen((...params) => {
		if (!hasDiagnosticRelatedInformationCapability) {
			return
		}
		return didOpenTextDocument(...params)
	})
	documents.onDidChangeContent((...params) => {
		if (!hasDiagnosticRelatedInformationCapability) {
			return
		}
		return didChangeChangeTextDocument(...params)
	})
}

connection.onCompletion(completion)
connection.onCompletionResolve(completionResolve)
connection.onHover(hover)
connection.onDocumentColor(colorDecoration)
connection.onDocumentLinks(documentLinks)
connection.listen()
