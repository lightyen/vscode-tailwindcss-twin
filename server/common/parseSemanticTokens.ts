import findRightBlockComment from "./findRightBlockComment"
import findRightBracket from "./findRightBracket"
import * as tw from "./twin"

export enum NodeKind {
	Unknown,
	ClassName,
	Variant,
	CssProperty,
	CssValue,
	CssBracket,
	Bracket,
	Important,
	LineComment,
	BlockComment,
}

interface UnknownNode {
	kind: NodeKind.Unknown
	token: tw.Token
	context: tw.TokenList
}

interface ClassNameNode {
	kind: NodeKind.ClassName
	token: tw.Token
	context: tw.TokenList
}

interface VariantNode {
	kind: NodeKind.Variant
	token: tw.Token
	context: tw.TokenList
}

interface CssPropertyNode {
	kind: NodeKind.CssProperty
	token: tw.Token
	context: tw.TokenList
}

interface CssValueNode {
	kind: NodeKind.CssValue
	token: tw.Token
}

interface CssBracketNode {
	kind: NodeKind.CssBracket
	token: tw.Token
}

interface BracketNode {
	kind: NodeKind.Bracket
	token: tw.Token
}

interface ImportantNode {
	kind: NodeKind.Important
	token: tw.Token
}

interface LineCommentNode {
	kind: NodeKind.LineComment
	token: tw.Token
}

interface BlockCommentNode {
	kind: NodeKind.BlockComment
	token: tw.Token
}

export type Node =
	| UnknownNode
	| ClassNameNode
	| VariantNode
	| CssPropertyNode
	| CssValueNode
	| CssBracketNode
	| BracketNode
	| ImportantNode
	| LineCommentNode
	| BlockCommentNode

