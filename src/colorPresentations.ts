import * as vscode from "vscode"

function toTwoDigitHex(n: number): string {
	const r = n.toString(16)
	return r.length !== 2 ? "0" + r : r
}

function hslFromColor(rgba: vscode.Color) {
	const r = rgba.red
	const g = rgba.green
	const b = rgba.blue
	const a = rgba.alpha

	const max = Math.max(r, g, b)
	const min = Math.min(r, g, b)
	let h = 0
	let s = 0
	const l = (min + max) / 2
	const chroma = max - min

	if (chroma > 0) {
		s = Math.min(l <= 0.5 ? chroma / (2 * l) : chroma / (2 - 2 * l), 1)

		switch (max) {
			case r:
				h = (g - b) / chroma + (g < b ? 6 : 0)
				break
			case g:
				h = (b - r) / chroma + 2
				break
			case b:
				h = (r - g) / chroma + 4
				break
		}

		h *= 60
		h = Math.round(h)
	}
	return { h, s, l, a }
}

export const provideColorPresentations: vscode.DocumentColorProvider["provideColorPresentations"] = (
	color,
	{ document, range },
) => {
	const result: vscode.ColorPresentation[] = []
	const level4 = document.getText(range).indexOf(",") === -1
	const red256 = Math.round(color.red * 255),
		green256 = Math.round(color.green * 255),
		blue256 = Math.round(color.blue * 255)

	let label: string
	if (color.alpha === 1) {
		label = `rgb(${[red256, green256, blue256].join(level4 ? " " : ", ")})`
	} else if (level4) {
		label = `rgba(${[red256, green256, blue256].join(" ")} / ${color.alpha})`
	} else {
		label = `rgba(${red256}, ${green256}, ${blue256}, ${color.alpha})`
	}
	result.push({ label: label, textEdit: vscode.TextEdit.replace(range, label) })

	if (color.alpha === 1) {
		label = `#${toTwoDigitHex(red256)}${toTwoDigitHex(green256)}${toTwoDigitHex(blue256)}`
	} else {
		label = `#${toTwoDigitHex(red256)}${toTwoDigitHex(green256)}${toTwoDigitHex(blue256)}${toTwoDigitHex(
			Math.round(color.alpha * 255),
		)}`
	}
	result.push({ label: label, textEdit: vscode.TextEdit.replace(range, label) })

	const hsl = hslFromColor(color)
	if (hsl.a === 1) {
		label = `hsl(${[hsl.h, Math.round(hsl.s * 100) + "%", Math.round(hsl.l * 100) + "%"].join(
			level4 ? " " : ", ",
		)})`
	} else if (level4) {
		label = `hsla(${hsl.h} ${Math.round(hsl.s * 100)}% ${Math.round(hsl.l * 100)}% / ${hsl.a})`
	} else {
		label = `hsla(${hsl.h}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%, ${hsl.a})`
	}
	result.push({ label: label, textEdit: vscode.TextEdit.replace(range, label) })

	return result
}
