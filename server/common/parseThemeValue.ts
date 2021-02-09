import * as tw from "./types"

export enum TwThemeElementKind {
	Unknown,
	Identifier,
	Dot,
	Bracket,
}

interface TwThemeUnknownElement {
	kind: TwThemeElementKind.Unknown
	token: tw.Token
}

interface TwThemeIdentifierElement {
	kind: TwThemeElementKind.Identifier
	token: tw.Token
}

interface TwThemeDotElement {
	kind: TwThemeElementKind.Dot
	token: tw.Token
}

interface TwThemeBracketElement {
	kind: TwThemeElementKind.Bracket
	token: tw.Token
}

type Block = TwThemeUnknownElement | TwThemeIdentifierElement | TwThemeDotElement | TwThemeBracketElement

interface Result {
	blocks: Block[]
	errors: tw.Error[]
	keys(): string[]
	hit(index: number): tw.Token
}

export default function parseThemeValue(str: string, start = 0, end = str.length): Result {
	enum State {
		ExpectIdentifier = 1,
		ExpectDotOrLeftBracket = 2,
		ExpectIdentifierOrRightBracket = 4,
		ExpectNotRightBracket = 8,
	}

	let state: State = State.ExpectIdentifier
	const blocks: Block[] = []
	const errors: tw.Error[] = []
	let flag = -1
	let b = start
	let i = start

	for (; i < end; i++) {
		if (str[i] === ".") {
			if (state === State.ExpectDotOrLeftBracket || state === State.ExpectNotRightBracket) {
				if (b < i) {
					blocks.push({
						kind: TwThemeElementKind.Identifier,
						token: [b, i, str.slice(b, i)],
					})
				}
				b = i + 1
			}

			if (state === State.ExpectDotOrLeftBracket || state === State.ExpectNotRightBracket) {
				blocks.push({
					kind: TwThemeElementKind.Dot,
					token: [i, i + 1, str.slice(i, i + 1)],
				})
				state = State.ExpectIdentifier
			} else if (state === State.ExpectIdentifierOrRightBracket) {
				// nothing
			} else if (state === State.ExpectIdentifier) {
				errors.push({
					message: "An element access expression should take an argument (1)",
					start: i,
					end: i + 1,
				})
				break
			}
		} else if (str[i] === "[") {
			flag = i
			if (state === State.ExpectDotOrLeftBracket || state === State.ExpectNotRightBracket) {
				if (b < i) {
					blocks.push({
						kind: TwThemeElementKind.Identifier,
						token: [b, i, str.slice(b, i)],
					})
				}
				b = i + 1
			}

			if (state === State.ExpectDotOrLeftBracket || state === State.ExpectNotRightBracket) {
				blocks.push({
					kind: TwThemeElementKind.Bracket,
					token: [i, i + 1, str.slice(i, i + 1)],
				})
				state = State.ExpectIdentifier
			} else {
				errors.push({
					message: "Syntax Error",
					start: i,
					end: i + 1,
				})
				break
			}
		} else if (str[i] === "]") {
			flag = -1

			if (state === State.ExpectIdentifierOrRightBracket) {
				if (b < i) {
					blocks.push({
						kind: TwThemeElementKind.Identifier,
						token: [b, i, str.slice(b, i)],
					})
				} else {
					errors.push({
						message: "An element access expression should take an argument (2)",
						start: flag,
						end: i,
					})
				}
				b = i + 1
			}

			if (state === State.ExpectIdentifierOrRightBracket) {
				blocks.push({
					kind: TwThemeElementKind.Bracket,
					token: [i, i + 1, str.slice(i, i + 1)],
				})
				state = State.ExpectDotOrLeftBracket
			} else {
				errors.push({
					message: "An element access expression should take an argument (3)",
					start: b,
					end: i + 1,
				})
				break
			}
		} else {
			if (flag > 0) {
				state = State.ExpectIdentifierOrRightBracket
			} else if (state === State.ExpectIdentifier) {
				state = State.ExpectNotRightBracket
			} else if (state === State.ExpectDotOrLeftBracket) {
				errors.push({
					message: "Syntax Error",
					start: i,
					end: i + 1,
				})
				break
			}
		}
	}

	if (b < i) {
		blocks.push({
			kind: TwThemeElementKind.Identifier,
			token: [b, i, str.slice(b, i)],
		})
	}

	if (state !== State.ExpectNotRightBracket && state !== State.ExpectDotOrLeftBracket) {
		errors.push({ message: "An element access expression should take an argument (4)", start: i, end: i + 1 })
	}

	return {
		blocks,
		errors,
		keys() {
			return this.blocks.filter(b => b.kind === TwThemeElementKind.Identifier).map(v => v.token[2])
		},
		hit(index: number) {
			for (const block of this.blocks) {
				if (block.kind !== TwThemeElementKind.Identifier) {
					continue
				}
				if (index >= block.token[0] && index <= block.token[1]) {
					return block.token
				}
			}
			return undefined
		},
	}
}
