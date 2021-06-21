import { createToken, createTokenList, Token } from "./token"
import * as nodes from "./twNodes"

/** Try to find right bracket from left bracket, return `undefind` if not found. */
export function findRightBracket({
	text,
	start = 0,
	end = text.length,
	brackets = ["(", ")"],
}: {
	text: string
	start?: number
	end?: number
	/** brackets, default is `["(", ")"]` */
	brackets?: [string, string]
}): number | undefined {
	let stack = 0
	const [lbrac, rbrac] = brackets
	let comment = 0
	let string = 0

	for (let i = start; i < end; i++) {
		if (text[i] === lbrac) {
			if (string === 0 && comment === 0) {
				stack++
			}
		} else if (text[i] === rbrac) {
			if (string === 0 && comment === 0) {
				if (stack === 1) {
					return i
				}
				if (stack < 1) {
					return undefined
				}
				stack--
			}
		}

		if (comment === 0) {
			if (string === 0) {
				if (text.slice(i, i + 2) === "//") {
					comment = 1
				} else if (text.slice(i, i + 2) === "/*") {
					comment = 2
				}
			}
		} else if (comment === 1 && text[i] === "\n") {
			comment = 0
		} else if (comment === 2 && text.slice(i, i + 2) === "*/") {
			comment = 0
			i += 1
		}

		if (string === 0) {
			if (comment === 0) {
				if (text[i] === '"') {
					string = 1
				} else if (text[i] === "'") {
					string = 2
				}
			}
		} else if (string === 1 && text[i] === '"') {
			string = 0
		} else if (string === 2 && text[i] === "'") {
			string = 0
		}
	}
	return undefined
}

export function tokenize({
	text,
	start = 0,
	end = text.length,
	separator = ":",
	breac = false,
}: {
	text: string
	start?: number
	end?: number
	separator?: string
	breac?: number | false
}) {
	const isSpace = (c: string) => /^\s$/.exec(c) != null
	const char = (i: number) => text[i]
	const next = (i: number) => text[i + 1]
	const isTerminal = (c: string) => {
		if (isSpace(c)) {
			return 1
		}
		if (text.slice(i, i + 2) === "//") {
			return 2
		}
		if (text.slice(i, i + 2) === "/*") {
			return 2
		}
		return false
	}

	const tokens: Token[] = []
	const ret = () => createTokenList(tokens)
	const resp = (a: number, b: number, t: string) => {
		tokens.push(createToken(a, b, t))
		if (typeof breac === "number" && breac <= b) {
			return true
		}
		return false
	}
	let i = start
	let b = i
	while (i < end) {
		const c = char(i)
		if (isTerminal(c)) {
			if (b < i) {
				if (resp(b, i, text.slice(b, i))) {
					return ret()
				}
			}
			b = i + 1
		}

		if (c === "/") {
			if (next(i) === "/") {
				i += 2
				for (let c: string; (c = text[i]), i < end && c != undefined; i++) {
					if (c === "\n") {
						i += 1
						break
					}
				}
				b = i
			} else if (next(i) === "*") {
				i += 2
				for (let c: string; (c = text.slice(i, i + 2)), i < end && c != undefined; i++) {
					if (c === "*/") {
						i = i + 2
						break
					}
				}
				b = i
			} else {
				i = i + 1
			}
		} else if (c === "(") {
			let j = i
			if (char(j - 1) === "!") {
				j--
			}
			if (text.slice(j - separator.length, j) !== separator) {
				if (b < j) {
					if (resp(b, j, text.slice(b, j))) {
						return ret()
					}
				}
				i = j
				b = j
			}

			const rb = findRightBracket({ text, start: i, end })
			if (rb) {
				i = rb + 1
				if (char(i) === "!") {
					i = i + 1
				}
			} else {
				i = end
			}

			if (resp(b, i, text.slice(b, i))) {
				return ret()
			}
			b = i
		} else if (c === "[") {
			const rb = findRightBracket({ text, start: i, end, brackets: ["[", "]"] })
			if (rb) {
				i = rb + 1
				if (char(i) === "!") {
					i = i + 1
				}
			} else {
				i = end
			}
			if (resp(b, i, text.slice(b, i))) {
				return ret()
			}
			b = i
		} else {
			i = i + 1
		}
	}

	if (b < i) {
		resp(b, i, text.slice(b, i))
	}

	return ret()
}

