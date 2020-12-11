import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from "vscode-languageclient"
import {
	workspace,
	window,
	ExtensionContext,
	WorkspaceFolder,
	Uri,
	TextDocument,
	OutputChannel,
	RelativePattern,
} from "vscode"
import path from "path"

import colorDecoration from "./colorDecoration"
import debug from "./debug"

const CLIENT_ID = "Tailwind CSS IntelliSense"

const DEFAULT_SUPPORT_LANGUAGES = ["javascript", "javascriptreact", "typescript", "typescriptreact", "html"]

const clients: Map<string, LanguageClient> = new Map()
const languages: Map<string, string[]> = new Map()

let _sortedWorkspaceFolders: string[]
function sortedWorkspaceFolders(): string[] {
	if (_sortedWorkspaceFolders == undefined) {
		_sortedWorkspaceFolders = workspace.workspaceFolders
			? workspace.workspaceFolders
					.map(folder => {
						let result = folder.uri.toString()
						if (result.charAt(result.length - 1) !== "/") {
							result = result + "/"
						}
						return result
					})
					.sort((a, b) => a.length - b.length)
			: []
	}
	return _sortedWorkspaceFolders
}
workspace.onDidChangeWorkspaceFolders(() => (_sortedWorkspaceFolders = undefined))

function getOuterMostWorkspaceFolder(folder: WorkspaceFolder): WorkspaceFolder {
	const sorted = sortedWorkspaceFolders()
	for (const element of sorted) {
		let uri = folder.uri.toString()
		if (uri.charAt(uri.length - 1) !== "/") {
			uri = uri + "/"
		}
		if (uri.startsWith(element)) {
			return workspace.getWorkspaceFolder(Uri.parse(element))
		}
	}
	return folder
}

interface InitializationOptions {
	base?: string
	filename?: string
	colorDecorators: boolean
	links: boolean
	twin: boolean
	validate: boolean
}

async function addClient(serverModule: string, outputChannel: OutputChannel, ws: WorkspaceFolder) {
	if (clients.has(ws.uri.toString())) {
		return
	}

	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: { execArgv: ["--nolazy", `--inspect=${6011 + clients.size}`] },
		},
	}
	const initializationOptions: InitializationOptions = {
		colorDecorators: false,
		links: false,
		twin: false,
		validate: false,
	}
	let base = ws.uri.fsPath
	const results = await workspace.findFiles(
		new RelativePattern(ws, "{tailwind.js,tailwind.config.js}"),
		new RelativePattern(ws, "node_modules/**"),
		1,
	)
	if (results.length === 1) {
		base = path.dirname(results[0].fsPath)
		initializationOptions.filename = path.basename(results[0].fsPath)
	}
	initializationOptions.base = base
	const tailwindcss = workspace.getConfiguration("tailwindcss", ws)
	initializationOptions.colorDecorators = tailwindcss.get("colorDecorators")
	if (typeof initializationOptions.colorDecorators !== "boolean") {
		initializationOptions.colorDecorators = workspace.getConfiguration("editor", ws).get("colorDecorators")
	}
	initializationOptions.links = tailwindcss.get("links")
	if (typeof initializationOptions.links !== "boolean") {
		initializationOptions.links = workspace.getConfiguration("editor", ws).get("links")
	}
	initializationOptions.twin = tailwindcss.get("twin")
	initializationOptions.validate = tailwindcss.get("validate")

	const clientOptions: LanguageClientOptions = {
		documentSelector: languages.get(ws.uri.toString()).map(language => ({
			scheme: "file",
			language,
			pattern: `${base}/**/*`,
		})),
		synchronize: {
			fileEvents: workspace.createFileSystemWatcher(
				new RelativePattern(ws, "{tailwind.js,tailwind.config.js,package.json}"),
			),
		},
		diagnosticCollectionName: CLIENT_ID,
		workspaceFolder: ws,
		outputChannel: outputChannel,
		middleware: {},
		initializationOptions,
	}

	const client = new LanguageClient(CLIENT_ID, CLIENT_ID, serverOptions, clientOptions)
	clients.set(ws.uri.toString(), client)
	client.onReady().then(() => {
		colorDecoration({ client })
		debug({ client })
	})
	client.start()
}

let outputChannel: OutputChannel
let serverModule: string

export async function activate(context: ExtensionContext) {
	outputChannel = window.createOutputChannel(CLIENT_ID)
	serverModule = context.asAbsolutePath(path.join("out", "server", "server.js"))
	workspace.onDidChangeConfiguration(e => {
		for (const [w] of clients) {
			const s = workspace.getWorkspaceFolder(Uri.parse(w))
			if (e.affectsConfiguration("tailwindcss", s)) {
				// const cfg = workspace.getConfiguration("tailwindcss")
				// const v = cfg.get("logLevel")
				// const userLanguages = getUserLanguages(folder)
				// if (userLanguages) {
				// 	const userLanguageIds = Object.keys(userLanguages)
				// 	const newLanguages = dedupe([...DEFAULT_LANGUAGES, ...userLanguageIds])
				// 	if (!equal(newLanguages, languages.get(folder.uri.toString()))) {
				// 		languages.set(folder.uri.toString(), newLanguages)
				// 		if (client) {
				// 			clients.delete(folder.uri.toString())
				// 			client.stop()
				// 			bootWorkspaceClient(folder)
				// 		}
				// 	}
				// }
			}
		}
	})

	workspace.onDidChangeWorkspaceFolders(async e => {
		const promises: Array<Promise<void>> = []
		for (const ws of e.removed) {
			const c = clients.get(ws.uri.toString())
			if (c) {
				clients.delete(ws.uri.toString())
				promises.push(c.stop())
			}
		}
		for (const ws of e.added) {
			promises.push(addClient(serverModule, outputChannel, ws))
		}
		return Promise.all(promises)
	})

	async function didOpenTextDocument(document: TextDocument) {
		if (document.uri.scheme !== "file") {
			return
		}
		if (!DEFAULT_SUPPORT_LANGUAGES.includes(document.languageId)) {
			return
		}

		let ws = workspace.getWorkspaceFolder(document.uri)
		if (!ws) {
			return
		}

		ws = getOuterMostWorkspaceFolder(ws)

		if (!languages.has(ws.uri.toString())) {
			languages.set(ws.uri.toString(), DEFAULT_SUPPORT_LANGUAGES)
		}
		await addClient(serverModule, outputChannel, ws)
	}

	workspace.onDidOpenTextDocument(didOpenTextDocument)
	workspace.textDocuments.forEach(didOpenTextDocument)
}

export async function deactivate() {
	const promises: Array<Promise<void>> = []
	for (const c of clients.values()) {
		promises.push(c.stop())
	}
	return Promise.all(promises)
}
