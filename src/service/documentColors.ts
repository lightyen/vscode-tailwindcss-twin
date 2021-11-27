import {
	colorFromFunction,
	colorFromHex,
	colorFromIdentifier,
	colorFromTransparent,
	isColorFunction,
	isColorHexValue,
	isColorIdentifier,
	isColorTransparent,
	parse as parseColors,
} from "@/color"
import { ExtractedToken, ExtractedTokenKind, TextDocument } from "@/extractors"
import { defaultLogger as console } from "@/logger"
import * as parser from "@/parser"
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
				const { items } = parser.spread({ text: token.value, separator: state.separator })
				for (const { target } of items) {
					if (
						(target.type === parser.NodeType.CssDeclaration ||
							target.type === parser.NodeType.ArbitraryClassname) &&
						target.expr
					) {
						const expr = target.expr
						const colorTokens = parseColors(expr.value)
						for (const t of colorTokens) {
							if (isColorHexValue(t)) {
								const color = colorFromHex(expr.value.slice(...t.range))
								colorInformations.push({
									color,
									range: new vscode.Range(
										document.positionAt(offset + expr.range[0] + t.range[0]),
										document.positionAt(offset + expr.range[0] + t.range[1]),
									),
								})
							} else if (isColorIdentifier(t)) {
								const color = colorFromIdentifier(expr.value, t)
								colorInformations.push({
									color,
									range: new vscode.Range(
										document.positionAt(offset + expr.range[0] + t.range[0]),
										document.positionAt(offset + expr.range[0] + t.range[1]),
									),
								})
							} else if (isColorTransparent(t)) {
								const color = colorFromTransparent()
								colorInformations.push({
									color,
									range: new vscode.Range(
										document.positionAt(offset + expr.range[0] + t.range[0]),
										document.positionAt(offset + expr.range[0] + t.range[1]),
									),
								})
							} else if (isColorFunction(t)) {
								const color = colorFromFunction(t)
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
			console.error(error)
			console.error("do document colors failed.")
		}
	}
}
