import { TextDocument } from "vscode-languageserver-textdocument"
import findClasses from "~/findClasses"
import { Tailwind } from "~/tailwind"
import { InitOptions } from ".."
import * as lsp from "vscode-languageserver"
import { findAllMatch, PatternKind } from "~/ast"

// https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide#semantic-token-classification

enum SemanticKind {
	keyword,
	number,
}

export function provideSemanticTokens(
	document: TextDocument,
	state: Tailwind,
	{ colorDecorators }: InitOptions,
): lsp.SemanticTokens {
	const builder = new lsp.SemanticTokensBuilder()
	const tokens = findAllMatch(document)
	const table = new Set<number>()
	for (const { token, kind } of tokens) {
		const [start, , value] = token
		const twin = kind === PatternKind.Twin
		if (kind === PatternKind.TwinTheme) {
			continue
		}
		const { classList, empty } = findClasses({
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

			for (const v of c.variants) {
				if (table.has(start + v[0])) {
					continue
				}
				table.add(start + v[0])
				const pos = document.positionAt(start + v[0])
				builder.push(pos.line, pos.character, v[1] - v[0], SemanticKind.keyword, 0)
			}

			const pos = document.positionAt(start + c.token[0])
			if (colorDecorators) {
				const color = state.classnames.getColorInfo(c.token[2])
				if (!color || (!color.backgroundColor && !color.color)) {
					builder.push(pos.line, pos.character, c.token[1] - c.token[0], SemanticKind.number, 0)
				}
			} else {
				builder.push(pos.line, pos.character, c.token[1] - c.token[0], SemanticKind.number, 0)
			}
		}

		for (const [, , variants] of empty) {
			for (const v of variants) {
				if (table.has(start + v[0])) {
					continue
				}
				table.add(start + v[0])
				const pos = document.positionAt(start + v[0])
				builder.push(pos.line, pos.character, v[1] - v[0], SemanticKind.keyword, 0)
			}
		}
	}
	return builder.build()
}
