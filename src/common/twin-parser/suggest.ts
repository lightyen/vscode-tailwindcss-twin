import { parse } from "./parse_regexp"
import { createTokenList, Token, TokenList } from "./token"
import * as nodes from "./twNodes"

export interface SuggestionResult {
	target?: nodes.Node | undefined
	word?: Token
	type?: SuggestResultType | undefined
	variants: TokenList
	inComment: boolean
}

export enum SuggestResultType {
	Unknown,
	Variant,
	ClassName,
	CssProperty,
	ArbitraryStyle,
	ArbitraryVariant,
}

function suggestResultType(node: nodes.Node) {
	switch (node.kind) {
		case nodes.NodeKind.Variant:
			return SuggestResultType.Variant
		case nodes.NodeKind.ArbitraryVariant:
			return SuggestResultType.ArbitraryVariant
		case nodes.NodeKind.ClassName:
			return SuggestResultType.ClassName
		case nodes.NodeKind.CssProperty:
			return SuggestResultType.CssProperty
		case nodes.NodeKind.ArbitraryStyle:
			return SuggestResultType.ArbitraryStyle
		default:
			return SuggestResultType.Unknown
	}
}

export function suggest({
	position,
	text,
	start = 0,
	end = text.length,
	separator = ":",
}: {
	position: number
	text: string
	start?: number
	end?: number
	separator?: string
}): SuggestionResult {
	interface Context {
		variants: TokenList
	}

	interface TravelResult {
		target?: nodes.Node
		type?: SuggestResultType
		variants: TokenList
	}

	const result = travel(parse({ text, start, end, separator, breac: position }), { variants: createTokenList() })

	if (result == undefined) {
		return {
			variants: createTokenList(),
			inComment: inComment({ position, text, start, end }),
		}
	}

	return {
		...result,
		word: result.target?.getWord(position),
		inComment: inComment({ position, text, start, end }),
	}

	function inComment({
		position,
		text,
		start = 0,
		end = text.length,
	}: {
		position: number
		text: string
		start?: number
		end?: number
	}): boolean {
		const reg = /(")|(')|(\/\/[^\n]*(?:\n|$))|((?:\/\*).*?(?:\*\/|$))/gs
		let match: RegExpExecArray | null
		reg.lastIndex = start
		text = text.slice(0, end)
		let isStringLeterial: false | '"' | "'" = false
		while ((match = reg.exec(text))) {
			const [, doubleQuote, singleQuote, lineComment, blockComment] = match
			if (doubleQuote) {
				if (!isStringLeterial) {
					isStringLeterial = '"'
				} else {
					isStringLeterial = false
				}
			} else if (singleQuote) {
				if (!isStringLeterial) {
					isStringLeterial = "'"
				} else {
					isStringLeterial = false
				}
			} else if (!isStringLeterial && (lineComment || blockComment)) {
				if (position >= match.index && position <= reg.lastIndex) {
					return true
				}
			}
		}

		return false
	}

	function inRange(node: nodes.Node) {
		return position >= node.start && position <= node.end
	}

	function travel(node: nodes.Node, ctx: Context): TravelResult | undefined {
		if (node == undefined) {
			return undefined
		}

		if (nodes.isDeclaration(node)) {
			const c = node.children.find(child => inRange(child))
			if (c) {
				return walk(c)
			}

			return { ...ctx }
		}

		if (inRange(node)) {
			return walk(node)
		}

		return { ...ctx }

		function walk(node: nodes.Node) {
			if (nodes.isVariantSpan(node)) {
				const variants = ctx.variants.slice()
				if (inRange(node.variant)) {
					if (position === node.variant.end) variants.push(node.variant.child)
					return { target: node.variant.child, type: suggestResultType(node.variant), variants }
				}
				variants.push(node.variant.child)
				return travel(node.child, { ...ctx, variants })
			}

			if (nodes.isGroup(node)) {
				if (node.prefix && inRange(node.prefix)) {
					return { target: node.prefix, type: suggestResultType(node.prefix), variants: ctx.variants }
				}
				return travel(node.child, { ...ctx })
			}

			if (nodes.isCssProperty(node) || nodes.isArbitraryStyle(node)) {
				return { target: node, type: suggestResultType(node), variants: ctx.variants }
			}

			if (nodes.isClassName(node)) {
				return { target: node.child, type: suggestResultType(node), variants: ctx.variants }
			}

			return undefined
		}
	}
}
