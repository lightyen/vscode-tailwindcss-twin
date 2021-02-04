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

export default function findClasses({
	input,
	start = 0,
	end = input.length,
	position,
	context = [],
	importantContext = false,
	separator = ":",
	completion = false,
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
	separator?: string
	completion?: boolean
}): Result {
	if (start === end) {
		return {
			important: importantContext,
			variants: context,
		}
	}

	;[start, end] = trimLeft(input, start, end)

	const reg = new RegExp(`([\\w-]+)${separator}|([\\w-]+)\\[|([\\w-./]+!?)|\\(|(\\S+)`, "g")

	let match: RegExpExecArray

	reg.lastIndex = start
	input = input.slice(0, end)
	const baseContext = [...context]

	while ((match = reg.exec(input))) {
		const [value, variant, cssProperty, className, notHandled] = match
		if (variant) {
			const token: tw.Token = [match.index, reg.lastIndex - separator.length, variant]
			context.push(token)

			if (position >= token[0] && position < token[1]) {
				return {
					token: {
						kind: tw.TokenKind.Variant,
						token,
					},
					variants: context,
					important: importantContext,
				}
			} else if (position === reg.lastIndex) {
				break
			}

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
				const closedBracket = findRightBracket({ input, start: reg.lastIndex, end })
				const hasRightBracket = typeof closedBracket === "number"
				const important = hasRightBracket && input[closedBracket + 1] === "!"

				if (hasRightBracket) {
					if (position > reg.lastIndex && position < closedBracket) {
						return findClasses({
							input,
							context: [...context],
							importantContext: important || importantContext,
							start: reg.lastIndex + 1,
							end: closedBracket,
							position,
							separator,
							completion,
						})
					} else if (completion && position === closedBracket) {
						return findClasses({
							input,
							context: [...context],
							importantContext: important || importantContext,
							start: reg.lastIndex + 1,
							end: closedBracket,
							position,
							separator,
							completion,
						})
					}
				} else {
					return findClasses({
						input,
						context: [...context],
						importantContext: important || importantContext,
						start: reg.lastIndex + 1,
						position,
						separator,
						completion,
					})
				}

				reg.lastIndex = closedBracket + (important ? 2 : 1)
				context = [...baseContext]
			}
		} else if (cssProperty) {
			const closedBracket = findRightBracket({ input, start: reg.lastIndex - 1, end, brackets: ["[", "]"] })
			if (typeof closedBracket !== "number") {
				return {
					token: {
						kind: tw.TokenKind.Unknown,
						token: [match.index, reg.lastIndex, input.slice(match.index, reg.lastIndex)],
					},
					important: importantContext,
					variants: context,
				}
			}
			const important = input[closedBracket + 1] === "!"
			const token: tw.Token = [match.index, closedBracket + 1, input.slice(match.index, closedBracket + 1)]

			if (position >= token[0] && (completion ? position <= token[1] : position < token[1])) {
				return {
					token: {
						kind: tw.TokenKind.CssProperty,
						token,
						key: [match.index, match.index + cssProperty.length, cssProperty],
						value: [reg.lastIndex, closedBracket, input.slice(reg.lastIndex, closedBracket)],
					},
					variants: context,
					important: important || importantContext,
				}
			}

			reg.lastIndex = closedBracket + (important ? 2 : 1)
			context = baseContext
		} else if (className) {
			const token: tw.Token = [match.index, reg.lastIndex, value]
			const important = value.endsWith("!")
			if (position >= token[0] && (completion ? position <= token[1] : position < token[1])) {
				if (important) {
					token[1] -= 1
					token[2] = token[2].slice(0, -1)
				}

				return {
					token: {
						kind: tw.TokenKind.ClassName,
						token,
					},
					variants: context,
					important: important || importantContext,
				}
			}

			context = [...baseContext]
		} else if (notHandled) {
			const token: tw.Token = [match.index, reg.lastIndex, value]
			if (position >= token[0] && (completion ? position <= token[1] : position < token[1])) {
				return {
					token: {
						token,
						kind: tw.TokenKind.Unknown,
					},
					important: importantContext,
					variants: context,
				}
			}
		} else {
			const closedBracket = findRightBracket({ input, start: match.index, end })
			const hasRightBracket = typeof closedBracket === "number"
			const important = hasRightBracket && input[closedBracket + 1] === "!"

			if (hasRightBracket) {
				if (position > reg.lastIndex && position < closedBracket) {
					return findClasses({
						input,
						context: [...context],
						importantContext: important || importantContext,
						start: reg.lastIndex + 1,
						end: closedBracket,
						position,
						separator,
						completion,
					})
				} else if (completion && position === closedBracket) {
					return findClasses({
						input,
						context: [...context],
						importantContext: important || importantContext,
						start: reg.lastIndex + 1,
						end: closedBracket,
						position,
						separator,
						completion,
					})
				}
			} else {
				return findClasses({
					input,
					context: [...context],
					importantContext: important || importantContext,
					start: reg.lastIndex + 1,
					position,
					separator,
					completion,
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
