import * as lsp from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import ts from "typescript"
import { getScriptKind, findToken } from "~/ast"

export default function canComplete(document: TextDocument, position: lsp.Position, twinEnabled: boolean) {
	const scriptKind = getScriptKind(document.languageId)
	if (!scriptKind) {
		return undefined
	}
	const source = ts.createSourceFile("", document.getText(), ts.ScriptTarget.Latest, false, scriptKind)
	const token = findToken(source, document.offsetAt(position), twinEnabled)
	if (!token) {
		return undefined
	}
	return token
}
