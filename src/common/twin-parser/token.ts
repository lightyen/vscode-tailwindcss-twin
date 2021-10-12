type _Token = [start: number, end: number, value: string]

export interface Token extends _Token {
	start: number
	end: number
	value: string
	trim(): Token
	getWord(offset?: number): Token
	toKebab(): string
	toString(): string
}

export interface TokenList extends Array<Token> {
	texts: string[]
	slice(start?: number, end?: number): TokenList
}

export function createToken(start: number, end: number, value: string) {
	const token: _Token = [start, end, value]
	return new Proxy(token, {
		get(target, prop, ...rest) {
			switch (prop) {
				case "start":
					return target[0]
				case "end":
					return target[1]
				case "value":
					return target[2]
				case "trim":
					return function () {
						const [a, b, text] = target
						const len = text.length
						let i: number, j: number
						for (i = 0; i < len; i++) {
							if (!/\s/.test(text[i])) {
								break
							}
						}
						for (j = 0; j < len; j++) {
							if (!/\s/.test(text[len - j - 1])) {
								break
							}
						}
						return createToken(a + i, b - j, text.slice(i, len - j))
					}
				case "getWord":
					return function (offset = end) {
						let i = offset - 1 - start
						while (i >= 0 && ' \t\n\r":{[()]},*>+'.indexOf(value.charAt(i)) === -1) {
							i--
						}
						return createToken(i + 1 + start, offset, value.slice(i + 1, offset - start))
					}
				case "toKebab":
					return function toKebab() {
						return value.replace(/\B[A-Z][a-z]*/g, s => "-" + s.toLowerCase())
					}
				case "toString":
					return function toString() {
						return target[2]
					}
				default:
					return Reflect.get(target, prop, ...rest)
			}
		},
		set(target, prop, value, ...rest) {
			switch (prop) {
				case "start":
					target[0] = value
					return true
				case "end":
					target[1] = value
					return true
				case "value":
					target[2] = value
					return true
				default:
					return Reflect.set(target, prop, value, ...rest)
			}
		},
	}) as Token
}

export function createTokenList(arr?: Token[]) {
	return new Proxy(arr ?? [], {
		get: function (target, prop, ...rest) {
			switch (prop) {
				case "texts":
					return target.map(t => t.value)
				case "slice":
					return function (start?: number, end?: number) {
						return createTokenList(target.slice(start, end))
					}
				default:
					return Reflect.get(target, prop, ...rest)
			}
		},
	}) as TokenList
}
