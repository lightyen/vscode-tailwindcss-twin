import { NAME, SECTION_ID, Settings } from "shared"
import vscode from "vscode"
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from "vscode-languageclient/node"
import colorDecoration from "./colorDecoration"
import debug from "./debug"

const DEFAULT_SUPPORT_LANGUAGES = ["javascript", "javascriptreact", "typescript", "typescriptreact"]

const clients: Map<string, LanguageClient> = new Map()

interface InitializationOptions extends Settings {
	/** uri */
	workspaceFolder: string
	/** uri */
	configs: string[]
}

async function addClient(serverModule: vscode.Uri, outputChannel: vscode.OutputChannel, ws: vscode.WorkspaceFolder) {
	if (clients.has(ws.uri.toString())) {
		return
	}

	const serverOptions: ServerOptions = {
		run: { module: serverModule.fsPath, transport: TransportKind.ipc },
		debug: {
			module: serverModule.fsPath,
			transport: TransportKind.ipc,
			options: { execArgv: ["--nolazy", "--inspect=6009"] },
		},
	}

	const userSettings = vscode.workspace.getConfiguration("", ws)
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const initOptions: Partial<InitializationOptions> = userSettings.get(SECTION_ID)!
	if (initOptions.colorDecorators === "inherit") {
		initOptions.colorDecorators = userSettings.get("editor.colorDecorators") ? "on" : "off"
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
		// vscode.window.registerTreeDataProvider("twinColors", new ColorNamesProvider(client))
	})
	client.start()
}

export async function activate(context: vscode.ExtensionContext) {
	const outputChannel: vscode.OutputChannel = vscode.window.createOutputChannel(NAME)
	const serverModuleUri = vscode.Uri.joinPath(vscode.Uri.file(context.extensionPath), "dist", "server", "server.js")
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
			promises.push(addClient(serverModuleUri, outputChannel, ws))
		}
		return Promise.all(promises)
	})

	if (vscode.workspace.workspaceFolders instanceof Array) {
		for (const ws of vscode.workspace.workspaceFolders) {
			await addClient(serverModuleUri, outputChannel, ws)
		}
	}
}

// package.json
// {
// "activationEvents": [  "onView:twinColors" ],
// "contributes": {
// 		"views": {
// 			"explorer": [
// 				{
// 					"id": "twinColors",
// 					"name": "colors"
// 				}
// 			]
// 		}
// 	}
// }

type ColorElement = string

export class ColorNamesProvider implements vscode.TreeDataProvider<ColorElement> {
	constructor(private readonly client: LanguageClient) {}
	async getChildren(e: ColorElement) {
		if (!vscode.window.activeTextEditor) {
			return
		}
		const document = vscode.window.activeTextEditor.document
		return await this.client.sendRequest<string[]>("tailwindcss/colors", { uri: document.uri.toString() })
	}
	getTreeItem(name: ColorElement): vscode.TreeItem {
		return {
			label: name,
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
