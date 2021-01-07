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

function trimLeft(str: string, start = 0, end = str.length) {
	const reg = /\s/
	while (reg.test(str[start])) {
		start += 1
	}
	if (start > end) {
		start = end
	}
	return [start, end]
}

function findRightBracket({
	classes,
	start,
	end,
	lbrace = /[(]/,
	rbrace = /[)]/,
}: {
	classes: string
	start: number
	end: number
	lbrace: RegExp
	rbrace: RegExp
}): number {
	const stack: number[] = []
	for (let i = start; i < end; i++) {
		if (lbrace.test(classes[i])) {
			stack.push(i)
		} else if (rbrace.test(classes[i])) {
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

export type ClassesTokenResult = { classList: ClassInfo[]; selection: SelectionInfo; empty: EmptyGroup[] }

function zero(): ClassesTokenResult {
	return {
		classList: [],
		selection: { selected: null, important: false, variants: [] },
		empty: [],
	}
}

function merge(a: ClassesTokenResult, b: ClassesTokenResult): ClassesTokenResult {
	return {
		classList: [...a.classList, ...b.classList],
		empty: [...a.empty, ...b.empty],
		selection: { selected: null, important: false, variants: [] },
	}
}

export default function findClasses({
	classes,
	context = [],
	start = 0,
	end = classes.length,
	index,
	hover = false,
	greedy = true,
	separator = ":",
	lbrace = /[(]/,
	rbrace = /[)]/,
}: {
	classes: string
	context?: Token[]
	start?: number
	end?: number
	index?: number
	hover?: boolean
	greedy?: boolean // not stop when selection exists.
	separator?: string
	lbrace?: RegExp
	rbrace?: RegExp
}): ClassesTokenResult {
	;[start, end] = trimLeft(classes, start, end)
	if (start === end) {
		return zero()
	}

	if (lbrace.test(classes[start])) {
		const endBracket = findRightBracket({ classes, start, end, lbrace, rbrace })
		if (typeof endBracket !== "number") {
			return zero()
		} else {
			const prev = findClasses({
				classes,
				context: [...context],
				start: start + 1,
				end: endBracket,
				index,
				hover,
				greedy,
				separator,
				lbrace,
				rbrace,
			})
			if (endBracket < end) {
				const result = merge(
					prev,
					findClasses({
						classes,
						context: [...context],
						start: endBracket + 1,
						end,
						index,
						hover,
						greedy,
						separator,
						lbrace,
						rbrace,
					}),
				)
				return result
			}
			return prev
		}
	}

	const reg = new RegExp(`([\\w-]+)${separator}|\\S+`, "g")
	const space = /\s/

	let result: ClassesTokenResult = zero()
	let match: RegExpExecArray

	reg.lastIndex = start
	classes = classes.slice(0, end)
	const baseContext = [...context]
	while ((match = reg.exec(classes))) {
		const [value, variant] = match
		start = reg.lastIndex
		if (variant) {
			const token: Token = [match.index, reg.lastIndex - 1, variant]
			context.push(token)
			if (index >= token[0] && index < token[1]) {
				result.selection.selected = token
			}
			// skip space
			let hasSpace = false
			while (space.test(classes[reg.lastIndex])) {
				hasSpace = true
				reg.lastIndex++
			}
			if (hasSpace) {
				const index = match.index + value.length
				result.empty.push([index, index + 1, [...context]])
				context = [...baseContext]
				continue
			}
			if (lbrace.test(classes[reg.lastIndex])) {
				const endBracket = findRightBracket({ classes, start: reg.lastIndex, end, lbrace, rbrace })
				if (typeof endBracket == "number") {
					const innerResult = findClasses({
						classes,
						context: [...context],
						start: reg.lastIndex + 1,
						end: endBracket,
						index,
						hover,
						greedy,
						separator,
						lbrace,
						rbrace,
					})
					if (innerResult.classList.length === 0) {
						result.empty.push([reg.lastIndex, endBracket + 1, [...context]])
					}
					result = merge(result, innerResult)
					reg.lastIndex = endBracket + 1
				} else {
					// throw `except to find a ')' to match the '('`
					return result
				}
				context = [...baseContext]
			}
		} else {
			const token: Token = [match.index, reg.lastIndex, value]
			const important = value.endsWith("!")
			if (important) {
				token[1] -= 1
				token[2] = token[2].slice(0, token[2].length - 1)
			}
			if (index >= token[0] && (hover ? index < token[1] : index <= token[1])) {
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
