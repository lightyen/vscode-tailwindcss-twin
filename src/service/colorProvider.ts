import { md5 } from "@"
import { ExtractedToken, ExtractedTokenKind, TextDocument } from "@/extractors"
import { defaultLogger as console } from "@/logger"
import * as parser from "@/parser"
import parseThemeValue from "@/parseThemeValue"
import chroma from "chroma-js"
import vscode from "vscode"
import { ColorDesc, TwContext } from "./tailwind/tw"

export function createColorProvider(tw: TwContext, separator: string) {
	const colors = new Map<string, vscode.TextEditorDecorationType>()
	return {
		dispose() {
			for (const decorationType of colors.values()) {
				decorationType.dispose()
			}
			colors.clear()
		},
		render(tokens: ExtractedToken[], editor: vscode.TextEditor) {
			const a = process.hrtime.bigint()
			_render()
			const b = process.hrtime.bigint()
			console.trace(`colors (${Number((b - a) / 10n ** 6n)}ms)`)

			return

			function _render() {
				const colorRanges = getColorRanges(tokens, editor.document)
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
			}
		},
	}

	function getColorRanges(tokens: ExtractedToken[], document: TextDocument) {
		const colors: Array<[ColorDesc, vscode.Range]> = []
		const test = (desc: ColorDesc | undefined): desc is ColorDesc => {
			if (!desc) return false
			return !(
				desc.color === "currentColor" ||
				desc.color === "inherit" ||
				desc.backgroundColor === "currentColor" ||
				desc.backgroundColor === "inherit" ||
				desc.borderColor === "currentColor" ||
				desc.borderColor === "inherit"
			)
		}
		for (const token of tokens) {
			const { start: offset, end, kind } = token
			switch (kind) {
				case ExtractedTokenKind.Twin: {
					const result = parser.spread({ text: token.value, separator })
					for (const item of result.items) {
						if (item.target.type === parser.NodeType.ClassName) {
							const color = tw.getColorDesc(item.value)
							if (!test(color)) {
								const i = item.target.value.lastIndexOf("/")
								if (i === -1) continue
							}
							if (test(color)) {
								const range = new vscode.Range(
									document.positionAt(offset + item.target.range[0]),
									document.positionAt(offset + item.target.range[1]),
								)
								colors.push([color, range])
							} else {
								const i = item.value.lastIndexOf("/")
								if (i === -1) continue
								const value = item.value.slice(0, i)
								const color = tw.getColorDesc(value)
								if (test(color)) {
									const start = offset + item.target.range[0]
									const end = start + value.length
									const range = new vscode.Range(document.positionAt(start), document.positionAt(end))
									colors.push([color, range])
								}
							}
						} else if (item.target.type === parser.NodeType.ArbitraryClassname) {
							const i = item.target.prop.value.lastIndexOf("/")
							if (i === -1) continue
							let value = token.value.slice(...item.target.range)
							const n = value.slice(i + 1)
							if (Number.isNaN(+n)) {
								if (n.charCodeAt(0) !== 91) continue
							}
							value = value.slice(0, i)
							const color = tw.getColorDesc(value)
							if (test(color)) {
								const start = offset + item.target.range[0]
								const end = start + value.length
								const range = new vscode.Range(document.positionAt(start), document.positionAt(end))
								colors.push([color, range])
							}
						}
					}
					break
				}
				case ExtractedTokenKind.TwinTheme: {
					const color = getThemeDecoration(token.value, tw)
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
		const transparent = "rgba(0, 0, 0, 0.0)"
		const options: vscode.DecorationRenderOptions = { light: {}, dark: {} }
		if (desc.backgroundColor) {
			const backgroundColor = chroma(desc.backgroundColor === "transparent" ? transparent : desc.backgroundColor)
			options.backgroundColor = backgroundColor.css()
			if (desc.backgroundColor === "transparent") {
				setTransparent(options)
			} else {
				options.color =
					backgroundColor.luminance() < 0.3 ? "rgba(255, 255, 255, 0.93)" : "rgba(28, 28, 28, 0.93)"
			}
		}

		options.borderRadius = "3px"
		if (desc.borderColor) {
			const borderColor = chroma(desc.borderColor === "transparent" ? transparent : desc.borderColor)
			options.borderColor = borderColor.css()
			options.borderWidth = "2px"
			options.borderStyle = "solid"
			if (desc.borderColor === "transparent") {
				setTransparent(options)
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
				setTransparent(options)
			}
		}
		return vscode.window.createTextEditorDecorationType(options)

		function setTransparent(options: vscode.DecorationRenderOptions) {
			if (options.light) {
				options.light.borderWidth = "medium"
				options.light.borderStyle = "dashed"
				options.light.color = "rgb(28, 28, 28, 0.93)"
				options.light.borderColor = "rgba(28, 28, 28, 0.1)"
			}
			if (options.dark) {
				options.dark.borderWidth = "medium"
				options.dark.borderStyle = "dashed"
				options.dark.color = "rgba(255, 255, 255, 0.93)"
				options.dark.borderColor = "rgba(227, 227, 227, 0.1)"
			}
		}
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
