import { connection } from "~/server"
import { findMatch, getPatterns } from "~/patterns"
import { Range, TextDocument } from "vscode-languageserver-textdocument"
import { findClasses } from "~/find"
import { settings } from "~/server"
import { state } from "~/tailwind"

interface ColorInformation {
	range: Range
	color?: string
	backgroundColor?: string
	borderColor?: string
}

export default function updateDocumentColor(document: TextDocument) {
	if (!settings.colorDecorators) {
		return
	}
	if (!state) {
		return
	}
	const text = document.getText()
	const patterns = getPatterns(document.languageId, settings.twin)
	const colors: ColorInformation[] = []
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
					// XXX: should let variants in?
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
	connection.sendNotification("tailwindcss/documentColors", { colors, uri: document.uri })
}
