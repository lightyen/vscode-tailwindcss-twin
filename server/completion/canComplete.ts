import { Range, TextDocumentPositionParams } from "vscode-languageserver"

import { documents } from "~/server"
import { getPatterns, canMatch } from "~/patterns"
import { findClasses } from "~/find"
import { getSeparator } from "~/common"

export default function canComplete({ textDocument, position }: TextDocumentPositionParams) {
	const document = documents.get(textDocument.uri)
	const patterns = getPatterns({ document })
	for (const { type, lpat, rpat, handleBrackets, handleImportant, ...rest } of patterns) {
		let range: Range
		if (type === "single") {
			range = {
				start: { line: position.line, character: 0 },
				end: { line: position.line + 1, character: 0 },
			}
		} else if (type === "multiple") {
			range = {
				start: { line: position.line - 20, character: 0 },
				end: { line: position.line + 20, character: 0 },
			}
		}
		const text = document.getText(range)

		const offset = document.offsetAt(position)
		const index = offset - document.offsetAt(range.start)
		const match = canMatch({
			text,
			lpat,
			rpat,
			index,
			type,
		})
		if (!match) {
			continue
		}
		const [start, , classes] = match
		return {
			...rest,
			...findClasses({
				classes,
				index: index - start,
				separator: getSeparator(),
				handleBrackets,
				handleImportant,
			}),
		}
	}
	return null
}
