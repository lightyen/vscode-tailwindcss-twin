import * as extractColors from "@/extractColors"
import { ExtractedToken, ExtractedTokenKind, TextDocument } from "@/extractors"
import { defaultLogger as console } from "@/logger"
import { transformSourceMap } from "@/sourcemap"
import * as parser from "@/twin-parser"
import * as vscode from "vscode"
import { ServiceOptions } from "."
import { TailwindLoader } from "./tailwind"

export default function documentColors(
	tokens: ExtractedToken[],
	document: TextDocument,
	state: TailwindLoader,
	options: ServiceOptions,
): vscode.ProviderResult<vscode.ColorInformation[]> {
	if (tokens.length === 0) return []
	const colorInformations: vscode.ColorInformation[] = []
	const start = process.hrtime.bigint()
	doDocumentColors(tokens)
	const end = process.hrtime.bigint()
	console.trace(`documentColors (${Number((end - start) / 10n ** 6n)}ms)`)
	return colorInformations

	function doDocumentColors(tokens: ExtractedToken[]) {
		try {
			for (const { token, kind } of tokens) {
				const [offset, , value] = token
				if (kind === ExtractedTokenKind.TwinTheme || kind === ExtractedTokenKind.TwinScreen) continue
				const { items } = parser.spread({ text: value, separator: state.separator })
				for (const { content } of items) {
					if (content) {
						const colorTokens = extractColors.default(content.value)
						for (const t of colorTokens) {
							if (extractColors.isColorHexValue(t)) {
								const color = extractColors.colorFromHex(t)
								colorInformations.push({
									color,
									range: new vscode.Range(
										document.positionAt(offset + content.start + t.raw.start),
										document.positionAt(offset + content.start + t.raw.end),
									),
								})
							} else if (extractColors.isColorIdentifier(t)) {
								const color = extractColors.colorFromIdentifier(t)
								colorInformations.push({
									color,
									range: new vscode.Range(
										document.positionAt(offset + content.start + t.raw.start),
										document.positionAt(offset + content.start + t.raw.end),
									),
								})
							} else if (extractColors.isColorFunction(t)) {
								const color = extractColors.colorFromFunction(t)
								if (color) {
									colorInformations.push({
										color,
										range: new vscode.Range(
											document.positionAt(offset + content.start + t.raw.start),
											document.positionAt(offset + content.start + t.raw.end),
										),
									})
								}
							}
						}
					}
				}
			}
		} catch (error) {
			const err = error as Error
			if (err.stack) err.stack = transformSourceMap(options.serverSourceMapUri.fsPath, err.stack)
			console.error(err)
			console.error("do document colors failed.")
		}
	}
}