export function parse({
	text,
	start = 0,
	end = text.length,
	separator = ":",
	breac = false,
}: {
	text: string
	start?: number
	end?: number
	separator?: string
	breac?: number | false
}):
	| nodes.DeclarationNode
	| nodes.VariantSpanNode
	| nodes.GroupNode
	| nodes.ClassNameNode
	| nodes.CssPropertyNode
	| nodes.ArbitraryStyleNode {
	const _separator = separator.replace(/[/\\^$+?.()|[\]{}]/g, "\\$&")
	const bracRegexp = new RegExp(`^([^${"\\(\\)\\[\\]\\!" + _separator}]+)\\[`)
	const transform = (
		token: Token,
	):
		| nodes.VariantSpanNode
		| nodes.GroupNode
		| nodes.ClassNameNode
		| nodes.CssPropertyNode
		| nodes.ArbitraryStyleNode => {
		// Variant
		let index: number
		if (((index = token.value.indexOf(separator)), index != -1)) {
			const _variant = token.value.slice(0, index)
			const value = token.value.slice(0, index + separator.length)

			return nodes.createVariantSpanNode({
				token,
				variant: nodes.createVariantNode({
					token: createToken(token.start, token.start + value.length, value),
					child: nodes.createIdentifierNode(
						createToken(token.start, token.start + _variant.length, _variant),
					),
					sep: nodes.createSeparatorNode(
						createToken(
							token.start + _variant.length,
							token.start + value.length,
							text.slice(token.start + _variant.length, token.start + value.length),
						),
					),
				}),
				child: transform(createToken(token.start + value.length, token.end, token.value.slice(value.length))),
			})
		}

		let [start, end] = token
		let exclamationLeft: nodes.IdentifierNode | undefined
		if (text[start] === "!") {
			exclamationLeft = nodes.createIdentifierNode(createToken(start, start + 1, "!"))
			start += 1
		}

		if (text[start] === "(") {
			const rb = findRightBracket({ text, start, end })

			start += 1

			let exclamationRight: nodes.IdentifierNode | undefined
			if (rb != undefined && text[end - 1] === "!") {
				exclamationRight = nodes.createIdentifierNode(createToken(end - 1, end, "!"))
				end -= 1
			}

			if (text[end - 1] === ")") {
				end -= 1
			}

			return nodes.createGroupNode({
				token,
				exclamationLeft,
				exclamationRight,
				closed: rb != undefined,
				child: parse({ text, separator, start, end, breac }),
			})
		}

		const match = bracRegexp.exec(text.slice(start, end))
		if (match) {
			const [, _prop] = match
			const prop = createToken(start, start + _prop.length, _prop)
			const rb = findRightBracket({ text, start: start + _prop.length, end, brackets: ["[", "]"] })
			let exclamationRight: nodes.IdentifierNode | undefined
			if (rb != undefined && text[end - 1] === "!") {
				exclamationRight = nodes.createIdentifierNode(createToken(end - 1, end, "!"))
				end -= 1
			}

			const content_end = rb ? rb : end
			const content = createToken(prop.end + 1, content_end, text.slice(prop.end + 1, content_end))

			if (_prop.endsWith("-")) {
				return nodes.createArbitraryStyleNode({
					token,
					closed: rb != undefined,
					exclamationLeft,
					exclamationRight,
					prop: nodes.createArbitraryStylePropNode(prop),
					content: nodes.createCssValueNode(content),
					child: nodes.createIdentifierNode(createToken(start, token.end, token.value)),
				})
			}

			return nodes.createCssPropertyNode({
				token,
				closed: rb != undefined,
				exclamationLeft,
				exclamationRight,
				prop: nodes.createCssPropertyPropNode(prop),
				content: nodes.createCssValueNode(content),
				child: nodes.createIdentifierNode(createToken(start, end, text.slice(start, end))),
			})
		}

		let exclamationRight: nodes.IdentifierNode | undefined
		if (text[end - 1] === "!") {
			exclamationRight = nodes.createIdentifierNode(createToken(end - 1, end, "!"))
			end -= 1
		}

		// if (start >= end) {}

		return nodes.createClassNameNode({
			token,
			exclamationLeft,
			exclamationRight,
			child: nodes.createIdentifierNode(createToken(start, end, text.slice(start, end))),
		})
	}

	const tokens = tokenize({ text, start, end, separator, breac })

	if (tokens.length === 1) {
		return transform(tokens[0])
	}

	return nodes.createDeclarationNode({
		token: createToken(start, end, text.slice(start, end)),
		children: nodes.createNodeList(tokens.map(transform)),
	})
}