function createNode(kind: NodeKind, token: tw.Token, context?: tw.TokenList): Node {
	switch (kind) {
		case NodeKind.Unknown:
		case NodeKind.Variant:
		case NodeKind.ClassName:
		case NodeKind.CssProperty:
			return { kind, token, context }
	}
	return { kind, token }
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

export class Semantic {
	text: string
	private cbNode: (node: Node) => void

	constructor(text: string) {
		this.text = text
	}

	accept(cb: (node: Node) => void) {
		this.cbNode = cb
		this.parseClasses(this.text)
	}

	private parseClasses(input: string, start = 0, end = input.length, context = tw.createTokenList()) {
		if (start === end) {
			return
		}

		;[start, end] = trimLeft(input, start, end)

		const reg = /(\/\/[^\n]*\n?)|(\/\*)|([\w-]+):|([\w-]+)\[|([\w-.]*(?!\/\/|\/\*)(?:\/)?[\w-.]+!?)|\(|(\S+)/gs
		let match: RegExpExecArray

		reg.lastIndex = start
		input = input.slice(0, end)
		const baseContext = context.slice()

		while ((match = reg.exec(input))) {
			const [value, lineComment, blockComment, variant, cssProperty, className, notHandled] = match
			if (variant) {
				this.cbNode(
					createNode(NodeKind.Variant, tw.createToken(match.index, reg.lastIndex, value), context.slice()),
				)

				context.push(tw.createToken(match.index, reg.lastIndex - 1, variant))

				let isEmpty = false
				if (reg.lastIndex < end) {
					for (let idx = reg.lastIndex; idx < end; idx++) {
						const next = input.slice(idx, idx + 2)
						if (/^\s/.test(next)) {
							isEmpty = true
							reg.lastIndex = idx
						} else if (/\/\/|\/\*/.test(next)) {
							isEmpty = true
							break
						} else {
							break
						}
					}
				} else {
					isEmpty = true
				}

				if (isEmpty) {
					context = tw.createTokenList()
					continue
				}

				if (input[reg.lastIndex] === "(") {
					this.cbNode(
						createNode(
							NodeKind.Bracket,
							tw.createToken(reg.lastIndex, reg.lastIndex + 1, input[reg.lastIndex]),
						),
					)

					const closedBracket = findRightBracket({ input, start: reg.lastIndex, end })

					if (typeof closedBracket !== "number") {
						this.parseClasses(input, reg.lastIndex + 1, end)
						return
					}

					this.parseClasses(input, reg.lastIndex + 1, closedBracket, context.slice())

					this.cbNode(
						createNode(
							NodeKind.Bracket,
							tw.createToken(closedBracket, closedBracket + 1, input[closedBracket]),
						),
					)

					const important = input[closedBracket + 1] === "!"
					if (important) {
						this.cbNode(
							createNode(
								NodeKind.Important,
								tw.createToken(closedBracket + 1, closedBracket + 2, input[closedBracket + 1]),
							),
						)
					}

					reg.lastIndex = closedBracket + (important ? 2 : 1)
					context = baseContext.slice()
				}
			} else if (cssProperty) {
				const prop = tw.createToken(match.index, match.index + cssProperty.length, cssProperty)
				this.cbNode(createNode(NodeKind.CssProperty, prop, context.slice()))

				this.cbNode(
					createNode(
						NodeKind.CssBracket,
						tw.createToken(reg.lastIndex - 1, reg.lastIndex, input.slice(reg.lastIndex - 1, reg.lastIndex)),
					),
				)

				const closedBracket = findRightBracket({
					input,
					start: reg.lastIndex - 1,
					end,
					brackets: ["[", "]"],
				})

				if (typeof closedBracket !== "number") {
					this.parseCssValue(input, reg.lastIndex, end)
					return
				}

				this.parseCssValue(input, reg.lastIndex, closedBracket)

				this.cbNode(
					createNode(
						NodeKind.CssBracket,
						tw.createToken(closedBracket, closedBracket + 1, input[closedBracket]),
					),
				)

				const important = input[closedBracket + 1] === "!"
				if (important) {
					this.cbNode(
						createNode(
							NodeKind.Important,
							tw.createToken(closedBracket + 1, closedBracket + 2, input[closedBracket + 1]),
						),
					)
				}

				reg.lastIndex = closedBracket + (important ? 2 : 1)
				context = baseContext.slice()
			} else if (className) {
				const token = tw.createToken(match.index, reg.lastIndex, value)

				const important = value.endsWith("!")
				if (important) {
					token.end -= 1
					token.text = token.text.slice(0, -1)
				}

				this.cbNode(createNode(NodeKind.ClassName, token, context.slice()))
				if (important) {
					this.cbNode(createNode(NodeKind.Important, tw.createToken(token.end, token.end + 1, "!")))
				}

				context = baseContext.slice()
			} else if (notHandled) {
				const token = tw.createToken(match.index, reg.lastIndex, value)
				this.cbNode(createNode(NodeKind.Unknown, token, context.slice()))
			} else if (lineComment) {
				const token = tw.createToken(match.index, reg.lastIndex, value)
				this.cbNode(createNode(NodeKind.LineComment, token))
			} else if (blockComment) {
				const closeComment = findRightBlockComment(input, match.index)
				if (typeof closeComment !== "number") {
					this.cbNode(
						createNode(
							NodeKind.BlockComment,
							tw.createToken(match.index, end, input.slice(match.index, end)),
						),
					)
					return
				}

				const tokenEnd = closeComment + 1
				const token = tw.createToken(match.index, tokenEnd, input.slice(match.index, tokenEnd))
				this.cbNode(createNode(NodeKind.BlockComment, token))
				reg.lastIndex = tokenEnd
			} else {
				const token = tw.createToken(match.index, reg.lastIndex, value)
				this.cbNode(createNode(NodeKind.Bracket, token))

				const closedBracket = findRightBracket({ input, start: match.index, end })

				if (typeof closedBracket !== "number") {
					this.parseClasses(input, match.index + 1, end, context.slice())
					return
				}

				this.parseClasses(input, match.index + 1, closedBracket, context.slice())

				this.cbNode(
					createNode(
						NodeKind.Bracket,
						tw.createToken(closedBracket, closedBracket + 1, input[closedBracket]),
					),
				)

				const important = input[closedBracket + 1] === "!"
				if (important) {
					this.cbNode(
						createNode(
							NodeKind.Important,
							tw.createToken(closedBracket + 1, closedBracket + 2, input[closedBracket + 1]),
						),
					)
				}

				reg.lastIndex = closedBracket + (important ? 2 : 1)
				context = baseContext.slice()
			}
		}
	}

	private parseCssValue(input: string, start = 0, end = input.length) {
		;[start, end] = trimLeft(input, start, end)
		const regex = /(\/\/[^\n]*\n?)|(\/\*.*?\*\/)|((?!(\/\/[^\n]*\n?)|(\/\*.*?\*\/)).)+/gs
		let match: RegExpExecArray
		regex.lastIndex = start
		input = input.slice(0, end)
		while ((match = regex.exec(input))) {
			const [value, lineComment, blockComment, cssValue] = match
			if (lineComment) {
				const token = tw.createToken(match.index, regex.lastIndex, value)
				this.cbNode(createNode(NodeKind.LineComment, token))
			} else if (blockComment) {
				const token = tw.createToken(match.index, regex.lastIndex, value)
				this.cbNode(createNode(NodeKind.BlockComment, token))
			} else if (cssValue) {
				const token = tw.createToken(match.index, regex.lastIndex, value)
				this.cbNode(createNode(NodeKind.CssValue, token))
			}
		}
	}
}
