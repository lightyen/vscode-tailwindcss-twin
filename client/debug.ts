import vscode from "vscode"
import { LanguageClient } from "vscode-languageclient"

export default async function ({ client }: { client: LanguageClient }) {
	const name = client.clientOptions.diagnosticCollectionName
	let progress: Thenable<void>
	client.onNotification("tailwindcss/loading", async () => {
		if (!progress) {
			progress = vscode.window.withProgress(
				{
					location: vscode.ProgressLocation.Notification,
					title: name,
					cancellable: false,
				},
				(progress, token) => {
					progress.report({ message: "Loading..." })
					return new Promise<void>((resolve, reject) => {
						interface ProgressParam {
							increment?: number
							message?: string
						}
						const h = client.onProgress<ProgressParam>(null, "tailwindcss/progress", param => {
							if (!param) {
								h.dispose()
								return reject(void 0)
							}
							progress.report(param)
							if (param.increment >= 100) {
								h.dispose()
								return resolve(void 0)
							}
						})
						token.onCancellationRequested(() => h.dispose())
					})
				},
			)
		}
		progress.then((progress = null))
	})

	client.onNotification("tailwindcss/info", message => client.info(message))
	client.onNotification("tailwindcss/error", err => {
		client.error(`${name}: ${err.stack}`, err.stack, err.showNotification)
	})

	const ws = client.clientOptions.workspaceFolder
	client.onRequest("tailwindcss/findConfig", async () => {
		const result = await vscode.workspace.findFiles(
			new vscode.RelativePattern(ws, "{tailwind.js,tailwind.config.js}"),
			new vscode.RelativePattern(ws, "node_modules/**"),
			1,
		)
		return result.map(v => v.fsPath)
	})

	// const cfg = workspace.getConfiguration("tailwindcss")

	// const emitter = createEmitter(client)
	// registerConfigErrorHandler(emitter)
	// registerColorDecorator(client, context, emitter)
	// onMessage(client, "getConfiguration", async scope => workspace.getConfiguration("tailwindcss", scope))
}
