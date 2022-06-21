import { defaultLogger as console } from "@/logger"
import { install } from "source-map-support"
import vscode from "vscode"
import { LanguageClient } from "vscode-languageclient/node"
import { URI, Utils } from "vscode-uri"
import packageInfo from "../package.json"
import { workspaceClient } from "./client"
import { intl } from "./locale"
import { createTailwindLanguageService } from "./service"
import { NAME } from "./shared"

install()

const outputChannel = vscode.window.createOutputChannel(NAME)
console.outputChannel = outputChannel

function createWorkspacesHandler() {
	let context: vscode.ExtensionContext
	/** all opened workspaces, including not activated */
	let workspaceFolders: vscode.WorkspaceFolder[] = []
	/** all activated intances */
	const clients: Map<string, Awaited<ReturnType<typeof workspaceClient>>> = new Map()
	return {
		clients,
		initialize,
		dispose,
		onDidChangeWorkspaceFolders,
	}

	async function initialize(ctx: vscode.ExtensionContext) {
		context = ctx
		const folders = vscode.workspace.workspaceFolders
		if (!folders) return
		workspaceFolders = sortedWorkspaceFolders(folders.slice())
		for await (const client of tidy(workspaceFolders).map(ws => workspaceClient(ctx, ws))) {
			clients.set(client.ws.uri.toString(), client)
		}
	}

	async function onDidChangeWorkspaceFolders(event: vscode.WorkspaceFoldersChangeEvent) {
		const folders = vscode.workspace.workspaceFolders
		if (!folders) return
		const next = workspaceFolders.slice()
		for (const ws of event.added) {
			const i = next.findIndex(w => ws.uri.toString() === w.uri.toString())
			if (i === -1) {
				next.push(ws)
			}
		}
		for (const ws of event.removed) {
			const i = next.findIndex(w => ws.uri.toString() === w.uri.toString())
			if (i >= 0) {
				next.splice(i, 1)
			}
		}
		workspaceFolders = sortedWorkspaceFolders(next)

		const removed: Awaited<ReturnType<typeof workspaceClient>>[] = []
		for (const [uri, c] of clients) {
			const i = next.findIndex(w => w.uri.toString() === uri)
			if (i === -1) removed.push(c)
		}
		const added: vscode.WorkspaceFolder[] = []
		for (const ws of tidy(next)) {
			if (!clients.has(ws.uri.toString())) added.push(ws)
		}

		for (const c of removed) {
			clients.delete(c.ws.uri.toString())
			c.dispose()
		}
		for await (const client of added.map(ws => workspaceClient(context, ws))) {
			clients.set(client.ws.uri.toString(), client)
		}
	}

	function sortedWorkspaceFolders(folders: vscode.WorkspaceFolder[]) {
		return folders.sort((a, b) => {
			return toString(a).length - toString(b).length
		})
		function toString(folder: vscode.WorkspaceFolder) {
			let result = folder.uri.toString()
			if (result.charAt(result.length - 1) !== "/") {
				result = result + "/"
			}
			return result
		}
	}

	function tidy(folders: vscode.WorkspaceFolder[]) {
		const s = new Set<vscode.WorkspaceFolder>()
		for (const ws of folders) {
			let hasCreated = false
			for (const k of s) {
				if (ws.uri.toString().startsWith(k.uri.toString())) {
					hasCreated = true
					break
				}
			}
			if (!hasCreated) s.add(ws)
		}
		return Array.from(s)
	}

	async function dispose() {
		for (const client of clients.values()) {
			await client.dispose()
		}
		clients.clear()
	}
}

const h = createWorkspacesHandler()

export async function deactivate() {
	await h.dispose()
}

function createTextDocumentContentProvider(h: ReturnType<typeof createWorkspacesHandler>) {
	let previewType: string | undefined
	let srv: ReturnType<typeof createTailwindLanguageService> | undefined = undefined

	const emitter = new vscode.EventEmitter<URI>()

	const myTextDocumentContentProvider: vscode.TextDocumentContentProvider = {
		onDidChange: emitter.event,
		provideTextDocumentContent(uri, token) {
			const state = srv?.getState()
			if (state == null) {
				return ""
			}
			if (previewType === "variants") {
				return state.tw.variants
					.flat()
					.map(v => v + ":relative")
					.join("\n")
			}
			return state.tw.classnames.join("\n")
		},
	}

	return vscode.Disposable.from(
		vscode.workspace.registerTextDocumentContentProvider("tailwind", myTextDocumentContentProvider),
		vscode.commands.registerCommand("twin.preview", pickType),
	)

	async function pickType() {
		const type = await vscode.window.showQuickPick(["utilities", "variants"])
		if (!type) return

		srv = undefined
		const twInstances = new Map<string, { srv: ReturnType<typeof createTailwindLanguageService> }>()
		for (const c of h.clients.values()) {
			for (const srv of c.services.values()) {
				const configPath = srv.getConfigPath()
				if (configPath) {
					twInstances.set(configPath.path, {
						srv,
					})
				} else {
					twInstances.set("default", {
						srv,
					})
				}
			}
		}
		const target = await vscode.window.showQuickPick(Array.from(twInstances.keys()))
		if (!target) return
		const ctx = twInstances.get(target)
		if (!ctx) return

		previewType = type
		srv = ctx.srv

		const configPath = srv.getConfigPath()
		const uri = URI.parse(
			"tailwind:" + Utils.joinPath(configPath ? Utils.dirname(configPath) : srv.workspaceFolder, `${type}.twin`),
		)

		srv.activatedEvent.dispose()
		srv.activatedEvent.event(() => {
			emitter.fire(uri)
		})

		if (ctx.srv.getState()?.tw == null) {
			ctx.srv.start()
		}

		const doc = await vscode.workspace.openTextDocument(uri)
		await vscode.window.showTextDocument(doc, { preview: false })
	}
}

export async function activate(context: vscode.ExtensionContext) {
	console.outputMode = context.extensionMode === vscode.ExtensionMode.Development ? "all" : "outputChannel"
	console.info(
		`TypeScript ${intl.formatMessage({ id: "ext.debug-outout.version" })}:`,
		packageInfo.devDependencies["typescript"],
	)
	console.info(
		`Tailwind ${intl.formatMessage({ id: "ext.debug-outout.version" })}:`,
		packageInfo.devDependencies["tailwindcss"],
	)
	console.info(
		`PostCSS ${intl.formatMessage({ id: "ext.debug-outout.version" })}:`,
		packageInfo.devDependencies["postcss"],
	)
	await h.initialize(context)

	context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(h.onDidChangeWorkspaceFolders))
	context.subscriptions.push(createTextDocumentContentProvider(h))
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
