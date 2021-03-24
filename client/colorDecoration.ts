import chroma from "chroma-js"
import { ColorDecoration } from "shared"
import vscode from "vscode"
import { LanguageClient } from "vscode-languageclient/node"

class ColorMap {
	colorMap = new Map<string, vscode.TextEditorDecorationType>()
	primaryColor: vscode.ThemeColor
	constructor(primaryColor: vscode.ThemeColor) {
		this.primaryColor = primaryColor
	}
	get(key: string) {
		if (this.colorMap.has(key)) {
			return this.colorMap.get(key)
		}
		const transparent = "rgba(255, 255, 0, 0.0)"
		const options: vscode.DecorationRenderOptions = { light: {}, dark: {} }
		const [__color, __backgroundColor, __borderColor] = key.split("_")
		if (__backgroundColor) {
			const backgroundColor = chroma(
				__backgroundColor === "transparent" ? transparent : __backgroundColor || transparent,
			)
			options.backgroundColor = backgroundColor.css()
			if (__backgroundColor === "transparent") {
				if (options.light) {
					options.light.borderWidth = "3px"
					options.light.borderStyle = "dashed"
					options.light.color = "rgb(28, 28, 28, 0.93)"
					options.light.borderColor = "rgba(28, 28, 28, 0.1)"
				}
				if (options.dark) {
					options.dark.borderWidth = "3px"
					options.dark.borderStyle = "dashed"
					options.dark.color = "rgba(255, 255, 255, 0.93)"
					options.dark.borderColor = "rgba(227, 227, 227, 0.1)"
				}
			} else {
				options.color =
					backgroundColor.luminance() < 0.3 ? "rgba(255, 255, 255, 0.93)" : "rgba(28, 28, 28, 0.93)"
			}
		}
		if (__borderColor) {
			const borderColor = chroma(__borderColor === "transparent" ? transparent : __borderColor || transparent)
			options.borderColor = borderColor.css()
			options.borderWidth = "1.5px"
			options.borderStyle = "solid"
			if (__borderColor === "transparent") {
				if (options.light) {
					options.light.borderWidth = "3px"
					options.light.borderStyle = "dashed"
					options.light.color = "rgb(28, 28, 28, 0.93)"
					options.light.borderColor = "rgba(28, 28, 28, 0.1)"
				}
				if (options.dark) {
					options.dark.borderWidth = "3px"
					options.dark.borderStyle = "dashed"
					options.dark.color = "rgba(255, 255, 255, 0.93)"
					options.dark.borderColor = "rgba(227, 227, 227, 0.1)"
				}
			}
		}
		if (__color) {
			const color = chroma(__color === "transparent" ? transparent : __color || transparent)
			if (__color !== "transparent") {
				options.color = color.css()
				if (!options.backgroundColor) {
					if (color.luminance() < 0.1) {
						if (options.dark) {
							options.dark.backgroundColor = "rgba(255, 255, 255, 0.93)"
						}
					} else if (color.luminance() > 0.6) {
						if (options.light) {
							options.light.backgroundColor = "rgba(28, 28, 28, 0.93)"
						}
					}
				}
			} else {
				if (options.light) {
					options.light.borderWidth = "3px"
					options.light.borderStyle = "dashed"
					options.light.color = "rgb(28, 28, 28, 0.93)"
					options.light.borderColor = "rgba(28, 28, 28, 0.1)"
				}
				if (options.dark) {
					options.dark.borderWidth = "3px"
					options.dark.borderStyle = "dashed"
					options.dark.color = "rgb(255, 255, 255, 0.93)"
					options.dark.borderColor = "rgba(227, 227, 227, 0.1)"
				}
			}
		}

		const decorationType = vscode.window.createTextEditorDecorationType(options)
		this.colorMap.set(key, decorationType)
		return decorationType
	}
	dispose() {
		this.colorMap.forEach(d => d.dispose())
	}
	diff(keys: string[]) {
		const add = keys.filter(c => !this.colorMap.has(c))
		for (const c of Array.from(this.colorMap.keys())) {
			if (keys.includes(c)) {
				continue
			}
			this.get(c)?.dispose()
			this.colorMap.delete(c)
		}
		add.forEach(c => this.colorMap.get(c))
	}
}

export default async function ({ client }: { client: LanguageClient }) {
	vscode.window.onDidChangeActiveTextEditor(editor => {
		// if (editor) {
		// 	console.log("trigger change editor")
		// }
	})

	const colorMap = new ColorMap(new vscode.ThemeColor("badge.background"))

	function updateDecorations(
		enabled: boolean,
		uri: string,
		colors: Array<ColorDecoration & { range: vscode.Range }>,
	) {
		const editor = vscode.window.visibleTextEditors.find(v => v.document.uri.toString() === uri)
		if (!editor) {
			return
		}
		if (!enabled) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			editor.setDecorations(null!, [])
			return
		}
		const list = new Map<string, { ranges: vscode.Range[] } & ColorDecoration>()
		colors
			.filter(
				({ color, backgroundColor, borderColor }) =>
					color !== "currentColor" && backgroundColor !== "currentColor" && borderColor !== "currentColor",
			)
			.forEach(({ range, color, backgroundColor, borderColor }) => {
				const key = [color, backgroundColor, borderColor].join("_")
				if (!list.has(key)) {
					list.set(key, { color, backgroundColor, borderColor, ranges: [] })
				}
				list.get(key)?.ranges.push(range)
			})

		colorMap.diff(Array.from(list.keys()))
		list.forEach(({ ranges }, key) => {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			editor.setDecorations(colorMap.get(key)!, ranges)
		})
	}

	client.onNotification("tailwindcss/documentColors", async ({ colors, uri }) => {
		updateDecorations(true, uri, colors)
	})
}
