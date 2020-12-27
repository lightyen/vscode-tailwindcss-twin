import { TextDocument } from "vscode-languageserver-textdocument"
import { findMatch, getPatterns } from "~/patterns"
import { findClasses } from "~/find"
import chroma from "chroma-js"
import { ColorInformation } from "~/LanguageService"
import { Tailwind } from "~/tailwind"
import { InitOptions } from ".."

export function provideColor(document: TextDocument, state: Tailwind, initOptions: InitOptions) {
	const text = document.getText()
	const patterns = getPatterns(document.languageId, initOptions.twin)
	const colors: ColorInformation[] = []
	for (const { lpat, rpat, handleBrackets, handleImportant, kind } of patterns) {
		const twin = kind === "twin"
		findMatch({
			text,
			lpat,
			rpat,
		})
			.filter(v => v.length > 0)
			.forEach(([start, end]) => {
				const a = document.positionAt(start)
				const b = document.positionAt(end)
				const classes = document.getText({ start: a, end: b })
				if (kind === "twinTheme") {
					const color = getThemeDecoration(classes, state)
					if (color) {
						colors.push({
							range: {
								start: a,
								end: b,
							},
							backgroundColor: color,
						})
					}
					return
				}
				const { classList } = findClasses({
					classes,
					separator: state.separator,
					handleBrackets,
					handleImportant,
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
			})
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
