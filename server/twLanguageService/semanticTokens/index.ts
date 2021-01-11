import { TextDocument } from "vscode-languageserver-textdocument"
import findClasses from "~/findClasses"
import { Tailwind } from "~/tailwind"
import { InitOptions } from ".."
import * as lsp from "vscode-languageserver"
import { findAllMatch, PatternKind } from "~/ast"

enum SemanticKind {
	comment,
	string,
	keyword,
	type,
	enumMember,
	function,
	property,
	macro,
}

export function provideSemanticTokens(document: TextDocument, state: Tailwind, _: InitOptions): lsp.SemanticTokens {
	const builder = new lsp.SemanticTokensBuilder()
	const tokens = findAllMatch(document)
	for (const { token, kind } of tokens) {
		const [start, , value] = token
		const twin = kind === PatternKind.Twin
		if (kind === PatternKind.TwinTheme) {
			continue
		}
		const { classList } = findClasses({
			input: value,
			separator: state.separator,
		})
		for (const c of classList) {
			if (
				!state.classnames.isClassName(
					c.variants.map(v => v[2]),
					twin,
					c.token[2],
				)
			) {
				continue
			}
			// for (const v of c.variants) {
			// 	const pos = document.positionAt(start + v[0])
			// 	builder.push(pos.line, pos.character, v[1] - v[0], SemanticKind.macro, null)
			// }

			const color = state.classnames.getColorInfo(c.token[2])
			const pos = document.positionAt(start + c.token[0])
			if (!color || (!color.backgroundColor && !color.color)) {
				builder.push(pos.line, pos.character, c.token[1] - c.token[0], SemanticKind.enumMember, null)
			}
		}
	}
	return builder.build()
}
