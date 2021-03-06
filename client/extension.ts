import path from "path"
import { NAME, SECTION_ID, Settings } from "shared"
import vscode from "vscode"
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from "vscode-languageclient/node"
import colorDecoration from "./colorDecoration"
import debug from "./debug"

const DEFAULT_SUPPORT_LANGUAGES = ["javascript", "javascriptreact", "typescript", "typescriptreact"]

const clients: Map<string, LanguageClient> = new Map()

interface NLSConfig {
	locale: string
	availableLanguages: Record<string, string>
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nlsConfig = JSON.parse(process.env.VSCODE_NLS_CONFIG) as NLSConfig

interface InitializationOptions extends Settings {
	/** uri */
	workspaceFolder: string
	/** uri */
	configs: string[]
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

	const userSettings = vscode.workspace.getConfiguration("", ws)
	const initOptions: Partial<InitializationOptions> = userSettings.get(SECTION_ID)
	if (typeof initOptions.colorDecorators !== "boolean") {
		initOptions.colorDecorators = userSettings.get("editor.colorDecorators")
	}

	const configs = await vscode.workspace.findFiles(
		new vscode.RelativePattern(ws, "**/{tailwind.js,tailwind.config.js}"),
		new vscode.RelativePattern(ws, "**/{node_modules/,.yarn/}*"),
	)
	initOptions.workspaceFolder = ws.uri.toString()
	initOptions.configs = configs.map(c => c.toString())

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
		diagnosticCollectionName: NAME,
		workspaceFolder: ws,
		outputChannel: outputChannel,
		middleware: {},
		progressOnInitialization: true,
		initializationOptions: initOptions,
	}

	const client = new LanguageClient(NAME, NAME, serverOptions, clientOptions)
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
	outputChannel = vscode.window.createOutputChannel(NAME)
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
