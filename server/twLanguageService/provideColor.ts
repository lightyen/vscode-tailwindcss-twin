import chroma from "chroma-js"
import { ColorDecoration } from "shared"
import * as lsp from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import { findAllMatch, PatternKind } from "~/common/ast"
import parseThemeValue from "~/common/parseThemeValue"
import * as parser from "~/common/twin-parser"
import type { TailwindLoader } from "~/tailwind"
import type { Cache, ServiceOptions } from "./service"

export async function provideColorDecorations(
	document: TextDocument,
	state: TailwindLoader,
	options: ServiceOptions,
	cache: Cache,
) {
	const colors: Array<ColorDecoration & { range: lsp.Range }> = []
	const cachedResult = cache[document.uri.toString()]
	const tokens = findAllMatch(document, options.jsxPropImportChecking)
	for (const { token, kind } of tokens) {
		const [start, end, value] = token
		const a = document.positionAt(start)
		const b = document.positionAt(end)

		if (kind === PatternKind.TwinTheme) {
			const color = getThemeDecoration(value, state)
			if (color) {
				colors.push({
					range: {
						start: a,
						end: b,
					},
					backgroundColor: color,
				})
			}
			continue
		}

		if (kind === PatternKind.TwinCssProperty) {
			continue
		}

		const c = cachedResult[value]
		if (!c) {
			const result = parser.spread({
				text: value,
				separator: state.separator,
			})
			cachedResult[value] = result
		}

		for (const c of cachedResult[value].items) {
			switch (c.type) {
				case parser.SpreadResultType.ClassName:
					{
						let value = c.target.value

						const [isColorShorthandOpacity, name] = state.twin.isColorShorthandOpacity(value)
						if (isColorShorthandOpacity) {
							value = name
						}

						const classname = state.twin.classnames.get(value)
						if (!classname) {
							continue
						}
						if (classname.some(c => c.source === "components")) {
							continue
						}
						const color = state.twin.colors.get(value)
						if (color) {
							colors.push({
								range: {
									start: document.positionAt(start + c.target.start),
									end: document.positionAt(start + c.target.end),
								},
								...color,
							})
						}
					}
					break
				case parser.SpreadResultType.ArbitraryStyle:
					{
						const [isColorArbitraryOpacity, value] = state.twin.isColorArbitraryOpacity(c.target.value)
						if (isColorArbitraryOpacity) {
							const color = state.twin.colors.get(value)
							if (color) {
								colors.push({
									range: {
										start: document.positionAt(start + c.target.start),
										end: document.positionAt(start + c.target.end),
									},
									...color,
								})
							}
						}
						// NOTE: conflict with vscode-styled-components
						// else if (state.twin.isArbitraryColor(c.target.value)) {
						// 	const tw = await state.jitColor(c.target.value)
						// 	if (tw.colors[0]) {
						// 		const color = tw.colors[0][1]
						// 		colors.push({
						// 			range: {
						// 				start: document.positionAt(start + c.target.start),
						// 				end: document.positionAt(start + c.target.end),
						// 			},
						// 			...color,
						// 		})
						// 	}
						// }
					}
					break
			}
		}
	}

	return colors
}

function getThemeDecoration(text: string, state: TailwindLoader): string | undefined {
	const result = parseThemeValue(text)
	if (result.errors.length > 0) {
		return undefined
	}
	const value = state.getTheme(result.keys(), true)
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
