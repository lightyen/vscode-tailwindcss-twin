import { md5 } from "@"
import { findAllMatch, PatternKind } from "@/ast"
import parseThemeValue from "@/parseThemeValue"
import * as parser from "@/twin-parser"
import chroma from "chroma-js"
import vscode from "vscode"
import { ColorDesc, TwContext } from "./tailwind/tw"

export function createColorProvider(tw: TwContext) {
	const colors = new Map<string, vscode.TextEditorDecorationType>()
	return {
		dispose() {
			for (const decorationType of colors.values()) {
				decorationType.dispose()
			}
			colors.clear()
		},
		render(editor: vscode.TextEditor) {
			const colorRanges = getColorRanges(editor.document)
			const new_keys = new Map(colorRanges.map(v => [toKey(v[0]), v[0]]))

			for (const key of colors.keys()) {
				if (new_keys.has(key)) continue
				const deco = colors.get(key)
				deco?.dispose()
				colors.delete(key)
			}
			for (const [key, desc] of new_keys) {
				if (!colors.has(key)) {
					colors.set(key, createTextEditorDecorationType(desc))
				}
			}

			const cate = new Map<string, vscode.Range[]>()
			for (const [desc, range] of colorRanges) {
				const key = toKey(desc)
				const ranges = cate.get(key)
				if (ranges) {
					ranges.push(range)
				} else {
					cate.set(key, [range])
				}
			}

			// render
			for (const [key, ranges] of cate) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				editor.setDecorations(colors.get(key)!, ranges)
			}
		},
	}

	function getColorRanges(document: vscode.TextDocument) {
		const colors: Array<[ColorDesc, vscode.Range]> = []
		const no = (desc: ColorDesc) => {
			return (
				desc.color === "currentColor" ||
				desc.color === "inherit" ||
				desc.backgroundColor === "currentColor" ||
				desc.backgroundColor === "inherit" ||
				desc.borderColor === "currentColor" ||
				desc.borderColor === "inherit"
			)
		}
		for (const { token, kind } of findAllMatch(document, true)) {
			const [offset, end, value] = token
			switch (kind) {
				case PatternKind.Twin: {
					const result = parser.spread({ text: value })
					for (const item of result.items) {
						if (item.type !== parser.SpreadResultType.ClassName) continue
						const color = tw.colors.get(item.target.value)
						if (color) {
							if (no(color)) continue
							const range = new vscode.Range(
								document.positionAt(offset + item.target.start),
								document.positionAt(offset + item.target.end),
							)
							colors.push([color, range])
						}
					}
					break
				}
				case PatternKind.TwinTheme: {
					const color = getThemeDecoration(value, tw)
					if (color) {
						const range = new vscode.Range(document.positionAt(offset), document.positionAt(end))
						colors.push([{ backgroundColor: color }, range])
					}
					break
				}
			}
		}
		return colors
	}

	function toKey(desc: ColorDesc) {
		return md5("a" + (desc.color ?? "") + "b" + (desc.backgroundColor ?? "") + "c" + (desc.borderColor ?? ""))
	}

	function createTextEditorDecorationType(desc: ColorDesc) {
		const transparent = "rgba(255, 255, 0, 0.0)"
		const options: vscode.DecorationRenderOptions = { light: {}, dark: {} }
		if (desc.backgroundColor) {
			const backgroundColor = chroma(desc.backgroundColor === "transparent" ? transparent : desc.backgroundColor)
			options.backgroundColor = backgroundColor.css()
			if (desc.backgroundColor === "transparent") {
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
		if (desc.borderColor) {
			const borderColor = chroma(desc.borderColor === "transparent" ? transparent : desc.borderColor)
			options.borderColor = borderColor.css()
			options.borderWidth = "1.5px"
			options.borderStyle = "solid"
			if (desc.borderColor === "transparent") {
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
		if (desc.color) {
			const color = chroma(desc.color === "transparent" ? transparent : desc.color)
			if (desc.color !== "transparent") {
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
		return vscode.window.createTextEditorDecorationType(options)
	}

	function getThemeDecoration(text: string, tw: TwContext): string | undefined {
		const result = parseThemeValue(text)
		if (result.errors.length > 0) {
			return undefined
		}
		const value = tw.getTheme(result.keys(), true)
		if (typeof value === "string") {
			if (value === "transparent") {
				return value
			}
			try {
				const c = chroma(value)
				return c.css()
			} catch {
				return undefined
			}
		}
		return undefined
	}
}
