import * as tw from "./types"
import findRightBracket from "./findRightBracket"

function trimLeft(str: string, start = 0, end = str.length) {
	while (/\s/.test(str[start])) {
		start += 1
	}
	if (start > end) {
		start = end
	}
	return [start, end]
}

export interface SelectedUnknown {
	kind: tw.TokenKind.Unknown
	token: tw.Token
}

export interface SelectedClassName {
	kind: tw.TokenKind.ClassName
	token: tw.Token
}

export interface SelectedVariant {
	kind: tw.TokenKind.Variant
	token: tw.Token
}

export interface SelectedCssProperty {
	kind: tw.TokenKind.CssProperty
	token: tw.Token
	key: tw.Token
	value: tw.Token
}

interface Result extends tw.Context {
	token?: SelectedUnknown | SelectedClassName | SelectedVariant | SelectedCssProperty
	/** context variants */
	variants: tw.Token[]
	/** context important */
	important: boolean
}

function zero(): Result {
	return {
		variants: [],
		important: false,
	}
}

export default function findClasses({
	input,
	start = 0,
	end = input.length,
	position,
	context = [],
	importantContext = false,
	hover = false,
	separator = ":",
}: {
	/** user input */
	input: string
	start?: number
	end?: number
	/** cursor position */
	position?: number
	/** variants */
	context?: tw.Token[]
	importantContext?: boolean
	hover?: boolean
	separator?: string
}): Result {
	if (start === end) {
		return zero()
	}

	;[start, end] = trimLeft(input, start, end)

	const reg = new RegExp(`([\\w-]+)${separator}|([\\w-]+)\\[|([\\w-./]+!?)|\\(|(\\S+)`, "g")

	const result = zero()
	let match: RegExpExecArray

	reg.lastIndex = start
	input = input.slice(0, end)
	const baseContext = [...context]

	while ((match = reg.exec(input))) {
		const [value, variant, cssProperty, className, notHandled] = match
		if (variant) {
			const token: tw.Token = [match.index, reg.lastIndex - 1, variant]
			if (position >= token[0] && position < token[1]) {
				result.token = {
					kind: tw.TokenKind.Variant,
					token,
				}
				result.variants = [...context]
				break
			} else if (!hover && position === reg.lastIndex) {
				result.variants = [...context, token]
			}

			context.push(token)

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
				context = [...baseContext]
				continue
			}

			if (input[reg.lastIndex] === "(") {
				if (!hover && position > reg.lastIndex) {
					result.variants = [...context]
				}

				const closedBracket = findRightBracket({ input, start: reg.lastIndex, end })
				if (typeof closedBracket !== "number") {
					return result
				}

				if (!hover && position > closedBracket) {
					result.variants.length = 0
				}

				const important = input[closedBracket + 1] === "!"
				result.important = important

				const children = findClasses({
					input: input,
					context: [...context],
					importantContext: important || importantContext,
					start: reg.lastIndex + 1,
					end: closedBracket,
					position,
					hover,
					separator,
				})

				if (children.token) {
					result.token = children.token
					result.important = result.important || importantContext || children.important
					result.variants = [...children.variants]
					break
				}

				reg.lastIndex = closedBracket + (important ? 2 : 1)
				context = [...baseContext]
			}
		} else if (cssProperty) {
			const closedBracket = findRightBracket({ input, start: reg.lastIndex - 1, end, brackets: ["[", "]"] })
			if (typeof closedBracket !== "number") {
				return result
			}
			const important = input[closedBracket + 1] === "!"
			const token: tw.Token = [match.index, closedBracket + 1, input.slice(match.index, closedBracket + 1)]

			if (position >= match.index && position < closedBracket + 1) {
				result.token = {
					kind: tw.TokenKind.CssProperty,
					token,
					key: [match.index, match.index + cssProperty.length, cssProperty],
					value: [reg.lastIndex, closedBracket, input.slice(reg.lastIndex, closedBracket)],
				}
				result.variants = [...context]
				result.important = important || importantContext
				break
			}

			reg.lastIndex = closedBracket + (important ? 2 : 1)
			context = baseContext
		} else if (className) {
			const token: tw.Token = [match.index, reg.lastIndex, value]
			const important = value.endsWith("!")
			if (important) {
				token[1] -= 1
				token[2] = token[2].slice(0, token[2].length - 1)
			}

			if (position >= token[0] && (hover ? position < token[1] : position <= token[1])) {
				result.token = {
					kind: tw.TokenKind.ClassName,
					token,
				}
				result.important = important || importantContext
				result.variants = [...context]
				break
			}

			context = [...baseContext]
		} else if (notHandled) {
			const token: tw.Token = [match.index, reg.lastIndex, value]
			if (position >= token[0] && (hover ? position < token[1] : position <= token[1])) {
				result.important = importantContext
				result.variants = [...context]
			}
		} else {
			const closedBracket = findRightBracket({ input, start: match.index, end })
			if (typeof closedBracket !== "number") {
				return result
			}

			const important = input[closedBracket + 1] === "!"
			result.important = important

			const children = findClasses({
				input: input,
				context: [...context],
				importantContext: important || importantContext,
				start: match.index + 1,
				end: closedBracket,
				position,
				hover,
				separator,
			})

			if (children.token) {
				result.token = children.token
				result.important = result.important || importantContext || children.important
				result.variants = [...children.variants]
				break
			}

			reg.lastIndex = closedBracket + (important ? 2 : 1)
		}
	}

	return result
}
