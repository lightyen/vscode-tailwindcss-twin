import { TextDocument } from "vscode-languageserver-textdocument"
import parseClasses, { TwElementKind } from "./parseClasses"
import { Tailwind } from "~/tailwind"
import { InitOptions } from "~/twLanguageService"
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

		const isValidVariant = (variant: string) => state.classnames.isVariant(variant, kind === PatternKind.Twin)

		const getPosition = (offset: number) => document.positionAt(start + offset)

		renderClasses(isValidClass, isValidVariant, canRender, getPosition, builder, parseClasses(value))
	}
	return builder.build()
}

function renderClasses(
	isValidClass: (variants: string[], value: string) => boolean,
	isValidVariant: (variant: string) => boolean,
	canRender: (value: string) => boolean,
	getPosition: (offset: number) => lsp.Position,
	builder: lsp.SemanticTokensBuilder,
	blocks: ReturnType<typeof parseClasses>,
	context: Token[] = [],
) {
	for (const node of blocks) {
		for (const variant of node.variants) {
			if (!isValidVariant(variant[2])) {
				continue
			}
			const pos = getPosition(variant[0])
			const len = variant[1] - variant[0]
			builder.push(pos.line, pos.character, len + 1, SemanticKind.keyword, 0)
		}

		if (node.kind === TwElementKind.Group) {
			const pos = getPosition(node.lbrace)
			builder.push(pos.line, pos.character, 1, SemanticKind.variable, 0)
		}

		if (node.kind === TwElementKind.Class) {
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
		} else if (node.kind === TwElementKind.Group && node.children.length > 0) {
			renderClasses(isValidClass, isValidVariant, canRender, getPosition, builder, node.children, [
				...context,
				...node.variants,
			])
		}

		if (node.kind === TwElementKind.Group && typeof node.rbrace === "number") {
			const pos = getPosition(node.rbrace)
			builder.push(pos.line, pos.character, 1, SemanticKind.variable, 0)
		}

		if (node.kind === TwElementKind.Group || node.kind === TwElementKind.Class) {
			if (typeof node.important === "number") {
				const pos = getPosition(node.important)
				builder.push(pos.line, pos.character, 1, SemanticKind.function, 0)
			}
		}
	}
}
