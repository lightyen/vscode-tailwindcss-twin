import { Token, EmptyGroup } from "./typings"

export interface SelectionInfo {
	selected?: Token
	variants: Token[]
	important: boolean
}

export interface ClassInfo {
	token: Token
	variants: Token[]
	important: boolean
}

export type ClassesTokenResult = { classList: ClassInfo[]; selection: SelectionInfo; empty: EmptyGroup[] }

const spaceReg = /\s/

function trimLeft(str: string, start = 0, end = str.length) {
	while (spaceReg.test(str[start])) {
		start += 1
	}
	if (start > end) {
		start = end
	}
	return [start, end]
}

function findRightBracket({ input, start, end }: { input: string; start: number; end: number }): number {
	const stack: number[] = []
	for (let i = start; i < end; i++) {
		if (input[i] === "(") {
			stack.push(i)
		} else if (input[i] === ")") {
			if (stack.length === 0) {
				return undefined
			}
			if (stack.length === 1) {
				return i
			}
			stack.pop()
		}
	}
	return undefined
}

function zero(): ClassesTokenResult {
	return {
		classList: [],
		empty: [],
		selection: { selected: null, important: false, variants: [] },
	}
}

function merge(a: ClassesTokenResult, b: ClassesTokenResult): ClassesTokenResult {
	const returnValue = {
		classList: [...a.classList, ...b.classList],
		empty: [...a.empty, ...b.empty],
		selection: null,
	}
	if (a.selection.selected) {
		returnValue.selection = a.selection
	} else {
		returnValue.selection = b.selection
	}
	return returnValue
}

export default function findClasses({
	input,
	position,
	context = [],
	importantContext = false,
	start = 0,
	end = input.length,
	hover = false,
	greedy = true,
	separator = ":",
}: {
	/** user input */
	input: string
	/** cursor position */
	position?: number
	/** variants */
	context?: Token[]
	importantContext?: boolean
	start?: number
	end?: number
	hover?: boolean
	/** whether stop if selection exists. */
	greedy?: boolean
	separator?: string
}): ClassesTokenResult {
	;[start, end] = trimLeft(input, start, end)
	if (start === end) {
		return zero()
	}

	if (input[start] === "(") {
		const endBracket = findRightBracket({ input, start, end })
		if (typeof endBracket !== "number") {
			return zero()
		} else {
			const isImportant = input[endBracket + 1] === "!"
			const prev = findClasses({
				input,
				context: [...context],
				importantContext: importantContext || isImportant,
				start: start + 1,
				end: endBracket,
				position,
				hover,
				greedy,
				separator,
			})
			const tail = isImportant ? endBracket + 1 : endBracket
			if (tail < end) {
				const result = merge(
					prev,
					findClasses({
						input,
						context: [...context],
						importantContext,
						start: tail + 1,
						end,
						position,
						hover,
						greedy,
						separator,
					}),
				)
				return result
			}
			return prev
		}
	}

	const reg = new RegExp(`([\\w-]+)${separator}|\\S+`, "g")

	let result: ClassesTokenResult = zero()
	let match: RegExpExecArray

	reg.lastIndex = start
	input = input.slice(0, end)
	const baseContext = [...context]
	while ((match = reg.exec(input))) {
		const [value, variant] = match
		if (variant) {
			const variantToken: Token = [match.index, reg.lastIndex - 1, variant]
			if (position >= variantToken[0] && position < variantToken[1]) {
				result.selection.selected = variantToken
				result.selection.variants = [...context]
			} else if (!hover && position === reg.lastIndex) {
				result.selection.variants = [...context, variantToken]
			}

			context.push(variantToken)

			let hasSpace = false
			while (spaceReg.test(input[reg.lastIndex])) {
				hasSpace = true
				reg.lastIndex++
			}
			if (hasSpace) {
				const index = match.index + value.length
				result.empty.push([index, index + 1, [...context]])
				context = [...baseContext]
				continue
			}
			if (input[reg.lastIndex] === "(") {
				const endBracket = findRightBracket({ input, start: reg.lastIndex, end })
				if (typeof endBracket !== "number") {
					// throw `except to find a ')' to match the '('`
					return result
				} else {
					const importantGroup = input[endBracket + 1] === "!"
					const innerResult = findClasses({
						input: input,
						context: [...context],
						importantContext: importantContext || importantGroup,
						start: reg.lastIndex + 1,
						end: endBracket,
						position,
						hover,
						greedy,
						separator,
					})
					if (innerResult.classList.length === 0) {
						result.empty.push([reg.lastIndex, endBracket + 1, [...context]])
					}
					result = merge(result, innerResult)
					reg.lastIndex = endBracket + (importantGroup ? 2 : 1)
				}
				context = [...baseContext]
			}
		} else if (value[0].startsWith("(")) {
			const endBracket = findRightBracket({ input, start: match.index, end })
			if (typeof endBracket !== "number") {
				// throw `except to find a ')' to match the '('`
				return result
			} else {
				const importantGroup = input[endBracket + 1] === "!"
				const innerResult = findClasses({
					input: input,
					context: [...context],
					importantContext: importantContext || importantGroup,
					start: match.index + 1,
					end: endBracket,
					position,
					hover,
					greedy,
					separator,
				})
				if (innerResult.classList.length === 0) {
					result.empty.push([match.index, endBracket + 1, [...context]])
				}
				result = merge(result, innerResult)
				reg.lastIndex = endBracket + (importantGroup ? 2 : 1)
			}
		} else {
			const token: Token = [match.index, reg.lastIndex, value]
			let important = value.endsWith("!")
			if (important) {
				token[1] -= 1
				token[2] = token[2].slice(0, token[2].length - 1)
			}
			important ||= importantContext
			if (position >= token[0] && (hover ? position < token[1] : position <= token[1])) {
				result.selection.important = important
				result.selection.variants = [...context]
				result.selection.selected = token
			}
			result.classList.push({
				variants: [...context],
				token,
				important,
			})
			context = [...baseContext]
		}

		if (!greedy) {
			if (result.selection.selected) break
		}
	}

	return result
}
