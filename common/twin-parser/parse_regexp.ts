import { createToken, Token } from "./token"
import * as nodes from "./twNodes"

// "-" 45
// "[" 91
// "]" 93
// " " 32
// "/" 47
// "*" 42
// "(" 40
// ")" 41
// "!" 33
// '"' 34
// "'" 39

/** Try to find right bracket from left bracket, return `undefind` if not found. */
export function findRightBracket({
	text,
	start = 0,
	end = text.length,
	brackets = [40, 41],
}: {
	text: string
	start?: number
	end?: number
	brackets?: [number, number]
}): number | undefined {
	let stack = 0
	const [lbrac, rbrac] = brackets
	let comment = 0
	let string = 0
	let url = 0

	for (let i = start; i < end; i++) {
		const char = text.charCodeAt(i)
		if (char === lbrac) {
			if (string === 0 && comment === 0) {
				stack++
			}
		} else if (char === rbrac) {
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

		if (string === 0 && comment === 0) {
			if (url === 0 && char === 117 && /\W/.test(text[i - 1] || " ")) {
				url = 1
			} else if (url === 1 && char === 114) {
				url = 2
			} else if (url === 2 && char === 108) {
				url = 3
			} else if (url < 3 || (url === 3 && char === 41)) {
				url = 0
			}
		}

		if (url < 3 && comment === 0) {
			if (string === 0) {
				if (char === 47 && text.charCodeAt(i + 1) === 47) {
					comment = 1
				} else if (char === 47 && text.charCodeAt(i + 1) === 42) {
					comment = 2
				}
			}
		} else if (comment === 1 && char === 10) {
			comment = 0
		} else if (comment === 2 && char === 42 && text.charCodeAt(i + 1) === 47) {
			comment = 0
			i += 1
		}

		if (string === 0) {
			if (comment === 0) {
				if (char === 34) {
					string = 1
				} else if (char === 39) {
					string = 2
				}
			}
		} else if (string === 1 && char === 34) {
			string = 0
		} else if (string === 2 && char === 39) {
			string = 0
		}
	}
	return undefined
}

function findRightBlockComment(text: string, start = 0, end = text.length): number | undefined {
	for (let i = start + 2; i < end; i++) {
		if (text.charCodeAt(i) === 42 && text.charCodeAt(i + 1) === 47) {
			return i + 1
		}
	}
	return undefined
}

function isSpace(char: number) {
	switch (char) {
		case 32:
		case 12:
		case 10:
		case 13:
		case 9:
		case 11:
			return true
		default:
			return false
	}
}

function findTerminal(text: string, start = 0, end = text.length, sep = ":"): number {
	let state = 0
	let stack = 0
	let _stack = 0
	for (let i = start; i < end; i++) {
		const char = text.charCodeAt(i)
		switch (state) {
			case 0:
				if (isSpace(char)) return i
				if (char === 40) {
					let isSep = true
					for (let k = 0; k < sep.length; k++) {
						if (sep[k] !== text[i - k - 1]) {
							isSep = false
							break
						}
					}
					if (isSep) {
						state = 5
						_stack += 1
					} else {
						return i
					}
				}
				if (char === 91) {
					state = 1
					stack += 1
				}
				break
			case 1:
				switch (char) {
					case 91:
						stack += 1
						break
					case 93:
						stack -= 1
						if (stack <= 0) {
							state = 4
						}
						break
					case 39:
						state = 2
						break
					case 34:
						state = 3
						break
				}
				break
			case 2:
				if (char === 39) state = 1
				break
			case 3:
				if (char === 34) state = 1
				break
			case 4:
				if (isSpace(char)) return i
				if (char === 33) return i + 1
				return i
			case 5:
				if (char === 40) {
					_stack += 1
				} else if (char === 41) {
					_stack -= 1
					if (_stack <= 0) {
						state = 4
					}
				}
				break
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
		`(\\/\\/[^\\n]*\\n?)|(\\/\\*)|([\\w-]+${_separator})|(!?(?!\\/)(?:(?!\\/\\/{1,2})[\\w-/])+)\\[|(!?(?:(?!\\/\\/|\\/\\*)[\\w-./])+)!?|(!?\\()|(\\S+)`,
		"gs",
	)

	let match: RegExpExecArray | null
	regexp.lastIndex = start
	text = text.slice(0, end)

	while ((match = regexp.exec(text))) {
		const [, , blockComment, variant, arbitrary, classnames, group, others] = match
		let exclamationLeft: nodes.IdentifierNode | undefined
		start = match.index

		if (text.charCodeAt(start) === 33) {
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

			if (text.charCodeAt(start) === 33) {
				exclamationLeft = nodes.createIdentifierNode(createToken(start, start + 1, "!"))
				start += 1
			}

			if (text.charCodeAt(start) === 40) {
				const rb = findRightBracket({ text, start, end })
				const _a = start
				start += 1
				let exclamationRight: nodes.IdentifierNode | undefined
				if (rb != undefined) {
					regexp.lastIndex = rb + 1
					if (text.charCodeAt(rb + 1) === 33) {
						exclamationRight = nodes.createIdentifierNode(createToken(rb + 1, rb + 2, "!"))
						regexp.lastIndex += 1
					}
				} else {
					regexp.lastIndex = end
				}

				const _end = rb != undefined ? rb : end
				const _b = rb != undefined ? rb + 1 : end

				children.push(
					nodes.createVariantSpanNode({
						token: createToken(match.index, regexp.lastIndex, text.slice(match.index, regexp.lastIndex)),
						variant: variantNode,
						child: nodes.createGroupNode({
							token: createToken(_a, _b, text.slice(_a, _b)),
							child: parse({ text, start, end: _end }),
							exclamationLeft,
							exclamationRight,
							closed: rb != undefined,
						}),
					}),
				)
			} else {
				const _end = findTerminal(text, match.index + variant.length, end, separator)
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
			if (text.charCodeAt(regexp.lastIndex - 1) === 33) {
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
			const prop = createToken(
				start,
				match.index + arbitrary.length,
				text.slice(start, match.index + arbitrary.length),
			)
			const isArbitraryStyle1 = prop.value.endsWith("-") // text-[], text-[]/opacity, text-[]/[]
			const isArbitraryStyle2 = prop.value.endsWith("/") // ~~text-color/opacity~~, ~~text-color/[]~~
			const rb = findRightBracket({ text, start: regexp.lastIndex - 1, end, brackets: [91, 93] })
			let content: Token | undefined
			let ident: Token
			let endOpacity: { value: nodes.IdentifierNode; closed?: boolean } | undefined
			let exclamationRight: nodes.IdentifierNode | undefined
			if (rb != undefined) {
				content = createToken(regexp.lastIndex, rb, text.slice(regexp.lastIndex, rb))
				regexp.lastIndex = rb + 1
				if (text.charCodeAt(regexp.lastIndex) === 47) {
					if (isArbitraryStyle1) {
						regexp.lastIndex += 1
						if (text.charCodeAt(regexp.lastIndex) === 91) {
							const rb = findRightBracket({
								text,
								start: regexp.lastIndex,
								end,
								brackets: [91, 93],
							})
							if (rb != undefined) {
								endOpacity = {
									value: nodes.createIdentifierNode(
										createToken(regexp.lastIndex + 1, rb, text.slice(regexp.lastIndex + 1, rb)),
									),
									closed: true,
								}
								regexp.lastIndex = rb + 1
							} else {
								endOpacity = {
									value: nodes.createIdentifierNode(
										createToken(regexp.lastIndex + 1, end, text.slice(regexp.lastIndex + 1, end)),
									),
									closed: false,
								}
								regexp.lastIndex = end
							}
						} else {
							const withOpacityRegexp = /^\d+/
							const match = withOpacityRegexp.exec(text.slice(regexp.lastIndex))
							if (match) {
								endOpacity = {
									value: nodes.createIdentifierNode(
										createToken(regexp.lastIndex, regexp.lastIndex + match[0].length, match[0]),
									),
								}
								regexp.lastIndex += match[0].length
							} else {
								regexp.lastIndex -= 1
							}
						}
					}
				}

				ident = createToken(start, regexp.lastIndex, text.slice(start, regexp.lastIndex))

				if (text.charCodeAt(regexp.lastIndex) === 33) {
					exclamationRight = nodes.createIdentifierNode(
						createToken(regexp.lastIndex, regexp.lastIndex + 1, "!"),
					)
					regexp.lastIndex += 1
				}
			} else {
				content = createToken(regexp.lastIndex, end, text.slice(regexp.lastIndex, end))
				ident = createToken(start, end, text.slice(start, end))
				regexp.lastIndex = end
			}

			const token = createToken(match.index, regexp.lastIndex, text.slice(match.index, regexp.lastIndex))

			if (isArbitraryStyle1 || isArbitraryStyle2) {
				children.push(
					nodes.createArbitraryStyleNode({
						token,
						closed: rb != undefined,
						prop: nodes.createArbitraryStylePropNode(prop),
						content: content ? nodes.createCssValueNode(content) : undefined,
						exclamationLeft,
						exclamationRight,
						child: nodes.createIdentifierNode(ident),
						endOpacity,
					}),
				)
			} else if (content) {
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
				if (text.charCodeAt(rb + 1) === 33) {
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
