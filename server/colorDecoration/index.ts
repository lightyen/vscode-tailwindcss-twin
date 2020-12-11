import { Connection } from "vscode-languageserver"
import { connection, documents } from "~/server"
import { findMatch, getPatterns } from "~/patterns"
import { Range } from "vscode-languageserver-textdocument"
import { findClasses } from "~/find"
import { settings } from "~/server"
import { getSeparator, getColors } from "~/common"
import { state } from "~/tailwind"

interface ColorInformation {
	range: Range
	color: string
}

export const documentColor: Parameters<Connection["onDocumentColor"]>[0] = async params => {
	if (!settings.colorDecorators) {
		return null
	}
	if (!state) {
		return null
	}
	const { textDocument } = params
	const document = documents.get(textDocument.uri)
	const patterns = getPatterns({ document })
	const text = document.getText()
	const colors: ColorInformation[] = []
	const colorTable = getColors()
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
					separator: getSeparator(),
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
	connection.sendNotification("tailwindcss/documentColors", { colors })
	return null
}

export default documentColor
