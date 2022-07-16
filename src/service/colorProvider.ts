import * as culori from "culori"
import vscode from "vscode"
import { md5 } from "~/common"
import { ensureContrastRatio } from "~/common/culori"
import type { ExtractedToken, TextDocument } from "~/common/extractors/types"
import { defaultLogger as console } from "~/common/logger"
import * as parser from "~/common/parser"
import type { ServiceOptions } from "~/shared"
import { ColorDesc, createTwContext, TwContext } from "./tailwind/tw"

export function createColorProvider(tw: TwContext, separator: string) {
	const colors = new Map<string, vscode.TextEditorDecorationType>()
	const rgb = culori.converter("rgb")
	const hsl = culori.converter("hsl")
	const transparent = rgb("rgba(0, 0, 0, 0)")
	return {
		dispose() {
			for (const decorationType of colors.values()) {
				decorationType.dispose()
			}
			colors.clear()
		},
		render(tokens: ExtractedToken[], editor: vscode.TextEditor, options: ServiceOptions) {
			const a = process.hrtime.bigint()
			_render()
			const b = process.hrtime.bigint()
			console.trace(`colors decoration (${Number((b - a) / 10n ** 6n)}ms)`)

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
						colors.set(key, createTextEditorDecorationType(desc, options))
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
	} as const

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
			const { start: offset, kind } = token
			switch (kind) {
				case "tw": {
					const result = parser.spread(token.value, { separator })
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
							const [start] = item.target.range
							const end = start + item.target.prefix.value.length
							const value = token.value.slice(start, end)
							const color = tw.getColorDesc(value)
							if (test(color)) {
								const range = new vscode.Range(
									document.positionAt(offset + start),
									document.positionAt(offset + end),
								)
								colors.push([color, range])
							}
						}
					}
					break
				}
				case "theme": {
					const val = parser.parse_theme_val({ text: token.value })
					const color = getThemeDecoration(val, tw)
					if (color) {
						const range = new vscode.Range(
							document.positionAt(offset + val.range[0]),
							document.positionAt(offset + val.range[1]),
						)
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

	function createTextEditorDecorationType(desc: ColorDesc, opts: ServiceOptions) {
		const options: vscode.DecorationRenderOptions = { light: {}, dark: {} }
		if (desc.backgroundColor) {
			const backgroundColor = desc.backgroundColor === "transparent" ? transparent : rgb(desc.backgroundColor)
			options.backgroundColor = culori.formatRgb(backgroundColor)
			if (desc.backgroundColor === "transparent") {
				setTransparent(options)
			} else {
				const color = hsl(backgroundColor)
				color.s = 0
				const out = ensureContrastRatio(rgb(color), backgroundColor, opts.minimumContrastRatio)
				if (out) options.color = culori.formatRgb(out)
				else options.color = culori.formatRgb(color)
			}
		}

		options.borderRadius = "3px"
		if (desc.borderColor) {
			const borderColor = desc.borderColor === "transparent" ? transparent : rgb(desc.borderColor)
			options.borderColor = culori.formatRgb(borderColor)
			options.borderWidth = "2px"
			options.borderStyle = "solid"
			if (desc.borderColor === "transparent") {
				setTransparent(options)
			}
		}
		if (desc.color) {
			const color = desc.color === "transparent" ? transparent : rgb(desc.color)
			if (desc.color !== "transparent") {
				options.color = culori.formatRgb(color)
				if (!options.backgroundColor) {
					const backgroundColor = hsl(color)
					backgroundColor.s = 0
					const out = ensureContrastRatio(rgb(backgroundColor), color, opts.minimumContrastRatio)
					if (out) options.backgroundColor = culori.formatRgb(out)
					else options.backgroundColor = culori.formatRgb(backgroundColor)
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
				options.dark.color = "rgba(227, 227, 227, 0.93)"
				options.dark.borderColor = "rgba(227, 227, 227, 0.1)"
			}
		}
	}

	function getThemeDecoration(
		node: parser.ThemeValueNode,
		tw: ReturnType<typeof createTwContext>,
	): string | undefined {
		const out = parser.renderThemePath(tw.context.tailwindConfig, node.path)
		if (out === "transparent") return out
		const color = culori.parse(out)
		if (!color) return undefined
		color.alpha = 1
		return culori.formatRgb(color)
	}
}
