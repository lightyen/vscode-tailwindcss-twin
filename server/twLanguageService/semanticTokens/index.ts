import { TextDocument } from "vscode-languageserver-textdocument"
import parseClasses from "./parseClasses"
import { Tailwind } from "~/tailwind"
import { InitOptions } from ".."
import * as lsp from "vscode-languageserver"
import { findAllMatch, PatternKind } from "~/ast"
import { Token } from "~/typings"

// https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide#semantic-token-classification

enum SemanticKind {
	keyword,
	number,
	interface,
	variable,
	function,
	enumMember,
}

export function provideSemanticTokens(
	document: TextDocument,
	state: Tailwind,
	{ colorDecorators }: InitOptions,
): lsp.SemanticTokens {
	const builder = new lsp.SemanticTokensBuilder()
	const tokens = findAllMatch(document)

	const canRender = (value: string) => {
		if (!colorDecorators) return true
		const color = state.classnames.getColorInfo(value)
		if (!color) return true
		if (!color.backgroundColor && !color.color) return true
		return false
	}

	for (const { token, kind } of tokens) {
		const [start, , value] = token
		if (kind === PatternKind.TwinTheme) {
			continue
		}

		const isValidClass = (variants: string[], value: string) =>
			state.classnames.isClassName(variants, kind === PatternKind.Twin, value)

		const getPosition = (offset: number) => document.positionAt(start + offset)

		renderClasses(isValidClass, canRender, getPosition, builder, parseClasses(value))
	}
	return builder.build()
}

function renderClasses(
	isValidClass: (variants: string[], value: string) => boolean,
	canRender: (value: string) => boolean,
	getPosition: (offset: number) => lsp.Position,
	builder: lsp.SemanticTokensBuilder,
	nodes: ReturnType<typeof parseClasses>,
	context: Token[] = [],
) {
	for (const node of nodes) {
		for (const v of node.variants) {
			const pos = getPosition(v[0])
			const len = v[1] - v[0]
			builder.push(pos.line, pos.character, len + 1, SemanticKind.keyword, 0)
		}

		if (node.lbrace) {
			const pos = getPosition(node.lbrace)
			builder.push(pos.line, pos.character, 1, SemanticKind.variable, 0)
		}

		if (node.value) {
			if (
				isValidClass(
					[...context, ...node.variants].map(v => v[2]),
					node.value[2],
				)
			) {
				if (canRender(node.value[2])) {
					const pos = getPosition(node.value[0])
					builder.push(pos.line, pos.character, node.value[1] - node.value[0], SemanticKind.number, 0)
				}
			}
		} else if (node.children.length > 0) {
			renderClasses(isValidClass, canRender, getPosition, builder, node.children, [...context, ...node.variants])
		}

		if (node.rbrace) {
			const pos = getPosition(node.rbrace)
			builder.push(pos.line, pos.character, 1, SemanticKind.variable, 0)
		}
		if (node.important) {
			const pos = getPosition(node.important)
			builder.push(pos.line, pos.character, 1, SemanticKind.function, 0)
		}
	}
}
