import { Scanner } from "vscode-css-languageservice/lib/umd/parser/cssScanner"

export function unescape(content: string) {
	const scanner = new Scanner()
	scanner.setSource(content)
	const token = scanner.scanUnquotedString()
	if (token) {
		return token.text
	}
	return content
}
