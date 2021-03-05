import chroma from "chroma-js"
import * as lsp from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import { findAllMatch, PatternKind } from "~/common/ast"
import { Node, NodeKind, Semantic } from "~/common/parseSemanticTokens"
import parseThemeValue, { TwThemeElementKind } from "~/common/parseThemeValue"
import * as tw from "~/common/twin"
import { Tailwind } from "~/tailwind"
import type { ServiceOptions } from "~/twLanguageService"

// https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide#semantic-token-classification

enum SemanticKind {
	keyword,
	number,
	interface,
	variable,
	function,
	enumMember,
	operator,
	comment,
}

enum BlockKind {
	Variant = SemanticKind.interface,
	Classname = SemanticKind.enumMember,
	CssProperty = SemanticKind.function,
	Brackets = SemanticKind.variable,
	Important = SemanticKind.operator,
	Comment = SemanticKind.comment,
}

export default function provideSemanticTokens(
	builder: lsp.SemanticTokensBuilder,
	document: TextDocument,
	state: Tailwind,
	options: ServiceOptions,
): lsp.SemanticTokens {
	const tokens = findAllMatch(document, options.jsxPropImportChecking)

	for (const { token, kind } of tokens) {
		const [start, , value] = token

		const getPosition = (offset: number) => document.positionAt(start + offset)

		if (kind === PatternKind.TwinTheme) {
			renderThemeValue(token, getPosition, builder, state, options.colorDecorators)
			continue
		}

		const isValidClass = (variants: string[], value: string) =>
			state.classnames.isClassName(variants, kind === PatternKind.Twin, value)

		const isValidVariant = (variant: string) =>
			state.classnames.isVariant(variant, kind === PatternKind.Twin || kind === PatternKind.TwinCssProperty)

		const canRender = (node: Node) => {
			if (kind === PatternKind.TwinCssProperty) {
				return true
			}
			if (!options.colorDecorators) return true
			if (node.kind === NodeKind.ClassName) {
				const color = state.classnames.getColorInfo(node.token.text)
				if (!color || Object.keys(color).length === 0) {
					return true
				}
				if (
					(!!color.backgroundColor && color.backgroundColor !== "currentColor") ||
					(!!color.color && color.color !== "currentColor")
				) {
					return false
				}
			}
			return true
		}

		new Semantic(value).accept(node => {
			const pos = getPosition(node.token.start)
			const length = node.token.end - node.token.start
			switch (node.kind) {
				case NodeKind.ClassName:
					if (kind === PatternKind.Twin && isValidClass(node.context.texts, node.token.text)) {
						if (canRender(node)) {
							builder.push(pos.line, pos.character, length, BlockKind.Classname, 0)
						}
					}
					break
				case NodeKind.Variant:
					if (isValidVariant(node.token.text.slice(0, -1))) {
						builder.push(pos.line, pos.character, length, BlockKind.Variant, 0)
					}
					break
				case NodeKind.CssProperty:
					builder.push(pos.line, pos.character, length, BlockKind.CssProperty, 0)
					break
				case NodeKind.CssValue: {
					const end = getPosition(node.token.end)
					builder.push(pos.line, pos.character, length, BlockKind.CssProperty, 0)
					if (pos.line < end.line) {
						for (let line = pos.line + 1; line < end.line; line++) {
							builder.push(line, 0, length, BlockKind.CssProperty, 0)
						}
						builder.push(end.line, 0, end.character, BlockKind.CssProperty, 0)
					}
					break
				}
				case NodeKind.CssBracket:
					builder.push(pos.line, pos.character, length, BlockKind.CssProperty, 0)
					break
				case NodeKind.Bracket:
					builder.push(pos.line, pos.character, length, BlockKind.Brackets, 0)
					break
				case NodeKind.Important:
					builder.push(pos.line, pos.character, length, BlockKind.Important, 0)
					break
				case NodeKind.LineComment:
					builder.push(pos.line, pos.character, length, BlockKind.Comment, 0)
					break
				case NodeKind.BlockComment: {
					const end = getPosition(node.token.end)
					builder.push(pos.line, pos.character, length, BlockKind.Comment, 0)
					if (pos.line < end.line) {
						for (let line = pos.line + 1; line < end.line; line++) {
							builder.push(line, 0, length, BlockKind.Comment, 0)
						}
						builder.push(end.line, 0, end.character, BlockKind.Comment, 0)
					}
					break
				}
			}
		})
	}
	return builder.build()
}

function parseColor(value: unknown): string | undefined {
	if (typeof value === "string") {
		if (value === "transparent") {
			return value
		}
		try {
			const c = chroma(value)
			return c.css()
		} catch {
			return undefined
		}
	}
	return undefined
}

function renderThemeValue(
	token: tw.Token,
	getPosition: (offset: number) => lsp.Position,
	builder: lsp.SemanticTokensBuilder,
	state: Tailwind,
	colorDecorators: boolean,
) {
	const result = parseThemeValue(token.text)

	const value = state.getTheme(result.keys())
	const c = parseColor(value)

	if (c && colorDecorators) {
		return
	}

	for (const node of result.blocks) {
		const [a, b] = node.token
		const pos = getPosition(a)
		if (node.kind === TwThemeElementKind.Identifier || node.kind === TwThemeElementKind.BracketIdentifier) {
			builder.push(pos.line, pos.character, b - a, SemanticKind.number, 0)
		} else {
			builder.push(pos.line, pos.character, 1, SemanticKind.variable, 0)
		}
	}
}
