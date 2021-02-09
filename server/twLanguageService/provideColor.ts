import { TextDocument } from "vscode-languageserver-textdocument"
import chroma from "chroma-js"
import { ColorInformation } from "~/LanguageService"
import { Tailwind } from "~/tailwind"
import { InitOptions, Cache } from "."
import { findAllMatch, PatternKind } from "~/common/ast"
import { TokenKind } from "~/common/types"
import findAllClasses from "~/common/findAllClasses"
import parseThemeValue from "~/common/parseThemeValue"

export default function provideColor(document: TextDocument, state: Tailwind, _: InitOptions, cache: Cache) {
	const colors: ColorInformation[] = []
	const cachedResult = cache[document.uri.toString()]
	const tokens = findAllMatch(document)
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
			const result = findAllClasses({
				input: value,
				separator: state.separator,
			})
			cachedResult[value] = result
		}

		const { classList } = cachedResult[value]

		for (const c of classList) {
			if (c.kind !== TokenKind.ClassName) {
				continue
			}
			if (
				!state.classnames.isClassName(
					c.variants.map(v => v[2]),
					twin,
					c.token[2],
				)
			) {
				continue
			}
			const color = state.classnames.getColorInfo(c.token[2])
			if (color) {
				colors.push({
					range: {
						start: document.positionAt(start + c.token[0]),
						end: document.positionAt(start + c.token[1]),
					},
					...color,
				})
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
