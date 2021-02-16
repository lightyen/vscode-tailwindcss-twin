import * as tw from "./twin"
import findRightBracket from "./findRightBracket"

export enum NodeType {
	Unknown,
	Class,
	Group,
	Empty,
	CssProperty,
}

export type Node = UnknownNode | EmptyNode | GroupNode | ClassNode | CssPropertyNode

type Index = number

interface UnknownNode {
	kind: NodeType.Unknown
	variants: tw.TokenList
	value?: tw.Token
}

interface EmptyNode {
	kind: NodeType.Empty
	variants: tw.TokenList
}

interface GroupNode {
	kind: NodeType.Group
	variants: tw.TokenList
	children: Node[]
	lbrace: Index
	rbrace?: Index
	important?: Index
}

interface ClassNode {
	kind: NodeType.Class
	variants: tw.TokenList
	value: tw.Token
	important?: Index
}

interface CssPropertyNode {
	kind: NodeType.CssProperty
	variants: tw.TokenList
	value: tw.Token
	important?: Index
}

function createBlock(): Node {
	return {
		kind: NodeType.Unknown,
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

export default function parseClasses(input: string, start = 0, end = input.length): Node[] {
	if (start === end) {
		return []
	}

	;[start, end] = trimLeft(input, start, end)

	const reg = /([\w-]+):|([\w-]+\[)|([\w-./]+!?)|\(|(\S+)/g

	const result: Node[] = []
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
					node.kind = NodeType.Empty
					reg.lastIndex++
				}
			} else {
				node.kind = NodeType.Empty
			}

			if (node.kind === NodeType.Empty) {
				node.kind = NodeType.Empty
				node.variants = context
				result.push(node)
				node = createBlock()
				context = tw.createTokenList()
				continue
			}

			if (input[reg.lastIndex] === "(") {
				node.kind = NodeType.Group
			}

			if (node.kind === NodeType.Group) {
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
			node.kind = NodeType.CssProperty
			if (node.kind === NodeType.CssProperty) {
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
			node.kind = NodeType.Class
			if (node.kind === NodeType.Class) {
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
			node.kind = NodeType.Unknown
			if (node.kind === NodeType.Unknown) {
				const weirdToken = tw.createToken(match.index, reg.lastIndex, value)
				node.variants = context.slice()
				node.value = weirdToken
				result.push(node)
				node = createBlock()
				context = tw.createTokenList()
			}
		} else {
			node.kind = NodeType.Group
			if (node.kind === NodeType.Group) {
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
			case NodeType.Group:
				out += `(${format(block.children)})` + (typeof block.important === "number" ? "!" : "")
				break
			case NodeType.Class:
				out += block.value.text + (typeof block.important === "number" ? "!" : "")
				break
			case NodeType.Unknown:
				out += block.value.text
				break
		}
		out && results.push(out)
	}
	return results.join(" ")
}
