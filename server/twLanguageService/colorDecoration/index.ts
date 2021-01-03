import { TextDocument } from "vscode-languageserver-textdocument"
import { findClasses } from "~/find"
import chroma from "chroma-js"
import { ColorInformation } from "~/LanguageService"
import { Tailwind } from "~/tailwind"
import { InitOptions } from ".."

import { findAllMatch, PatternKind } from "~/ast"

export function provideColor(document: TextDocument, state: Tailwind, _: InitOptions) {
	const colors: ColorInformation[] = []
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
		const { classList } = findClasses({
			classes: value,
			separator: state.separator,
			handleBrackets: twin,
			handleImportant: twin,
		})
		for (const c of classList) {
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
	const value = state.getTheme(text.split("."))
	if (typeof value === "string") {
		if (value === "transparent") {
			return value
		}
		try {
			const c = chroma(value)
			return c.css()
		} catch {
			return null
		}
	}
	return null
}
