import * as tw from "./twin"
import findRightBracket from "./findRightBracket"

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
	classList: tw.ClassList
	emptyList: tw.EmptyList
	error?: tw.Error
}

function zero(): Result {
	return {
		classList: tw.createClassList(),
		emptyList: tw.createEmptyList(),
	}
}

function merge(a: Result, b: Result): Result {
	return {
		classList: tw.createClassList([...a.classList, ...b.classList]),
		emptyList: tw.createEmptyList([...a.emptyList, ...b.emptyList]),
		error: a.error ?? b.error,
	}
}

export default function findAllClasses({
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

	const reg = new RegExp(`([\\w-]+)${separator}|([\\w-]+)\\[|([\\w-./]+!?)|\\(|(\\S+)`, "g")

	let result: Result = zero()
	let match: RegExpExecArray

	reg.lastIndex = start
	input = input.slice(0, end)
	const baseContext = context.slice()
	while ((match = reg.exec(input))) {
		const [value, variant, cssProperty, className, notHandled] = match
		if (variant) {
			const variantToken = tw.createToken(match.index, reg.lastIndex - 1, variant)
			context.push(variantToken)

			let isEmpty = false
			if (reg.lastIndex < end) {
				while (/\s/.test(input[reg.lastIndex])) {
					isEmpty = true
					reg.lastIndex++
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
					const children = findAllClasses({
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
				const children = findAllClasses({
					input: input,
					context: context.slice(),
					importantContext: importantContext || important,
					start: reg.lastIndex + 1,
					end: closedBracket,
					separator,
				})

				if (children.classList.length === 0) {
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
				result.classList.push({
					kind: tw.TokenKind.CssProperty,
					variants: context.slice(),
					token: tw.createToken(match.index, end, input.slice(match.index, end)),
					key: tw.createToken(match.index, match.index + cssProperty.length, cssProperty),
					value: tw.createToken(reg.lastIndex, end, input.slice(reg.lastIndex, end)),
					important: importantContext,
				})
				return result
			}

			const important = input[closedBracket + 1] === "!"
			const token = tw.createToken(match.index, closedBracket + 1, input.slice(match.index, closedBracket + 1))

			result.classList.push({
				kind: tw.TokenKind.CssProperty,
				variants: context.slice(),
				token,
				key: tw.createToken(match.index, match.index + cssProperty.length, cssProperty),
				value: tw.createToken(reg.lastIndex, closedBracket, input.slice(reg.lastIndex, closedBracket)),
				important: important || importantContext,
			})

			reg.lastIndex = closedBracket + (important ? 2 : 1)
			context = baseContext.slice()
		} else if (className) {
			const token = tw.createToken(match.index, reg.lastIndex, value)
			const important = value.endsWith("!")
			if (important) {
				token.end -= 1
				token.text = token.text.slice(0, -1)
			}

			result.classList.push({
				kind: tw.TokenKind.ClassName,
				variants: context.slice(),
				token,
				important: important || importantContext,
			})

			context = baseContext.slice()
		} else if (notHandled) {
			const token = tw.createToken(match.index, reg.lastIndex, value)

			result.classList.push({
				kind: tw.TokenKind.Unknown,
				variants: context.slice(),
				token,
				important: false, // always false
			})

			context = baseContext.slice()
		} else {
			const closedBracket = findRightBracket({ input, start: match.index, end })
			if (typeof closedBracket !== "number") {
				result.error = {
					message: `except to find a ')' to match the '('`,
					start: match.index,
					end,
				}
				const children = findAllClasses({
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
			const innerResult = findAllClasses({
				input: input,
				context: context.slice(),
				importantContext: importantContext || important,
				start: match.index + 1,
				end: closedBracket,
				separator,
			})
			if (innerResult.classList.length === 0) {
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
