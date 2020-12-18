import vscode from "vscode"
import { LanguageClient } from "vscode-languageclient/node"
import chroma from "chroma-js"

class ColorMap {
	colorMap = new Map<string, vscode.TextEditorDecorationType>()
	primaryColor: vscode.ThemeColor
	constructor(primaryColor: vscode.ThemeColor) {
		this.primaryColor = primaryColor
	}
	get(color: string) {
		if (this.colorMap.has(color)) {
			return this.colorMap.get(color)
		}
		const c = chroma(color !== "transparent" ? color : "rgba(0, 0, 0, 0.0)")
		const x = 0.3
		const options: vscode.DecorationRenderOptions = {
			borderWidth: "3px",
			borderStyle: "solid",
			backgroundColor: c.css(),
			borderColor: c.css(),
			color: c.luminance() < x ? "rgb(227, 227, 227, 0.9)" : "rgb(28, 28, 28, 0.9)",
		}
		if (color === "transparent") {
			options.light = {
				color: "rgb(28, 28, 28, 0.7)",
				borderColor: "rgba(28, 28, 28, 0.1)",
				borderStyle: "dashed",
			}
			options.dark = {
				color: "rgb(227, 227, 227, 0.7)",
				borderColor: "rgba(227, 227, 227, 0.1)",
				borderStyle: "dashed",
			}
		}
		const decorationType = vscode.window.createTextEditorDecorationType(options)
		this.colorMap.set(color, decorationType)
		return decorationType
	}
	dispose() {
		this.colorMap.forEach(d => d.dispose())
	}
	diff(colors: string[]) {
		const add = colors.filter(c => !this.colorMap.has(c))
		for (const c of Array.from(this.colorMap.keys())) {
			if (colors.includes(c)) {
				continue
			}
			this.get(c).dispose()
			this.colorMap.delete(c)
		}
		add.forEach(c => this.colorMap.get(c))
	}
}

export default async function ({ client }: { client: LanguageClient }) {
	const colorMap = new ColorMap(new vscode.ThemeColor("badge.background"))
	type ColorInformation = {
		range: vscode.Range
		color: string
	}

	function updateDecorations(enabled: boolean, uri: string, colors: ColorInformation[]) {
		const editor = vscode.window.visibleTextEditors.find(v => v.document.uri.toString() === uri)
		if (!editor) {
			return
		}
		if (!enabled) {
			editor.setDecorations(null, [])
			return
		}
		const list = new Map<string, { color: string; ranges: vscode.Range[] }>()
		const rs = colors.filter(({ color }) => color !== "currentColor")
		rs.forEach(c => {
			if (!list.has(c.color)) {
				list.set(c.color, { color: c.color, ranges: [] })
			}
			list.get(c.color).ranges.push(c.range)
		})

		colorMap.diff(Array.from(list.keys()))
		list.forEach(({ color, ranges }) => {
			editor.setDecorations(colorMap.get(color), ranges)
		})
	}

	client.onNotification("tailwindcss/documentColors", async ({ colors, uri }) => {
		updateDecorations(true, uri, colors)
	})
}
