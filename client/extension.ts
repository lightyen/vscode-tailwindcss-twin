import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from "vscode-languageclient/node"
import vscode from "vscode"
import path from "path"

import colorDecoration from "./colorDecoration"
import debug from "./debug"

const CLIENT_ID = "Tailwind Twin IntelliSense"

const DEFAULT_SUPPORT_LANGUAGES = ["javascript", "javascriptreact", "typescript", "typescriptreact"]

const clients: Map<string, LanguageClient> = new Map()

interface NLSConfig {
	locale: string
	availableLanguages: Record<string, string>
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nlsConfig = JSON.parse(process.env.VSCODE_NLS_CONFIG) as NLSConfig

interface InitializationOptions {
	/** uri */
	workspaceFolder: string
	/** uri */
	configs: string[]
	colorDecorators: boolean
	references: boolean
	validate: boolean
	preferVariantWithParentheses: boolean
	fallbackDefaultConfig: boolean
	diagnostics: {
		conflict: "none" | "loose" | "strict"
		emptyClass: boolean
		emptyGroup: boolean
	}
}

async function addClient(serverModule: string, outputChannel: vscode.OutputChannel, ws: vscode.WorkspaceFolder) {
	if (clients.has(ws.uri.toString())) {
		return
	}

	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: { execArgv: ["--nolazy", "--inspect=6009"] },
		},
	}
	const initOptions: Partial<InitializationOptions> = {}
	const configs = await vscode.workspace.findFiles(
		new vscode.RelativePattern(ws, "**/{tailwind.js,tailwind.config.js}"),
		new vscode.RelativePattern(ws, "**/{node_modules/,.yarn/}*"),
	)
	initOptions.configs = configs.map(c => c.toString())
	initOptions.workspaceFolder = ws.uri.toString()
	const tailwindcss = vscode.workspace.getConfiguration("tailwindcss", ws)
	initOptions.colorDecorators = tailwindcss.get("colorDecorators")
	if (typeof initOptions.colorDecorators !== "boolean") {
		initOptions.colorDecorators = vscode.workspace.getConfiguration("editor", ws).get("colorDecorators")
	}
	initOptions.validate = tailwindcss.get("validate")
	initOptions.references = tailwindcss.get("references")
	initOptions.preferVariantWithParentheses = tailwindcss.get("preferVariantWithParentheses")
	initOptions.fallbackDefaultConfig = tailwindcss.get("fallbackDefaultConfig")
	initOptions.diagnostics = tailwindcss.get("diagnostics")

	const clientOptions: LanguageClientOptions = {
		documentSelector: DEFAULT_SUPPORT_LANGUAGES.map(language => ({
			scheme: "file",
			language,
			pattern: `${ws.uri.fsPath}/**/*`,
		})),
		synchronize: {
			fileEvents: vscode.workspace.createFileSystemWatcher(
				new vscode.RelativePattern(ws, "**/{tailwind.js,tailwind.config.js}"),
			),
		},
		diagnosticCollectionName: CLIENT_ID,
		workspaceFolder: ws,
		outputChannel: outputChannel,
		middleware: {},
		progressOnInitialization: true,
		initializationOptions: initOptions,
	}

	const client = new LanguageClient(CLIENT_ID, CLIENT_ID, serverOptions, clientOptions)
	clients.set(ws.uri.toString(), client)
	client.onReady().then(() => {
		colorDecoration({ client })
		debug({ client })
	})
	client.start()
}

let outputChannel: vscode.OutputChannel
let serverModule: string

export async function activate(context: vscode.ExtensionContext) {
	outputChannel = vscode.window.createOutputChannel(CLIENT_ID)
	serverModule = context.asAbsolutePath(path.join("dist", "server", "server.js"))
	vscode.workspace.onDidChangeWorkspaceFolders(async e => {
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

	if (vscode.workspace.workspaceFolders instanceof Array) {
		for (const ws of vscode.workspace.workspaceFolders) {
			await addClient(serverModule, outputChannel, ws)
		}
	}
}

export async function deactivate() {
	const promises: Array<Promise<void>> = []
	for (const c of clients.values()) {
		promises.push(c.stop())
	}
	return Promise.all(promises)
}
