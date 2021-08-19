import { createToken, Token } from "./token"
import * as nodes from "./twNodes"

/** Try to find right bracket from left bracket, return `undefind` if not found. */
function findRightBracket({
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

function findRightBlockComment(text: string, start = 0, end = text.length): number | undefined {
	for (let i = start + 2; i < end; i++) {
		if (text.slice(i, i + 2) === "*/") {
			return i + 1
		}
	}
	return undefined
}

function findTerminal(text: string, start = 0, end = text.length): number {
	let state = 0
	for (let i = start; i < end; i++) {
		const char = text[i]
		switch (state) {
			case 0:
				if (/\s/.test(char)) return i
				if (char === "(") return i
				if (char === "[") state = 1
				break
			case 1:
				switch (char) {
					case "]":
						state = 4
						break
					case "'":
						state = 2
						break
					case '"':
						state = 3
						break
				}
				break
			case 2:
				if (char === "'") state = 1
				break
			case 3:
				if (char === '"') state = 1
				break
			case 4:
				if (/\s/.test(char)) return i
				if (char === "!") return i + 1
				return i
		}
	}
	return end
}

type ItemNode =
	| nodes.VariantSpanNode
	| nodes.GroupNode
	| nodes.CssPropertyNode
	| nodes.ArbitraryStyleNode
	| nodes.ClassNameNode

export function parse({
	text,
	start = 0,
	end = text.length,
	separator = ":",
	breac = Infinity,
}: {
	text: string
	start?: number
	end?: number
	separator?: string
	breac?: number
}): nodes.DeclarationNode | ItemNode {
	const children: ItemNode[] = []
	const decl = createToken(start, end, text.slice(start, end))
	const _separator = separator.replace(/[/\\^$+?.()|[\]{}]/g, "\\$&")
	const regexp = new RegExp(
		`(\\/\\/[^\\n]*\\n?)|(\\/\\*)|([\\w-]+${_separator})|(!?[\\w-/]+)\\[|((?:(?!\\/\\/|\\/\\*)!?[\\w-./])+)!?|(!?\\()|(\\S+)`,
		"gs",
	)

	let match: RegExpExecArray | null
	regexp.lastIndex = start
	text = text.slice(0, end)

	while ((match = regexp.exec(text))) {
		const [, , blockComment, variant, arbitrary, classnames, group, others] = match
		let exclamationLeft: nodes.IdentifierNode | undefined
		start = match.index

		if (text[start] === "!") {
			exclamationLeft = nodes.createIdentifierNode(createToken(start, start + 1, "!"))
			start += 1
		}

		if (variant) {
			start += variant.length

			const variantNode = nodes.createVariantNode({
				token: createToken(match.index, start, variant),
				child: nodes.createIdentifierNode(
					createToken(
						match.index,
						start - separator.length,
						text.slice(match.index, start - separator.length),
					),
				),
				sep: nodes.createSeparatorNode(
					createToken(start - separator.length, start, text.slice(start - separator.length, start)),
				),
			})

			if (text[start] === "!") {
				exclamationLeft = nodes.createIdentifierNode(createToken(start, start + 1, "!"))
				start += 1
			}

			if (text[start] === "(") {
				const rb = findRightBracket({ text, start, end })
				start += 1
				let exclamationRight: nodes.IdentifierNode | undefined
				if (rb != undefined) {
					regexp.lastIndex = rb + 1
					if (text[rb + 1] === "!") {
						exclamationRight = nodes.createIdentifierNode(createToken(rb + 1, rb + 2, "!"))
						regexp.lastIndex += 1
					}
				} else {
					regexp.lastIndex = end
				}

				const _end = rb != undefined ? rb : end
				const inner = createToken(match.index, _end, text.slice(match.index, _end))

				children.push(
					nodes.createVariantSpanNode({
						token: createToken(match.index, regexp.lastIndex, text.slice(match.index, regexp.lastIndex)),
						variant: variantNode,
						child: nodes.createGroupNode({
							token: inner,
							child: parse({ text, start, end: _end }),
							exclamationLeft,
							exclamationRight,
							closed: rb != undefined,
						}),
					}),
				)
			} else {
				const _end = findTerminal(text, match.index + variant.length, end)
				const node = parse({ text, start: match.index + variant.length, end: _end })

				if (node.kind !== nodes.NodeKind.Declaration) {
					children.push(
						nodes.createVariantSpanNode({
							token: createToken(match.index, _end, text.slice(match.index, _end)),
							variant: variantNode,
							child: node,
						}),
					)
				} else {
					// empty
					children.push(
						nodes.createVariantSpanNode({
							token: createToken(
								match.index,
								regexp.lastIndex,
								text.slice(match.index, regexp.lastIndex),
							),
							variant: variantNode,
							child: undefined,
						}),
					)
				}

				regexp.lastIndex = _end
			}
		} else if (classnames) {
			let exclamationRight: nodes.IdentifierNode | undefined
			let _end = regexp.lastIndex
			if (text[regexp.lastIndex - 1] === "!") {
				exclamationRight = nodes.createIdentifierNode(createToken(regexp.lastIndex - 1, regexp.lastIndex, "!"))
				_end -= 1
			}

			children.push(
				nodes.createClassNameNode({
					token: createToken(match.index, regexp.lastIndex, text.slice(match.index, regexp.lastIndex)),
					exclamationLeft,
					exclamationRight,
					child: nodes.createIdentifierNode(createToken(start, _end, text.slice(start, _end))),
				}),
			)
		} else if (arbitrary) {
			const rb = findRightBracket({ text, start: regexp.lastIndex - 1, end, brackets: ["[", "]"] })
			let content: Token
			let ident: Token
			let exclamationRight: nodes.IdentifierNode | undefined
			if (rb != undefined) {
				content = createToken(regexp.lastIndex, rb, text.slice(regexp.lastIndex, rb))
				ident = createToken(start, rb + 1, text.slice(start, rb + 1))
				regexp.lastIndex = rb + 1
				if (text[rb + 1] === "!") {
					exclamationRight = nodes.createIdentifierNode(createToken(rb + 1, rb + 2, "!"))
					regexp.lastIndex += 1
				}
			} else {
				content = createToken(regexp.lastIndex, end, text.slice(regexp.lastIndex, end))
				ident = createToken(start, end, text.slice(start, end))
				regexp.lastIndex = end
			}

			const token = createToken(match.index, regexp.lastIndex, text.slice(match.index, regexp.lastIndex))
			const prop = createToken(
				start,
				match.index + arbitrary.length,
				text.slice(start, match.index + arbitrary.length),
			)

			if (/(-|\/)$/.test(prop.value)) {
				children.push(
					nodes.createArbitraryStyleNode({
						token,
						closed: rb != undefined,
						prop: nodes.createArbitraryStylePropNode(prop),
						content: nodes.createCssValueNode(content),
						exclamationLeft,
						exclamationRight,
						child: nodes.createIdentifierNode(ident),
					}),
				)
			} else {
				children.push(
					nodes.createCssPropertyNode({
						token,
						closed: rb != undefined,
						prop: nodes.createCssPropertyPropNode(prop),
						content: nodes.createCssValueNode(content),
						exclamationLeft,
						exclamationRight,
						child: nodes.createIdentifierNode(ident),
					}),
				)
			}
		} else if (blockComment) {
			const closeComment = findRightBlockComment(text, match.index)
			if (closeComment != undefined) {
				regexp.lastIndex = closeComment + 1
			} else {
				regexp.lastIndex = end
			}
		} else if (group) {
			let exclamationRight: nodes.IdentifierNode | undefined
			const rb = findRightBracket({ text, start, end })
			if (rb != undefined) {
				regexp.lastIndex = rb + 1
				if (text[rb + 1] === "!") {
					exclamationRight = nodes.createIdentifierNode(createToken(rb + 1, rb + 2, "!"))
					regexp.lastIndex += 1
				}
			} else {
				regexp.lastIndex = end
			}

			const _end = rb != undefined ? rb : end

			children.push(
				nodes.createGroupNode({
					token: createToken(match.index, regexp.lastIndex, text.slice(match.index, regexp.lastIndex)),
					closed: rb != undefined,
					child: parse({ text, start: start + 1, end: _end }),
					exclamationLeft,
					exclamationRight,
				}),
			)
		} else if (others) {
			children.push(
				nodes.createClassNameNode({
					token: createToken(match.index, regexp.lastIndex, text.slice(match.index, regexp.lastIndex)),
					child: nodes.createIdentifierNode(
						createToken(match.index, regexp.lastIndex, text.slice(match.index, regexp.lastIndex)),
					),
				}),
			)
		}

		if (regexp.lastIndex > breac) {
			break
		}
	}

	if (children.length === 1) {
		return children[0]
	}

	return nodes.createDeclarationNode({
		token: decl,
		children: nodes.createNodeList(children),
	})
}
