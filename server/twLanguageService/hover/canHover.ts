import * as lsp from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import { getPatterns, canMatch } from "~/patterns"
import { InitOptions } from ".."

export function canHover(document: TextDocument, position: lsp.Position, { twin }: InitOptions) {
	const patterns = getPatterns(document.languageId, twin)
	for (const pattern of patterns) {
		const { type, lpat, rpat } = pattern
		let range: lsp.Range
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
		const base = document.offsetAt(range.start)
		const index = offset - base
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
		return {
			base,
			index,
			offset,
			pattern,
			match,
		}
	}
	return null
}
