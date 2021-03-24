import findRightBlockComment from "./findRightBlockComment"
import findRightBracket from "./findRightBracket"
import * as tw from "./token"

function trimLeft(str: string, start = 0, end = str.length) {
	while (/\s/.test(str[start])) {
		start += 1
	}
	if (start > end) {
		start = end
	}
	return [start, end]
}

interface Result extends tw.Context {
	token?:
		| tw.SelectedUnknown
		| tw.SelectedClassName
		| tw.SelectedVariant
		| tw.SelectedCssProperty
		| tw.SelectedVariantsGroup
		| tw.SelectedComment
}

export function completeElement({
	input,
	start = 0,
	end = input.length,
	position,
	context = tw.createTokenList(),
	importantContext = false,
	separator = ":",
}: {
	/** user input */
	input: string
	start?: number
	end?: number
	/** cursor position */
	position: number
	/** variants */
	context?: tw.TokenList
	importantContext?: boolean
	separator?: string
}): Result {
	if (start === end) {
		return {
			important: importantContext,
			variants: context,
		}
	}

	;[start, end] = trimLeft(input, start, end)
	const reg = /(\/\/[^\n]*\n?)|(\/\*)|([\w-]+):|([\w-]+)\[|((?:(?!\/\/|\/\*)[\w-./])+!?)|\(|(\S+)/gs

	let match: RegExpExecArray | null

	reg.lastIndex = start
	input = input.slice(0, end)
	const baseContext = context.slice()

	while ((match = reg.exec(input))) {
		const [value, lineComment, blockComment, variant, cssProperty, className, notHandled] = match
		if (variant) {
			const token = tw.createToken(match.index, reg.lastIndex - separator.length, variant)

			if (position >= match.index && position <= reg.lastIndex) {
				if (position === reg.lastIndex) {
					context.push(token)
				}
				return {
					token: {
						kind: tw.TokenKind.Variant,
						token: tw.createToken(match.index, reg.lastIndex, value),
					},
					variants: context,
					important: importantContext,
				}
			}

			context.push(token)

			let isEmpty = false
			if (reg.lastIndex < end) {
				for (let idx = reg.lastIndex; idx < end; idx++) {
					const next = input.slice(idx, idx + 2)
					if (/^\s/.test(next)) {
						if (!isEmpty && position === reg.lastIndex) {
							return {
								important: importantContext,
								variants: context,
							}
						}
						isEmpty = true
						reg.lastIndex = idx
					} else if (/\/\/|\/\*/.test(next)) {
						if (!isEmpty && position === reg.lastIndex) {
							return {
								important: importantContext,
								variants: context,
							}
						}
						isEmpty = true
						break
					} else {
						break
					}
				}
			} else {
				if (position === reg.lastIndex) {
					return {
						important: importantContext,
						variants: context,
					}
				}
				isEmpty = true
			}

			if (isEmpty) {
				context = baseContext.slice()
				continue
			}

			if (input[reg.lastIndex] === "(") {
				const closedBracket = findRightBracket({ input, start: reg.lastIndex, end })
				const important =
					(typeof closedBracket === "number" && input[closedBracket + 1] === "!") || importantContext

				if (position === reg.lastIndex) {
					importantContext = important
					break
				}

				if (typeof closedBracket === "number") {
					if (position > reg.lastIndex && position <= closedBracket) {
						return completeElement({
							input,
							context: context.slice(),
							importantContext: important,
							start: reg.lastIndex + 1,
							end: closedBracket,
							position,
							separator,
						})
					}
				} else {
					return completeElement({
						input,
						context: context.slice(),
						importantContext: important,
						start: reg.lastIndex + 1,
						position,
						separator,
					})
				}

				reg.lastIndex = closedBracket + (important ? 2 : 1)
				context = baseContext.slice()
			}
		} else if (cssProperty) {
			const closedBracket = findRightBracket({ input, start: reg.lastIndex - 1, end, brackets: ["[", "]"] })
			if (typeof closedBracket !== "number") {
				return {
					token: {
						kind: tw.TokenKind.CssProperty,
						token: tw.createToken(match.index, end, input.slice(match.index, end)),
						key: tw.createToken(match.index, match.index + cssProperty.length, cssProperty),
						value: tw.createToken(reg.lastIndex, end, input.slice(reg.lastIndex, end)),
					},
					important: importantContext,
					variants: context,
				}
			}
			const important = input[closedBracket + 1] === "!"
			const token = tw.createToken(match.index, closedBracket + 1, input.slice(match.index, closedBracket + 1))

			if (position >= token.start && position <= token.end) {
				return {
					token: {
						kind: tw.TokenKind.CssProperty,
						token,
						key: tw.createToken(match.index, match.index + cssProperty.length, cssProperty),
						value: tw.createToken(reg.lastIndex, closedBracket, input.slice(reg.lastIndex, closedBracket)),
					},
					variants: context,
					important: important || importantContext,
				}
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
			if (position >= token.start && position <= token.end) {
				return {
					token: {
						kind: tw.TokenKind.ClassName,
						token,
					},
					variants: context,
					important: important || importantContext,
				}
			}

			context = baseContext.slice()
		} else if (notHandled) {
			const token = tw.createToken(match.index, reg.lastIndex, value)
			if (position >= token.start && position <= token.end) {
				return {
					token: {
						token,
						kind: tw.TokenKind.Unknown,
					},
					important: importantContext,
					variants: context,
				}
			}
		} else if (lineComment) {
			if (position > match.index && position <= reg.lastIndex) {
				return {
					token: {
						kind: tw.TokenKind.Comment,
						token: tw.createToken(match.index, reg.lastIndex, value),
					},
					variants: context,
					important: importantContext,
				}
			}
		} else if (blockComment) {
			const closeComment = findRightBlockComment(input, match.index)
			if (typeof closeComment !== "number") {
				if (position > match.index) {
					return {
						token: {
							kind: tw.TokenKind.Comment,
							token: tw.createToken(match.index, end, value),
						},
						variants: context,
						important: importantContext,
					}
				}
				break
			}
			if (position > match.index && position <= closeComment) {
				return {
					token: {
						kind: tw.TokenKind.Comment,
						token: tw.createToken(match.index, reg.lastIndex, value),
					},
					variants: context,
					important: importantContext,
				}
			}
			const tokenEnd = closeComment + 1
			reg.lastIndex = tokenEnd
		} else {
			const closedBracket = findRightBracket({ input, start: match.index, end })
			const important = typeof closedBracket === "number" && input[closedBracket + 1] === "!"
			if (position === match.index) {
				const e = closedBracket ? closedBracket + 1 : end
				return {
					token: {
						token: tw.createToken(match.index, e, input.slice(match.index, e)),
						kind: tw.TokenKind.VariantsGroup,
					},
					important: important || importantContext,
					variants: context,
				}
			}

			if (typeof closedBracket === "number") {
				if (position >= reg.lastIndex && position <= closedBracket) {
					return completeElement({
						input,
						context: context.slice(),
						importantContext: important || importantContext,
						start: reg.lastIndex,
						end: closedBracket,
						position,
						separator,
					})
				}
			} else {
				return completeElement({
					input,
					context: context.slice(),
					importantContext: important || importantContext,
					start: reg.lastIndex,
					position,
					separator,
				})
			}

			reg.lastIndex = closedBracket + (important ? 2 : 1)
		}
	}

	return {
		important: importantContext,
		variants: context,
	}
}

export function hoverElement({
	input,
	start = 0,
	end = input.length,
	position,
	context = tw.createTokenList(),
	importantContext = false,
	separator = ":",
}: {
	/** user input */
	input: string
	start?: number
	end?: number
	/** cursor position */
	position: number
	/** variants */
	context?: tw.TokenList
	importantContext?: boolean
	separator?: string
}): Result {
	if (start === end) {
		return {
			important: importantContext,
			variants: context,
		}
	}

	;[start, end] = trimLeft(input, start, end)

	const reg = /(\/\/[^\n]*\n?)|(\/\*)|([\w-]+):|([\w-]+)\[|((?:(?!\/\/|\/\*)[\w-./])+!?)|\(|(\S+)/gs

	let match: RegExpExecArray | null

	reg.lastIndex = start
	input = input.slice(0, end)
	const baseContext = context.slice()

	while ((match = reg.exec(input))) {
		const [value, lineComment, blockComment, variant, cssProperty, className, notHandled] = match
		if (variant) {
			const token = tw.createToken(match.index, reg.lastIndex - separator.length, variant)

			if (position >= token.start && position < token.end) {
				return {
					token: {
						kind: tw.TokenKind.Variant,
						token,
					},
					variants: context,
					important: importantContext,
				}
			}

			context.push(token)

			if (position >= token.end && position < reg.lastIndex) {
				break
			}

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
				context = baseContext.slice()
				continue
			}

			if (input[reg.lastIndex] === "(") {
				const closedBracket = findRightBracket({ input, start: reg.lastIndex, end })
				const important =
					(typeof closedBracket === "number" && input[closedBracket + 1] === "!") || importantContext

				if (position === reg.lastIndex || position === closedBracket) {
					importantContext = important
					break
				}

				if (typeof closedBracket === "number") {
					if (position > reg.lastIndex && position < closedBracket) {
						return hoverElement({
							input,
							context: context.slice(),
							importantContext: important,
							start: reg.lastIndex + 1,
							end: closedBracket,
							position,
							separator,
						})
					}
				} else {
					return hoverElement({
						input,
						context: context.slice(),
						importantContext: important,
						start: reg.lastIndex + 1,
						position,
						separator,
					})
				}

				reg.lastIndex = closedBracket + (important ? 2 : 1)
				context = baseContext.slice()
			}
		} else if (cssProperty) {
			const closedBracket = findRightBracket({ input, start: reg.lastIndex - 1, end, brackets: ["[", "]"] })
			if (typeof closedBracket !== "number") {
				return {
					token: {
						kind: tw.TokenKind.CssProperty,
						token: tw.createToken(match.index, end, input.slice(match.index, end)),
						key: tw.createToken(match.index, match.index + cssProperty.length, cssProperty),
						value: tw.createToken(reg.lastIndex, end, input.slice(reg.lastIndex, end)),
					},
					important: importantContext,
					variants: context,
				}
			}
			const important = input[closedBracket + 1] === "!"
			const token = tw.createToken(match.index, closedBracket + 1, input.slice(match.index, closedBracket + 1))

			if (position >= token.start && position < token.end) {
				return {
					token: {
						kind: tw.TokenKind.CssProperty,
						token,
						key: tw.createToken(match.index, match.index + cssProperty.length, cssProperty),
						value: tw.createToken(reg.lastIndex, closedBracket, input.slice(reg.lastIndex, closedBracket)),
					},
					variants: context,
					important: important || importantContext,
				}
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
			if (position >= token.start && position < token.end) {
				return {
					token: {
						kind: tw.TokenKind.ClassName,
						token,
					},
					variants: context,
					important: important || importantContext,
				}
			}

			context = baseContext.slice()
		} else if (notHandled) {
			const token = tw.createToken(match.index, reg.lastIndex, value)
			if (position >= token.start && position < token.end) {
				return {
					token: {
						token,
						kind: tw.TokenKind.Unknown,
					},
					important: importantContext,
					variants: context,
				}
			}
		} else if (lineComment) {
			if (position > match.index && position < reg.lastIndex) {
				break
			}
		} else if (blockComment) {
			const closeComment = findRightBlockComment(input, match.index)
			if (typeof closeComment !== "number") {
				break
			}
			if (position > match.index && position < reg.lastIndex) {
				break
			}
			const tokenEnd = closeComment + 1
			reg.lastIndex = tokenEnd
		} else {
			const closedBracket = findRightBracket({ input, start: match.index, end })
			const important = typeof closedBracket === "number" && input[closedBracket + 1] === "!"

			if (position === reg.lastIndex || position === closedBracket) {
				importantContext = important
				break
			}

			if (typeof closedBracket === "number") {
				if (position > reg.lastIndex && position < closedBracket) {
					return hoverElement({
						input,
						context: context.slice(),
						importantContext: important || importantContext,
						start: reg.lastIndex,
						end: closedBracket,
						position,
						separator,
					})
				}
			} else {
				return hoverElement({
					input,
					context: context.slice(),
					importantContext: important || importantContext,
					start: reg.lastIndex,
					position,
					separator,
				})
			}

			reg.lastIndex = closedBracket + (important ? 2 : 1)
		}
	}

	return {
		important: importantContext,
		variants: context,
	}
}
