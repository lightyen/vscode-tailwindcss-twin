import * as lsp from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import { getScriptKind, findToken } from "~/ast"
import ts from "typescript"
import { InitOptions } from ".."

export function canHover(document: TextDocument, position: lsp.Position, { twin }: InitOptions) {
	const scriptKind = getScriptKind(document.languageId)
	if (!scriptKind) {
		return undefined
	}
	const source = ts.createSourceFile("", document.getText(), ts.ScriptTarget.Latest, false, scriptKind)
	const token = findToken(source, document.offsetAt(position), twin, true)
	if (!token) {
		return undefined
	}
	return token
}
