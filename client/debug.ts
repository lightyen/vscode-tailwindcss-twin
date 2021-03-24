import vscode from "vscode"
import { LanguageClient } from "vscode-languageclient/node"

export default async function ({ client }: { client: LanguageClient }) {
	const name = client.clientOptions.diagnosticCollectionName
	let progress: Thenable<void> | undefined
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
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						const h = client.onProgress<ProgressParam>(null!, "tailwindcss/progress", param => {
							if (!param) {
								h.dispose()
								return reject(void 0)
							}
							progress.report(param)
							if (param.increment && param.increment >= 100) {
								h.dispose()
								return resolve(void 0)
							}
						})
						token.onCancellationRequested(() => h.dispose())
					})
				},
			)
		}
		progress.then((progress = undefined))
	})

	client.onNotification("tailwindcss/info", message => client.info(message))
	client.onNotification("tailwindcss/error", err => {
		client.error(`${name}: ${err.stack}`, err.stack, err.showNotification)
	})
}
