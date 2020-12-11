import vscode from "vscode"
import { LanguageClient } from "vscode-languageclient"

export default async function ({ client }: { client: LanguageClient }) {
	const decorationType = vscode.window.createTextEditorDecorationType({
		textDecoration: ";position: relative;",
		before: {
			width: "0.85em",
			height: "0.85em",
			contentText: " ",
			border: "0.1em solid",
			margin: "0 0.15em",
			textDecoration: "; position: relative; transform: translate(0%,10%);", // magic
		},
		dark: {
			before: {
				borderColor: "#eeeeee",
			},
		},
		light: {
			before: {
				borderColor: "#222222",
			},
		},
	})

	type ColorInformation = {
		range: vscode.Range
		color: string
	}

	function updateDecorations(enabled: boolean, colors: ColorInformation[]) {
		const activeEditor = vscode.window.activeTextEditor
		if (!activeEditor) {
			return
		}
		if (!enabled) {
			activeEditor.setDecorations(decorationType, [])
			return
		}
		activeEditor.setDecorations(
			decorationType,
			colors
				.filter(({ color }) => color !== "currentColor" && color !== "transparent")
				.map(({ range, color }) => ({
					range,
					renderOptions: { before: { backgroundColor: color } },
				})),
		)
	}

	client.onNotification("tailwindcss/documentColors", async ({ colors }) => updateDecorations(true, colors))
}
