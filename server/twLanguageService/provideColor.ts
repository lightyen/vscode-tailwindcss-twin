import chroma from "chroma-js"
import { ColorDecoration } from "shared"
import * as lsp from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import { findAllMatch, PatternKind } from "~/common/ast"
import findAllElements from "~/common/findAllElements"
import parseThemeValue from "~/common/parseThemeValue"
import * as tw from "~/common/token"
import { Tailwind } from "~/tailwind"
import type { Cache, ServiceOptions } from "."

export function provideColorDecorations(
	document: TextDocument,
	state: Tailwind,
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
			const result = findAllElements({
				input: value,
				separator: state.separator,
			})
			cachedResult[value] = result
		}

		const { elementList } = cachedResult[value]
		const twin = kind === PatternKind.Twin

		for (const c of elementList) {
			switch (c.kind) {
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
