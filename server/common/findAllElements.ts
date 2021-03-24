import findRightBlockComment from "./findRightBlockComment"
import findRightBracket from "./findRightBracket"
import * as tw from "./token"

function trimLeft(str: string, start = 0, end = str.length): [number, number] {
	while (/\s/.test(str[start])) {
		start += 1
	}
	if (start > end) {
		start = end
	}
	return [start, end]
}

interface Result {
	elementList: tw.TwinElementList
	emptyList: tw.EmptyList
	error?: tw.Error
}

function zero(): Result {
	return {
		elementList: tw.createTwinElementList(),
		emptyList: tw.createEmptyList(),
	}
}

function merge(a: Result, b: Result): Result {
	return {
		elementList: tw.createTwinElementList([...a.elementList, ...b.elementList]),
		emptyList: tw.createEmptyList([...a.emptyList, ...b.emptyList]),
		error: a.error ?? b.error,
	}
}

export default function findAllElements({
	input,
	start = 0,
	end = input.length,
	context = tw.createTokenList(),
	importantContext = false,
	separator = ":",
}: {
	/** user input */
	input: string
	start?: number
	end?: number
	/** variants */
	context?: tw.TokenList
	/** is important group? */
	importantContext?: boolean
	/** separator.
	 * @default `:`
	 */
	separator?: string
}): Result {
	if (start === end) {
		return zero()
	}

	;[start, end] = trimLeft(input, start, end)

	const reg = /(\/\/[^\n]*\n?)|(\/\*)|([\w-]+):|([\w-]+)\[|((?:(?!\/\/|\/\*)[\w-./])+!?)|\(|(\S+)/gs

	let result: Result = zero()
	let match: RegExpExecArray

	reg.lastIndex = start
	input = input.slice(0, end)
	const baseContext = context.slice()
	while ((match = reg.exec(input))) {
		const [value, lineComment, blockComment, variant, cssProperty, className, notHandled] = match
		if (variant) {
			const variantToken = tw.createToken(match.index, reg.lastIndex - 1, variant)
			context.push(variantToken)

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
				const index = match.index + value.length
				result.emptyList.push({
					kind: tw.EmptyKind.Classname,
					start: index,
					variants: context.slice(),
				})
				context = baseContext.slice()
				continue
			}

			if (input[reg.lastIndex] === "(") {
				const closedBracket = findRightBracket({ input, start: reg.lastIndex, end })
				if (typeof closedBracket !== "number") {
					result.error = {
						message: `except to find a ')' to match the '('`,
						start: reg.lastIndex,
						end,
					}
					const children = findAllElements({
						input: input,
						context: context.slice(),
						importantContext: false,
						start: reg.lastIndex + 1,
						end,
						separator,
					})
					result = merge(result, children)
					return result
				}
				const important = input[closedBracket + 1] === "!"
				const children = findAllElements({
					input: input,
					context: context.slice(),
					importantContext: importantContext || important,
					start: reg.lastIndex + 1,
					end: closedBracket,
					separator,
				})

				if (children.elementList.length === 0) {
					result.emptyList.push({
						kind: tw.EmptyKind.Group,
						start: reg.lastIndex,
						end: closedBracket + 1,
						variants: context.slice(),
						important,
					})
				}

				result = merge(result, children)

				reg.lastIndex = closedBracket + (important ? 2 : 1)
				context = baseContext.slice()
			}
		} else if (cssProperty) {
			const closedBracket = findRightBracket({ input, start: reg.lastIndex - 1, end, brackets: ["[", "]"] })
			if (typeof closedBracket !== "number") {
				result.error = {
					message: `except to find a ']' to match the '['`,
					start: reg.lastIndex - 1,
					end,
				}
				result.elementList.push({
					kind: tw.TokenKind.CssProperty,
					variants: context.slice(),
					token: tw.createToken(match.index, end, input.slice(match.index, end)),
					prop: tw.createToken(match.index, match.index + cssProperty.length, cssProperty),
					value: tw.createToken(reg.lastIndex, end, input.slice(reg.lastIndex, end)),
					important: importantContext,
				})
				return result
			}

			const important = input[closedBracket + 1] === "!"
			const token = tw.createToken(match.index, closedBracket + 1, input.slice(match.index, closedBracket + 1))

			const prop = tw.createToken(match.index, match.index + cssProperty.length, cssProperty)
			const value = tw.createToken(reg.lastIndex, closedBracket, input.slice(reg.lastIndex, closedBracket))
			result.elementList.push({
				kind: tw.TokenKind.CssProperty,
				variants: context.slice(),
				token,
				prop,
				value,
				important: important || importantContext,
			})

			if (value.text.trim() === "") {
				result.emptyList.push({
					kind: tw.EmptyKind.CssProperty,
					prop,
					start: reg.lastIndex - 1,
					end: closedBracket + 1,
					variants: context.slice(),
					important,
				})
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

			result.elementList.push({
				kind: tw.TokenKind.ClassName,
				variants: context.slice(),
				token,
				important: important || importantContext,
			})

			context = baseContext.slice()
		} else if (notHandled) {
			const token = tw.createToken(match.index, reg.lastIndex, value)

			result.elementList.push({
				kind: tw.TokenKind.Unknown,
				variants: context.slice(),
				token,
				important: false, // always false
			})

			context = baseContext.slice()
		} else if (lineComment) {
			//
		} else if (blockComment) {
			const closeComment = findRightBlockComment(input, match.index)
			if (typeof closeComment !== "number") {
				result.error = {
					message: `except to find a "*/" to match the "/*"`,
					start: match.index,
					end,
				}
				return result
			}

			const tokenEnd = closeComment + 1
			reg.lastIndex = tokenEnd
		} else {
			const closedBracket = findRightBracket({ input, start: match.index, end })
			if (typeof closedBracket !== "number") {
				result.error = {
					message: `except to find a ')' to match the '('`,
					start: match.index,
					end,
				}
				const children = findAllElements({
					input: input,
					context: context.slice(),
					importantContext: false,
					start: reg.lastIndex + 1,
					end,
					separator,
				})
				result = merge(result, children)
				return result
			}

			const important = input[closedBracket + 1] === "!"
			const innerResult = findAllElements({
				input: input,
				context: context.slice(),
				importantContext: importantContext || important,
				start: match.index + 1,
				end: closedBracket,
				separator,
			})
			if (innerResult.elementList.length === 0) {
				result.emptyList.push({
					kind: tw.EmptyKind.Group,
					start: match.index,
					end: closedBracket + 1,
					variants: context.slice(),
					important,
				})
			}
			result = merge(result, innerResult)

			reg.lastIndex = closedBracket + (important ? 2 : 1)
		}
	}

	return result
}
