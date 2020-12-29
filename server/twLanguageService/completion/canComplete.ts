import * as lsp from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import { getPatterns, canMatch, PatternKind } from "~/patterns"

export default function canComplete(document: TextDocument, position: lsp.Position, twinEnabled: boolean) {
	const patterns = getPatterns(document.languageId, twinEnabled)
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
		return {
			pattern,
			index,
			match,
		}
	}
	return null
}

import ts from "typescript"

export function getKind(languageId: string) {
	switch (languageId) {
		case "typescript":
			return ts.ScriptKind.TS
		case "javascript":
			return ts.ScriptKind.JS
		case "typescriptreact":
			return ts.ScriptKind.TSX
		case "javascriptreact":
			return ts.ScriptKind.JSX
		default:
			return undefined
	}
}

import type { Token } from "~/typings"

export function canComplete2(
	source: string,
	position: number,
	kind: ts.ScriptKind,
): { token: Token; kind: PatternKind } {
	const sourceFile = ts.createSourceFile("", source, ts.ScriptTarget.Latest, false, kind)
	const result = findNode(sourceFile, sourceFile, position)
	if (!result) {
		return undefined
	}
	if (ts.isStringLiteral(result.node) || ts.isNoSubstitutionTemplateLiteral(result.node)) {
		// unquote
		return {
			token: [result.node.getStart(sourceFile) + 1, result.node.getEnd() - 1, result.node.text],
			kind: result.kind,
		}
	}
	return undefined
}

export function findNode(source: ts.SourceFile, node: ts.Node, position: number): { node: ts.Node; kind: PatternKind } {
	if (position < node.getStart(source) || position >= node.getEnd()) {
		return undefined
	}
	if (ts.isJsxAttribute(node)) {
		let n = node.getFirstToken(source)
		if (!ts.isIdentifier(node.getFirstToken(source))) {
			return undefined
		}
		const propName = n.getText(source)
		if (propName !== "tw" && propName !== "className") {
			return undefined
		}
		n = node.getLastToken(source)
		if (position < n.getStart(source) + 1 || position >= n.getEnd()) {
			return undefined
		}
		if (ts.isStringLiteral(n)) {
			if (propName === "tw") {
				return propName === "tw" ? { node: n, kind: "twin" } : { node: n, kind: "jsx" }
			}
		}
		return undefined
	} else if (ts.isTaggedTemplateExpression(node)) {
		const tagName = node.getFirstToken(source).getText(source)
		if (tagName !== "tw" && tagName !== "theme") {
			return undefined
		}
		const n = node.getLastToken(source)
		if (position < n.getStart(source) + 1 || position >= n.getEnd()) {
			return undefined
		}
		if (ts.isNoSubstitutionTemplateLiteral(n)) {
			return { node: n, kind: tagName === "tw" ? "twin" : "twinTheme" }
		}
		return undefined
	}
	return node.forEachChild(n => findNode(source, n, position))
}
