import { Token } from "~/typings"

type Index = number

export interface ParsedNode {
	lbrace?: Index
	rbrace?: Index
	important?: Index
	value?: Token
	variants: Token[]
	children: ParsedNode[]
}

function createNode(): ParsedNode {
	return {
		variants: [],
		children: [],
	}
}

const spaceReg = /\s/

function trimLeft(str: string, start = 0, end = str.length) {
	while (spaceReg.test(str[start])) {
		start += 1
	}
	if (start > end) {
		start = end
	}
	return [start, end]
}

function findRightBracket({ input, start, end }: { input: string; start: number; end: number }): number {
	let stack = 0
	for (let i = start; i < end; i++) {
		if (input[i] === "(") {
			stack += 1
		} else if (input[i] === ")") {
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

export default function parseClasses(input: string, start = 0, end = input.length): ParsedNode[] {
	if (start === end) {
		return []
	}

	;[start, end] = trimLeft(input, start, end)

	const reg = new RegExp(`([\\w-]+):|([\\w-./]+!?)|\\(|(\\S+)`, "g")

	const result: ParsedNode[] = []
	let node = createNode()
	let match: RegExpExecArray

	reg.lastIndex = start
	input = input.slice(0, end)
	let context: Token[] = []
	while ((match = reg.exec(input))) {
		const [value, variant, className, weird] = match
		if (variant) {
			const variantToken: Token = [match.index, reg.lastIndex - 1, variant]

			context.push(variantToken)

			let isEmpty = false
			if (reg.lastIndex < end) {
				while (spaceReg.test(input[reg.lastIndex])) {
					isEmpty = true
					reg.lastIndex++
				}
			} else {
				isEmpty = true
			}

			if (isEmpty) {
				node.variants = context
				result.push(node)
				node = createNode()
				context = []
				continue
			}

			if (input[reg.lastIndex] === "(") {
				node.lbrace = reg.lastIndex
				node.variants = context
				const closedBracket = findRightBracket({ input, start: reg.lastIndex, end })
				if (typeof closedBracket !== "number") {
					result.push(node)
					return result
				} else {
					node.rbrace = closedBracket

					const importantGroup = input[closedBracket + 1] === "!"
					if (importantGroup) {
						node.important = closedBracket + 1
					}

					node.children = parseClasses(input, reg.lastIndex + 1, closedBracket)
					result.push(node)
					node = createNode()
					reg.lastIndex = closedBracket + (importantGroup ? 2 : 1)
				}
				context = []
			}
		} else if (className) {
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
			node = createNode()
			context = []
		} else if (weird) {
			const weirdToken: Token = [match.index, reg.lastIndex, value]
			node.variants = [...context]
			node.value = weirdToken
			result.push(node)
			node = createNode()
		} else {
			node.lbrace = match.index
			const closedBracket = findRightBracket({ input, start: match.index, end })
			if (typeof closedBracket !== "number") {
				return result
			} else {
				node.rbrace = closedBracket
				const importantGroup = input[closedBracket + 1] === "!"
				if (importantGroup) {
					node.important = closedBracket + 1
				}

				node.children = parseClasses(input, match.index + 1, closedBracket)

				result.push(node)
				node = createNode()
				reg.lastIndex = closedBracket + (importantGroup ? 2 : 1)
			}
		}
	}

	return result
}
