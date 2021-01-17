import { Token } from "./typings"

export enum EmptyKind {
	Class,
	Group,
}
export interface EmptyClass {
	kind: EmptyKind.Class
	variants: Token[]
	start: number
}

export interface EmptyGroup {
	kind: EmptyKind.Group
	variants: Token[]
	start: number
	end: number
}
export interface Selection {
	selected?: Token
	variants: Token[]
	important: boolean
}

export interface TwClassName {
	token: Token
	variants: Token[]
	important: boolean
}

export interface Error {
	message: string
	start: number
	end: number
}

export type ClassesTokenResult = {
	classList: TwClassName[]
	selection: Selection
	empty: Array<EmptyClass | EmptyGroup>
	error?: Error
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

function findRightBracket({ input, start, end }: { input: string; start: number; end: number }): number {
	let stack = 0
	for (let i = start; i < end; i++) {
		if (input[i] === "(") {
			stack += 1
		} else if (input[i] === ")") {
			if (stack === 0) {
				return undefined
			}
			if (stack === 1) {
				return i
			}
			stack -= 1
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
	const returnValue: ClassesTokenResult = {
		classList: [...a.classList, ...b.classList],
		empty: [...a.empty, ...b.empty],
		selection: null,
		error: a.error || b.error,
	}
	if (a.selection.selected) {
		returnValue.selection = a.selection
	} else if (b.selection.selected) {
		returnValue.selection = b.selection
	} else {
		returnValue.selection = {
			important: false,
			selected: null,
			variants: [...a.selection.variants, ...b.selection.variants],
		}
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
	if (start === end) {
		return zero()
	}

	;[start, end] = trimLeft(input, start, end)

	const reg = new RegExp(`([\\w-]+)${separator}|([\\w-./]+!?)|\\(|(\\S+)`, "g")

	let result: ClassesTokenResult = zero()
	let match: RegExpExecArray

	reg.lastIndex = start
	input = input.slice(0, end)
	const baseContext = [...context]
	while ((match = reg.exec(input))) {
		const [value, variant, className, weird] = match
		if (variant) {
			const variantToken: Token = [match.index, reg.lastIndex - 1, variant]
			if (position >= variantToken[0] && position < variantToken[1]) {
				result.selection.selected = variantToken
				result.selection.variants = [...context]
			} else if (!hover && position === reg.lastIndex) {
				result.selection.variants = [...context, variantToken]
			}

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
					kind: EmptyKind.Class,
					start: index,
					variants: [...context],
				})
				context = [...baseContext]
				continue
			}

			if (input[reg.lastIndex] === "(") {
				if (!hover && position > reg.lastIndex) {
					result.selection.variants = [...context]
				}
				const closedBracket = findRightBracket({ input, start: reg.lastIndex, end })
				if (typeof closedBracket !== "number") {
					result.error = {
						message: `except to find a ')' to match the '('`,
						start: reg.lastIndex,
						end,
					}
					return result
				} else {
					const importantGroup = input[closedBracket + 1] === "!"
					const innerResult = findClasses({
						input: input,
						context: [...context],
						importantContext: importantContext || importantGroup,
						start: reg.lastIndex + 1,
						end: closedBracket,
						position,
						hover,
						greedy,
						separator,
					})
					if (innerResult.classList.length === 0) {
						result.empty.push({
							kind: EmptyKind.Group,
							start: reg.lastIndex,
							end: closedBracket + 1,
							variants: [...context],
						})
					}
					result = merge(result, innerResult)
					reg.lastIndex = closedBracket + (importantGroup ? 2 : 1)
				}
				context = [...baseContext]
			}
		} else if (className) {
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
		} else if (weird) {
			const token: Token = [match.index, reg.lastIndex, value]
			result.classList.push({
				variants: [...context],
				token,
				important: false,
			})
		} else {
			const closedBracket = findRightBracket({ input, start: match.index, end })
			if (typeof closedBracket !== "number") {
				result.error = {
					message: `"${input.slice(start, end)}" except to find a ')' to match the '('`,
					start: match.index,
					end,
				}
				return result
			} else {
				const importantGroup = input[closedBracket + 1] === "!"
				const innerResult = findClasses({
					input: input,
					context: [...context],
					importantContext: importantContext || importantGroup,
					start: match.index + 1,
					end: closedBracket,
					position,
					hover,
					greedy,
					separator,
				})
				if (innerResult.classList.length === 0) {
					result.empty.push({
						kind: EmptyKind.Group,
						start: match.index,
						end: closedBracket + 1,
						variants: [...context],
					})
				}
				result = merge(result, innerResult)
				reg.lastIndex = closedBracket + (importantGroup ? 2 : 1)
			}
		}

		if (!greedy) {
			if (result.selection.selected) break
		}
	}

	return result
}

export function toClassNames(result: ClassesTokenResult, separator = ":"): string[] {
	const { classList } = result
	const results: string[] = []
	for (let i = 0; i < classList.length; i++) {
		let str = ""
		for (let j = 0; j < classList[i].variants.length; j++) {
			str += classList[i].variants[j][2] + separator
		}
		results.push(str + classList[i].token[2] + (classList[i].important ? "!" : ""))
	}
	return results
}
