import vscode from "vscode"
import { LanguageClient } from "vscode-languageclient"
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
		const c = chroma(color)
		const x = 0.3
		const decorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: c.css(),
			borderColor: c.luminance() < x ? c.brighten(x).css() : c.darken(x).css(),
			borderWidth: "2px",
			borderStyle: "solid",
			color: c.luminance() < x ? "rgb(227, 227, 227)" : "rgb(28, 28, 28)",
		})
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
		const rs = colors.filter(({ color }) => color !== "currentColor" && color !== "transparent")
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
