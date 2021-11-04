import { defaultLogger as console } from "@/logger"
import { install } from "source-map-support"
import vscode from "vscode"
import { LanguageClient } from "vscode-languageclient/node"
import packageInfo from "../package.json"
import { workspaceClient } from "./client"
import { intl } from "./locale"
import { NAME } from "./shared"

install()

const outputChannel = vscode.window.createOutputChannel(NAME)
console.outputChannel = outputChannel

const clients: Map<string, vscode.Disposable> = new Map()

async function addClient(context: vscode.ExtensionContext, ws: vscode.WorkspaceFolder) {
	if (clients.has(ws.uri.toString())) return
	const client = await workspaceClient(context, ws)
	clients.set(ws.uri.toString(), client)
}

export async function deactivate() {
	for (const client of clients.values()) {
		client.dispose()
	}
	clients.clear()
}

export async function activate(context: vscode.ExtensionContext) {
	console.outputMode = context.extensionMode === vscode.ExtensionMode.Development ? "all" : "outputChannel"
	console.info(
		`TypeScript ${intl.formatMessage({ id: "ext.debug-outout.version" })}:`,
		packageInfo.devDependencies["typescript"],
	)
	console.info(
		`Tailwind ${intl.formatMessage({ id: "ext.debug-outout.version" })}:`,
		packageInfo.dependencies["tailwindcss"],
	)
	console.info(
		`PostCSS ${intl.formatMessage({ id: "ext.debug-outout.version" })}:`,
		packageInfo.dependencies["postcss"],
	)

	if (vscode.workspace.workspaceFolders) {
		for (const ws of vscode.workspace.workspaceFolders) {
			addClient(context, ws)
		}
	}

	context.subscriptions.push(
		vscode.workspace.onDidChangeWorkspaceFolders(event => {
			for (const ws of event.removed) {
				const client = clients.get(ws.uri.toString())
				if (client) {
					clients.delete(ws.uri.toString())
					client.dispose()
				}
			}
			for (const ws of event.added) {
				addClient(context, ws)
			}
		}),
	)
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
		return await this.client.sendRequest<string[]>("tw/colors", { uri: document.uri.toString() })
	}
	getTreeItem(name: ColorElement): vscode.TreeItem {
		return {
			label: name,
		}
	}
}
