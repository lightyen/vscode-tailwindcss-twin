import * as tw from "./twin"
import findRightBracket from "./findRightBracket"

export enum TwElementKind {
	Unknown,
	Class,
	Group,
	Empty,
	CssProperty,
}

export type Block = TwUnknownElement | TwEmptyElement | TwGroupElement | TwClassElement | TwCssPropertyElement

type Index = number

interface TwUnknownElement {
	kind: TwElementKind.Unknown
	variants: tw.TokenList
	value?: tw.Token
}

interface TwEmptyElement {
	kind: TwElementKind.Empty
	variants: tw.TokenList
}

interface TwGroupElement {
	kind: TwElementKind.Group
	variants: tw.TokenList
	children: Block[]
	lbrace: Index
	rbrace?: Index
	important?: Index
}

interface TwClassElement {
	kind: TwElementKind.Class
	variants: tw.TokenList
	value: tw.Token
	important?: Index
}

interface TwCssPropertyElement {
	kind: TwElementKind.CssProperty
	variants: tw.TokenList
	value: tw.Token
	important?: Index
}

function createBlock(): Block {
	return {
		kind: TwElementKind.Unknown,
		variants: tw.createTokenList(),
	}
}

function trimLeft(str: string, start = 0, end = str.length) {
	while (/\s/.test(str[start])) {
		start += 1
	}
	if (start > end) {
		start = end
	}
	return [start, end]
}

export default function parseClasses(input: string, start = 0, end = input.length): Block[] {
	if (start === end) {
		return []
	}

	;[start, end] = trimLeft(input, start, end)

	const reg = /([\w-]+):|([\w-]+\[)|([\w-./]+!?)|\(|(\S+)/g

	const result: Block[] = []
	let node = createBlock()
	let match: RegExpExecArray

	reg.lastIndex = start
	input = input.slice(0, end)
	let context = tw.createTokenList()
	while ((match = reg.exec(input))) {
		const [value, variant, cssProperty, className, notHandled] = match
		if (variant) {
			const token = tw.createToken(match.index, reg.lastIndex - 1, variant)
			context.push(token)

			if (reg.lastIndex < end) {
				while (/\s/.test(input[reg.lastIndex])) {
					node.kind = TwElementKind.Empty
					reg.lastIndex++
				}
			} else {
				node.kind = TwElementKind.Empty
			}

			if (node.kind === TwElementKind.Empty) {
				node.kind = TwElementKind.Empty
				node.variants = context
				result.push(node)
				node = createBlock()
				context = tw.createTokenList()
				continue
			}

			if (input[reg.lastIndex] === "(") {
				node.kind = TwElementKind.Group
			}

			if (node.kind === TwElementKind.Group) {
				node.children = []
				node.lbrace = reg.lastIndex
				node.variants = context
				const closedBracket = findRightBracket({ input, start: reg.lastIndex, end })

				if (typeof closedBracket !== "number") {
					node.children = parseClasses(input, reg.lastIndex + 1, end)
					result.push(node)
					return result
				}

				const important = input[closedBracket + 1] === "!"
				node.rbrace = closedBracket
				if (important) {
					node.important = closedBracket + 1
				}
				node.children = parseClasses(input, reg.lastIndex + 1, closedBracket)

				result.push(node)
				node = createBlock()
				reg.lastIndex = closedBracket + (important ? 2 : 1)
				context = tw.createTokenList()
			}
		} else if (cssProperty) {
			node.kind = TwElementKind.CssProperty
			if (node.kind === TwElementKind.CssProperty) {
				const closedBracket = findRightBracket({ input, start: reg.lastIndex - 1, end, brackets: ["[", "]"] })
				if (typeof closedBracket !== "number") {
					node.variants = context
					node.value = tw.createToken(match.index, end, input.slice(match.index, end))
					result.push(node)
					return result
				}
				const token = tw.createToken(
					match.index,
					closedBracket + 1,
					input.slice(match.index, closedBracket + 1),
				)
				const important = input[closedBracket + 1] === "!"
				if (important) {
					node.important = closedBracket + 1
				}
				node.variants = context
				node.value = token
				result.push(node)
				node = createBlock()
				context = tw.createTokenList()
				reg.lastIndex = closedBracket + (important ? 2 : 1)
			}
		} else if (className) {
			node.kind = TwElementKind.Class
			if (node.kind === TwElementKind.Class) {
				const token = tw.createToken(match.index, reg.lastIndex, value)
				const important = value.endsWith("!")
				if (important) {
					token.end -= 1
					node.important = token.end
					token.text = token.text.slice(0, -1)
				}
				node.variants = context
				node.value = token
				result.push(node)
				node = createBlock()
				context = tw.createTokenList()
			}
		} else if (notHandled) {
			node.kind = TwElementKind.Unknown
			if (node.kind === TwElementKind.Unknown) {
				const weirdToken = tw.createToken(match.index, reg.lastIndex, value)
				node.variants = context.slice()
				node.value = weirdToken
				result.push(node)
				node = createBlock()
				context = tw.createTokenList()
			}
		} else {
			node.kind = TwElementKind.Group
			if (node.kind === TwElementKind.Group) {
				node.lbrace = match.index
				const closedBracket = findRightBracket({ input, start: match.index, end })

				if (typeof closedBracket !== "number") {
					node.children = parseClasses(input, match.index + 1, end)
					result.push(node)
					return result
				}

				const important = input[closedBracket + 1] === "!"
				node.rbrace = closedBracket
				if (important) {
					node.important = closedBracket + 1
				}
				node.children = parseClasses(input, match.index + 1, closedBracket)

				result.push(node)
				node = createBlock()
				reg.lastIndex = closedBracket + (important ? 2 : 1)
			}
		}
	}
	return result
}

export function format(blocks: ReturnType<typeof parseClasses>): string {
	const results: string[] = []
	for (const block of blocks) {
		let out = ""
		for (const v of block.variants) {
			out += v.text + ":"
		}
		switch (block.kind) {
			case TwElementKind.Group:
				out += `(${format(block.children)})` + (typeof block.important === "number" ? "!" : "")
				break
			case TwElementKind.Class:
				out += block.value.text + (typeof block.important === "number" ? "!" : "")
				break
			case TwElementKind.Unknown:
				out += block.value.text
				break
		}
		out && results.push(out)
	}
	return results.join(" ")
}
