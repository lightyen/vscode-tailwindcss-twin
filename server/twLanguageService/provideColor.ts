import * as lsp from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import chroma from "chroma-js"
import { ColorInformation } from "~/LanguageService"
import { Tailwind } from "~/tailwind"
import type { ServiceOptions, Cache } from "."
import { findAllMatch, PatternKind } from "~/common/ast"
import * as tw from "~/common/twin"
import findAllElements from "~/common/findAllElements"
import parseThemeValue from "~/common/parseThemeValue"

export default function provideColor(
	document: TextDocument,
	state: Tailwind,
	options: ServiceOptions,
	cache: Cache,
	_result: lsp.ColorInformation[],
) {
	const colors: ColorInformation[] = []
	const cachedResult = cache[document.uri.toString()]
	const tokens = findAllMatch(document, options.jsxPropImportChecking)
	for (const { token, kind } of tokens) {
		const [start, end, value] = token
		const twin = kind === PatternKind.Twin
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
			const result = findAllElements({
				input: value,
				separator: state.separator,
			})
			cachedResult[value] = result
		}

		const { elementList } = cachedResult[value]

		for (const c of elementList) {
			switch (c.kind) {
				case tw.TokenKind.CssProperty:
					{
						// XXX: Experimental
						// function getColor(value: string): string | undefined {
						// 	if (value === "transparent") {
						// 		return value
						// 	}
						// 	try {
						// 		const c = chroma(value)
						// 		return c.css()
						// 	} catch {
						// 		return undefined
						// 	}
						// }
						// const color = getColor(c.value.trim().text)
						// if (color) {
						// 	if (color === "transparent") {
						// 		result.push({
						// 			range: {
						// 				start: document.positionAt(start + c.value.start),
						// 				end: document.positionAt(start + c.value.end),
						// 			},
						// 			color: lsp.Color.create(0, 0, 0, 0),
						// 		})
						// 	} else {
						// 		const [red, green, blue, alpha] = chroma(color).rgba()
						// 		result.push({
						// 			range: {
						// 				start: document.positionAt(start + c.value.start),
						// 				end: document.positionAt(start + c.value.end),
						// 			},
						// 			color: lsp.Color.create(red / 255, green / 255, blue / 255, alpha),
						// 		})
						// 	}
						// }
					}
					break
				case tw.TokenKind.ClassName:
					{
						if (!state.classnames.isClassName(c.variants.texts, twin, c.token.text)) {
							continue
						}
						const color = state.classnames.getColorInfo(c.token.text)
						if (color) {
							colors.push({
								range: {
									start: document.positionAt(start + c.token.start),
									end: document.positionAt(start + c.token.end),
								},
								...color,
							})
						}
					}
					break
			}
		}
	}

	return colors
}

function getThemeDecoration(text: string, state: Tailwind): string {
	const result = parseThemeValue(text)
	if (result.errors.length > 0) {
		return undefined
	}
	const value = state.getTheme(result.keys())
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
