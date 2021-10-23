import * as parser from "./parser"

export enum TwThemeElementKind {
	Unknown,
	Identifier,
	BracketIdentifier,
	Dot,
	Bracket,
}

interface TwThemeUnknownElement {
	kind: TwThemeElementKind.Unknown
	token: parser.TokenString
}

interface TwThemeIdentifierElement {
	kind: TwThemeElementKind.Identifier
	token: parser.TokenString
}

interface TwThemeBracketIdentifierElement {
	kind: TwThemeElementKind.BracketIdentifier
	token: parser.TokenString
}

interface TwThemeDotElement {
	kind: TwThemeElementKind.Dot
	token: parser.TokenString
}

interface TwThemeBracketElement {
	kind: TwThemeElementKind.Bracket
	token: parser.TokenString
}

export interface Error {
	message: string
	start: number
	end: number
}

type Block =
	| TwThemeUnknownElement
	| TwThemeIdentifierElement
	| TwThemeBracketIdentifierElement
	| TwThemeDotElement
	| TwThemeBracketElement

interface Result {
	blocks: Block[]
	errors: Error[]
	keys(): string[]
	hit(index: number): Block | undefined
}

export default function parseThemeValue(input: string): Result {
	let init = false

	const blocks: Block[] = []
	const errors: Error[] = []

	const reg = /(\.[\w-/]*)|(\[[\w-./]*)|([\w-/]+)/g
	const start = 0
	const end = input.length
	reg.lastIndex = start
	input = input.slice(0, end)
	let match: RegExpExecArray | null
	let x = 0

	while ((match = reg.exec(input))) {
		const [value, dotId, bracId, Id] = match
		if (match.index !== x) {
			errors.push({
				message: "Syntax Error (invalid space)",
				start: x,
				end: match.index,
			})
		} else {
			x = x + value.length
		}

		if (!init) {
			if (!Id) {
				errors.push({
					message: "Syntax Error (not an identifier)",
					start: match.index,
					end: match.index + 1,
				})
				break
			}
			blocks.push({
				kind: TwThemeElementKind.Identifier,
				token: { range: [match.index, reg.lastIndex], value: Id },
			})
			init = true
			continue
		} else if (Id) {
			errors.push({
				message: "Syntax Error (access expression)",
				start: match.index,
				end: match.index + 1,
			})
			break
		}

		if (dotId) {
			blocks.push({
				kind: TwThemeElementKind.Dot,
				token: { range: [match.index, match.index + 1], value: input.slice(match.index, match.index + 1) },
			})

			let hasId = false
			if (match.index + 1 < reg.lastIndex) {
				blocks.push({
					kind: TwThemeElementKind.Identifier,
					token: {
						range: [match.index + 1, reg.lastIndex],
						value: input.slice(match.index + 1, reg.lastIndex),
					},
				})
				hasId = true
			}

			if (hasId) {
				const char = input.charCodeAt(reg.lastIndex)
				if (char && char !== 46 && char !== 91) {
					errors.push({
						message: "Syntax Error (access expression)",
						start: reg.lastIndex,
						end: reg.lastIndex + 1,
					})
					break
				}
			} else {
				errors.push({
					message: "Syntax Error (access expression)",
					start: reg.lastIndex,
					end: reg.lastIndex + 1,
				})
				break
			}
		} else if (bracId) {
			blocks.push({
				kind: TwThemeElementKind.Bracket,
				token: { range: [match.index, match.index + 1], value: input.slice(match.index, match.index + 1) },
			})

			const closedBracket = parser.findRightBracket({ text: input, start: match.index, end, brackets: [91, 93] })
			if (typeof closedBracket !== "number") {
				errors.push({
					message: "except to find a ']' to match the '['",
					start: match.index,
					end,
				})
				break
			}

			if (match.index + 1 < closedBracket) {
				blocks.push({
					kind: TwThemeElementKind.Identifier,
					token: {
						range: [match.index + 1, closedBracket],
						value: input.slice(match.index + 1, closedBracket),
					},
				})
			} else {
				errors.push({
					message: "Syntax Error (empty)",
					start: match.index,
					end: closedBracket + 1,
				})
			}

			blocks.push({
				kind: TwThemeElementKind.Bracket,
				token: {
					range: [closedBracket, closedBracket + 1],
					value: input.slice(closedBracket, closedBracket + 1),
				},
			})

			reg.lastIndex = closedBracket + 1
			x = reg.lastIndex
		}
	}

	return {
		blocks,
		errors,
		keys() {
			return this.blocks
				.filter(
					block =>
						block.kind === TwThemeElementKind.Identifier ||
						block.kind === TwThemeElementKind.BracketIdentifier,
				)
				.map(v => v.token.value)
		},
		hit(index: number) {
			for (const block of this.blocks) {
				if (
					block.kind !== TwThemeElementKind.Identifier &&
					block.kind !== TwThemeElementKind.BracketIdentifier
				) {
					continue
				}
				if (index >= block.token.range[0] && index <= block.token.range[1]) {
					return block
				}
			}
			return undefined
		},
	}
}

export function findThemeValueKeys(
	input: string,
	position: number,
): {
	keys: string[]
	hit: parser.TokenString | undefined
} {
	const keys: string[] = []
	let hit: parser.TokenString | undefined

	let init = false
	const reg = /(\.[\w-/]*)|(\[[\w-./]*)|([\w-/]+)/g
	const start = 0
	const end = input.length
	reg.lastIndex = start
	input = input.slice(0, end)
	let match: RegExpExecArray | null

	while ((match = reg.exec(input))) {
		const [, dotId, bracId, Id] = match
		if (!init) {
			if (!Id) {
				break
			}
			if (position >= match.index && position <= reg.lastIndex) {
				hit = { range: [match.index, reg.lastIndex], value: Id }
				break
			}
			if (position > reg.lastIndex) {
				keys.push(Id)
			}
			init = true
			continue
		} else if (Id) {
			if (position >= match.index && position <= reg.lastIndex) {
				hit = { range: [match.index, reg.lastIndex], value: Id }
			}
			break
		}

		if (dotId) {
			let hasId = false
			if (position >= match.index && position <= reg.lastIndex) {
				hit = { range: [match.index, reg.lastIndex], value: input.slice(match.index, reg.lastIndex) }
				break
			}
			if (match.index + 1 < reg.lastIndex) {
				if (position > reg.lastIndex) {
					keys.push(input.slice(match.index + 1, reg.lastIndex))
				}
				hasId = true
			}

			if (hasId) {
				const char = input.charCodeAt(reg.lastIndex)
				if (char && char !== 46 && char !== 91) {
					break
				}
			} else {
				break
			}
		} else if (bracId) {
			const closedBracket = parser.findRightBracket({ text: input, start: match.index, end, brackets: [91, 93] })
			if (typeof closedBracket !== "number") {
				if (position === match.index + 1) {
					hit = { range: [match.index, match.index + 1], value: input.slice(match.index, match.index + 1) }
				}
				break
			}

			if (position >= match.index && position <= closedBracket) {
				hit = { range: [match.index, closedBracket + 1], value: input.slice(match.index, closedBracket + 1) }
				break
			}

			if (match.index + 1 < closedBracket) {
				if (position > closedBracket) {
					keys.push(input.slice(match.index + 1, closedBracket))
				}
			} else {
				// empty
				break
			}

			reg.lastIndex = closedBracket + 1
		}
	}

	return { keys, hit }
}
