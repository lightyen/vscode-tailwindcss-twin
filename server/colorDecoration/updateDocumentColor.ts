import { connection } from "~/server"
import { findMatch, getPatterns } from "~/patterns"
import { Range, TextDocument } from "vscode-languageserver-textdocument"
import { findClasses } from "~/find"
import { settings } from "~/server"
import { state } from "~/tailwind"

interface ColorInformation {
	range: Range
	color: string
}

export default function updateDocumentColor(document: TextDocument) {
	if (!settings.colorDecorators) {
		return
	}
	if (!state) {
		return
	}
	const text = document.getText()
	const patterns = getPatterns({ document })
	const colors: ColorInformation[] = []
	const colorTable = state.classnames.colors
	for (const { lpat, rpat, handleBrackets, handleImportant } of patterns) {
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
				const { classList } = findClasses({
					classes,
					separator: state.separator,
					handleBrackets,
					handleImportant,
				})
				for (const c of classList) {
					if (colorTable[c.token[2]]) {
						colors.push({
							range: {
								start: document.positionAt(start + c.token[0]),
								end: document.positionAt(start + c.token[1]),
							},
							color: colorTable[c.token[2]],
						})
					}
				}
			})
	}
	connection.sendNotification("tailwindcss/documentColors", { colors, uri: document.uri })
}
