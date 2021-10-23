import * as extractColors from "@/extractColors"
import { ExtractedToken, ExtractedTokenKind, TextDocument } from "@/extractors"
import { defaultLogger as console } from "@/logger"
import * as parser from "@/parser"
import { transformSourceMap } from "@/sourcemap"
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
			for (const token of tokens) {
				const { kind, start: offset } = token
				if (kind === ExtractedTokenKind.TwinTheme || kind === ExtractedTokenKind.TwinScreen) continue
				const { items } = parser.spread({ text: token.value })
				for (const { target } of items) {
					if (
						(target.type === parser.NodeType.CssDeclaration ||
							target.type === parser.NodeType.ArbitraryClassname) &&
						target.expr
					) {
						const expr = target.expr
						const colorTokens = extractColors.default(expr.value)
						for (const t of colorTokens) {
							if (extractColors.isColorHexValue(t)) {
								const color = extractColors.colorFromHex(expr.value.slice(...t.range))
								colorInformations.push({
									color,
									range: new vscode.Range(
										document.positionAt(offset + expr.range[0] + t.range[0]),
										document.positionAt(offset + expr.range[0] + t.range[1]),
									),
								})
							} else if (extractColors.isColorIdentifier(t)) {
								const color = extractColors.colorFromIdentifier(expr.value, t)
								colorInformations.push({
									color,
									range: new vscode.Range(
										document.positionAt(offset + expr.range[0] + t.range[0]),
										document.positionAt(offset + expr.range[0] + t.range[1]),
									),
								})
							} else if (extractColors.isColorFunction(t)) {
								const color = extractColors.colorFromFunction(t)
								if (color) {
									colorInformations.push({
										color,
										range: new vscode.Range(
											document.positionAt(offset + expr.range[0] + t.range[0]),
											document.positionAt(offset + expr.range[0] + t.range[1]),
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
