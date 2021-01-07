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

function trim(str: string, start = 0, end = str.length) {
	const reg = /\s/
	while (reg.test(str[start])) {
		start += 1
	}
	while (reg.test(str[end - 1])) {
		end -= 1
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

// export function findClasses({
// 	classes,
// 	context = [],
// 	start = 0,
// 	end = classes.length,
// 	index,
// 	hover = false,
// 	greedy = true,
// 	separator = ":",
// 	handleImportant = false,
// 	lbrace = /[(]/,
// 	rbrace = /[)]/,
// }: {
// 	classes: string
// 	context: Token[]
// 	start?: number
// 	end?: number
// 	index?: number
// 	hover?: boolean
// 	greedy?: boolean // not stop when selection exists.
// 	separator?: string
// 	handleImportant?: boolean
// 	lbrace?: RegExp
// 	rbrace?: RegExp
// }): ClassesTokenResult {
// 	;[start, end] = trim(classes, start, end)
// 	if (start === end) {
// 		return zero()
// 	}

// 	if (lbrace.test(classes[start])) {
// 		const endBracket = findRightBracket({ classes, start, end, lbrace, rbrace })
// 		if (typeof endBracket !== "number") {
// 			return zero()
// 		} else {
// 			const result = findClasses({
// 				classes,
// 				context: [...context],
// 				start: start + 1,
// 				end: endBracket,
// 				index,
// 				hover,
// 				greedy,
// 				separator,
// 				handleImportant,
// 				lbrace,
// 				rbrace,
// 			})
// 			if (endBracket < end) {
// 				merge(
// 					result,
// 					findClasses({
// 						classes,
// 						context: [...context],
// 						start: endBracket + 1,
// 						end,
// 						index,
// 						hover,
// 						greedy,
// 						separator,
// 						handleImportant,
// 						lbrace,
// 						rbrace,
// 					}),
// 				)
// 			}
// 			return result
// 		}
// 	}

// 	const reg = new RegExp(`([\\w-]+${separator})|\\S+`, "g")
// 	const space = /\s/

// 	let result: ClassesTokenResult = zero()
// 	// const classList: ClassInfo[] = []
// 	// const empty: EmptyGroup[] = []
// 	// let selected: Token = null
// 	// let variantsSelected: Token[] = []
// 	// let important = false
// 	// let inGroup = false

// 	let match: RegExpExecArray

// 	reg.lastIndex = start
// 	classes = classes.slice(0, end)
// 	const baseContext = [...context]
// 	while ((match = reg.exec(classes))) {
// 		const [, variant] = match
// 		if (variant) {
// 			context.push([reg.lastIndex - variant.length, reg.lastIndex, variant])

// 			// skip space
// 			while (space.test(classes[reg.lastIndex])) {
// 				reg.lastIndex++
// 			}
// 		}
// 		if (lbrace.test(classes[reg.lastIndex])) {
// 			const endBracket = findRightBracket({ classes, start: reg.lastIndex, end, lbrace, rbrace })
// 			if (typeof endBracket == "number") {
// 				result = merge(
// 					result,
// 					findClasses({
// 						classes,
// 						context: [...context],
// 						start: reg.lastIndex + 1,
// 						end: endBracket,
// 						index,
// 						hover,
// 						greedy,
// 						separator,
// 						handleImportant,
// 						lbrace,
// 						rbrace,
// 					}),
// 				)
// 				reg.lastIndex = endBracket + 1
// 				context = baseContext
// 			} else {
// 				// throw `except to find a ')' to match the '('`
// 				return result
// 			}
// 		} else {
// 			result.classList.push({
// 				token: [reg.lastIndex - match[0].length, reg.lastIndex, match[0]],
// 				variants: [...context],
// 				important: false,
// 			})
// 			context = baseContext
// 		}

// 		if (variants) {
// 			const endBracket = findBrackets({ classes, start: reg.lastIndex - 1, lbraceReg, rbraceReg })
// 			if (index >= reg.lastIndex && index <= endBracket) {
// 				inGroup = true
// 			}
// 			variantReg.lastIndex = 0
// 			let lastv = variantReg.lastIndex
// 			let m: RegExpExecArray
// 			const vs: Token[] = []
// 			while ((m = variantReg.exec(variants))) {
// 				const t: Token = [e.index + m.index, e.index + m.index + m[1].length, m[1]]
// 				vs.push(t)
// 				if (index >= t[0] && index < t[1]) {
// 					selected = t
// 				}
// 				lastv = variantReg.lastIndex
// 			}
// 			const ret = findClasses({
// 				classes,
// 				start: reg.lastIndex,
// 				end: endBracket,
// 				index,
// 				hover,
// 				greedy,
// 				separator,
// 				handleBrackets,
// 				handleImportant,
// 				lbrace,
// 				rbrace,
// 			})
// 			if (ret.classList.length === 0) {
// 				empty.push([e.index + lastv, endBracket + 1, vs])
// 			}
// 			classList.push(
// 				...ret.classList.map(item => ({ ...item, variants: [...vs, ...item.variants], inGroup: true })),
// 			)
// 			empty.push(...ret.empty)
// 			if (index > endBracket) {
// 				variantsSelected = []
// 			} else if (index >= e.index) {
// 				variantsSelected = [...vs]
// 			}
// 			if (index >= e.index) {
// 				if (ret.selection.selected) {
// 					selected = ret.selection.selected
// 				}
// 				if (ret.selection.inGroup) {
// 					inGroup = ret.selection.inGroup
// 				}
// 				if (ret.selection.important) {
// 					important = ret.selection.important
// 				}
// 				variantsSelected.push(...ret.selection.variants)
// 			}
// 			if (endBracket) {
// 				reg.lastIndex = endBracket + 1
// 			} else {
// 				break
// 			}
// 		} else {
// 			variantReg.lastIndex = e.index
// 			let last = variantReg.lastIndex
// 			let m: RegExpExecArray
// 			const inRange = index >= e.index && (hover ? index < reg.lastIndex : index <= reg.lastIndex)
// 			const s = classes.slice(0, reg.lastIndex)
// 			const item: ClassInfo = {
// 				token: null,
// 				variants: [],
// 				inGroup: false,
// 				important: false,
// 			}
// 			if (inRange) {
// 				variantsSelected = []
// 			}
// 			while ((m = variantReg.exec(s))) {
// 				last = variantReg.lastIndex
// 				const t: Token = [m.index, m.index + m[1].length, m[1]]
// 				item.variants.push(t)
// 				if (!hover) {
// 					if (index > t[1]) variantsSelected.push(t)
// 				} else if (inRange) {
// 					variantsSelected.push(t)
// 				}
// 				if (index >= t[0] && index < t[1]) {
// 					selected = t
// 				}
// 			}
// 			item.token = [last, reg.lastIndex, classes.slice(last, reg.lastIndex)]
// 			if (last === reg.lastIndex) {
// 				empty.push([last, last + 1, item.variants])
// 			}
// 			if (handleImportant && item.token[2].endsWith("!")) {
// 				item.important = true
// 				item.token[2] = item.token[2].slice(0, item.token[2].length - 1)
// 				item.token[1] = item.token[1] - 1
// 			}
// 			if (inRange && index >= item.token[0]) {
// 				if (handleImportant && item.important) {
// 					important = true
// 				}
// 				if (item.token[2]) selected = item.token
// 			}
// 			if (item.token[2] && index >= item.token[1]) {
// 				variantsSelected = []
// 			}
// 			classList.push(item)
// 		}
// 		if (!greedy) {
// 			if (selected) break
// 		}
// 	}

// 	if (result.classList.length == 0) {
// 		result.empty.push([,, ])
// 	}

// 	return result
// }
