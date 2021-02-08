import * as tw from "./types"

type Result = [keys: tw.Token[], errors: tw.Error[]]

export default function parseObjectKeys(str: string, start = 0, end = str.length): Result {
	enum State {
		ExpectIdentifier = 1,
		ExpectDotOrLeftBracket = 2,
		ExpectIdentifierOrRightBracket = 4,
		ExpectNotRightBracket = 8,
	}

	let state: State = State.ExpectIdentifier
	const keys: tw.Token[] = []
	const errors: tw.Error[] = []
	let flag = -1
	let b = start
	let i = start

	for (; i < end; i++) {
		if (str[i] === ".") {
			if (state === State.ExpectDotOrLeftBracket || state === State.ExpectNotRightBracket) {
				if (b < i) {
					keys.push([b, i, str.slice(b, i)])
				}
				b = i + 1
				state = State.ExpectIdentifier
			} else if (state === State.ExpectIdentifierOrRightBracket) {
				// nothing
			} else {
				errors.push({
					message: "An element access expression should take an argument",
					start: i,
					end: i + 1,
				})
				break
			}
		} else if (str[i] === "[") {
			flag = i
			if (state === State.ExpectDotOrLeftBracket || state === State.ExpectNotRightBracket) {
				if (b < i) {
					keys.push([b, i, str.slice(b, i)])
				}
				b = i + 1
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
					keys.push([b, i, str.slice(b, i)])
				} else {
					errors.push({
						message: "An element access expression should take an argument",
						start: flag,
						end: i,
					})
				}
				b = i + 1
				state = State.ExpectDotOrLeftBracket
			} else {
				errors.push({
					message: "An element access expression should take an argument",
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
		keys.push([b, i, str.slice(b, i)])
	}

	if (state !== State.ExpectNotRightBracket && state !== State.ExpectDotOrLeftBracket) {
		errors.push({ message: "An element access expression should take an argument", start: i, end: i + 1 })
	}

	return [keys, errors]
}
