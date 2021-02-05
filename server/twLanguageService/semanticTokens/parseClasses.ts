import { Token } from "~/common/types"

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
	variants: Token[]
	value?: Token
}

interface TwEmptyElement {
	kind: TwElementKind.Empty
	variants: Token[]
}

interface TwGroupElement {
	kind: TwElementKind.Group
	variants: Token[]
	children: Block[]
	lbrace: Index
	rbrace?: Index
	important?: Index
}

interface TwClassElement {
	kind: TwElementKind.Class
	variants: Token[]
	value: Token
	important?: Index
}

interface TwCssPropertyElement {
	kind: TwElementKind.CssProperty
	variants: Token[]
	value: Token
	important?: Index
}

function createBlock(): Block {
	return {
		kind: TwElementKind.Unknown,
		variants: [],
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

function findRightBracket({
	input,
	start,
	end,
	brackets = ["(", ")"],
}: {
	input: string
	start: number
	end: number
	brackets?: [string, string]
}): number {
	let stack = 0
	for (let i = start; i < end; i++) {
		if (input[i] === brackets[0]) {
			stack += 1
		} else if (input[i] === brackets[1]) {
			if (stack === 0) {
				return undefined
			}
			if (stack === 1) {
				return i
			}
			stack -= 1
		}
	}
	return undefined
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
	let context: Token[] = []
	while ((match = reg.exec(input))) {
		const [value, variant, cssProperty, className, notHandled] = match
		if (variant) {
			const token: Token = [match.index, reg.lastIndex - 1, variant]
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
				context = []
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
				context = []
			}
		} else if (cssProperty) {
			node.kind = TwElementKind.CssProperty
			if (node.kind === TwElementKind.CssProperty) {
				const closedBracket = findRightBracket({ input, start: reg.lastIndex - 1, end, brackets: ["[", "]"] })
				if (typeof closedBracket !== "number") {
					node.variants = context
					node.value = [match.index, end, input.slice(match.index, end)]
					result.push(node)
					return result
				}
				const token: Token = [match.index, closedBracket + 1, input.slice(match.index, closedBracket + 1)]
				const important = input[closedBracket + 1] === "!"
				if (important) {
					node.important = closedBracket + 1
				}
				node.variants = context
				node.value = token
				result.push(node)
				node = createBlock()
				context = []
				reg.lastIndex = closedBracket + (important ? 2 : 1)
			}
		} else if (className) {
			node.kind = TwElementKind.Class
			if (node.kind === TwElementKind.Class) {
				const token: Token = [match.index, reg.lastIndex, value]
				const important = value.indexOf("!")
				if (important !== -1) {
					token[1] -= 1
					node.important = token[1]
					token[2] = token[2].slice(0, token[2].length - 1)
				}
				node.variants = context
				node.value = token
				result.push(node)
				node = createBlock()
				context = []
			}
		} else if (notHandled) {
			node.kind = TwElementKind.Unknown
			if (node.kind === TwElementKind.Unknown) {
				const weirdToken: Token = [match.index, reg.lastIndex, value]
				node.variants = [...context]
				node.value = weirdToken
				result.push(node)
				node = createBlock()
				context = []
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
			out += v[2] + ":"
		}
		switch (block.kind) {
			case TwElementKind.Group:
				out += `(${format(block.children)})` + (typeof block.important === "number" ? "!" : "")
				break
			case TwElementKind.Class:
				out += block.value[2] + (typeof block.important === "number" ? "!" : "")
				break
			case TwElementKind.Unknown:
				out += block.value[2]
				break
		}
		out && results.push(out)
	}
	return results.join(" ")
}
