import * as tw from "./types"
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
	classList: Array<tw.Unknown | tw.ClassName | tw.CssProperty>
	empty: Array<tw.EmptyClass | tw.EmptyGroup>
	error?: tw.Error
}

function zero(): Result {
	return {
		classList: [],
		empty: [],
	}
}

function merge(a: Result, b: Result): Result {
	return {
		classList: [...a.classList, ...b.classList],
		empty: [...a.empty, ...b.empty],
		error: a.error ?? b.error,
	}
}

export default function findAllClasses({
	input,
	start = 0,
	end = input.length,
	context = [],
	importantContext = false,
	separator = ":",
}: {
	/** user input */
	input: string
	start?: number
	end?: number
	/** variants */
	context?: tw.Token[]
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
	const baseContext = [...context]
	while ((match = reg.exec(input))) {
		const [value, variant, cssProperty, className, notHandled] = match
		if (variant) {
			const variantToken: tw.Token = [match.index, reg.lastIndex - 1, variant]
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
				result.empty.push({
					kind: tw.EmptyKind.Classname,
					start: index,
					variants: [...context],
				})
				context = [...baseContext]
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
						context: [...context],
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
					context: [...context],
					importantContext: importantContext || important,
					start: reg.lastIndex + 1,
					end: closedBracket,
					separator,
				})

				if (children.classList.length === 0) {
					result.empty.push({
						kind: tw.EmptyKind.Group,
						start: reg.lastIndex,
						end: closedBracket + 1,
						variants: [...context],
					})
				}

				result = merge(result, children)

				reg.lastIndex = closedBracket + (important ? 2 : 1)
				context = [...baseContext]
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
					variants: [...context],
					token: [match.index, end, input.slice(match.index, end)],
					key: [match.index, match.index + cssProperty.length, cssProperty],
					value: [reg.lastIndex, end, input.slice(reg.lastIndex, end)],
					important: importantContext,
				})
				return result
			}

			const important = input[closedBracket + 1] === "!"
			const token: tw.Token = [match.index, closedBracket + 1, input.slice(match.index, closedBracket + 1)]

			result.classList.push({
				kind: tw.TokenKind.CssProperty,
				variants: [...context],
				token,
				key: [match.index, match.index + cssProperty.length, cssProperty],
				value: [reg.lastIndex, closedBracket, input.slice(reg.lastIndex, closedBracket)],
				important: important || importantContext,
			})

			reg.lastIndex = closedBracket + (important ? 2 : 1)
			context = [...baseContext]
		} else if (className) {
			const token: tw.Token = [match.index, reg.lastIndex, value]
			const important = value.endsWith("!")
			if (important) {
				token[1] -= 1
				token[2] = token[2].slice(0, -1)
			}

			result.classList.push({
				kind: tw.TokenKind.ClassName,
				variants: [...context],
				token,
				important: important || importantContext,
			})

			context = [...baseContext]
		} else if (notHandled) {
			const token: tw.Token = [match.index, reg.lastIndex, value]

			result.classList.push({
				kind: tw.TokenKind.Unknown,
				variants: [...context],
				token,
				important: false, // always false
			})

			context = [...baseContext]
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
					context: [...context],
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
				context: [...context],
				importantContext: importantContext || important,
				start: match.index + 1,
				end: closedBracket,
				separator,
			})
			if (innerResult.classList.length === 0) {
				result.empty.push({
					kind: tw.EmptyKind.Group,
					start: match.index,
					end: closedBracket + 1,
					variants: [...context],
				})
			}
			result = merge(result, innerResult)

			reg.lastIndex = closedBracket + (important ? 2 : 1)
		}
	}

	return result
}

export function toClassNames(result: Result, separator = ":"): string[] {
	const { classList } = result
	const results: string[] = []
	for (let i = 0; i < classList.length; i++) {
		let str = ""
		const item = classList[i]
		for (let j = 0; j < item.variants.length; j++) {
			str += classList[i].variants[j][2] + separator
		}
		results.push(str + item.token[2] + (item.important ? "!" : ""))
	}
	return results
}
