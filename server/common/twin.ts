type _Token = [start: number, end: number, value: string]

export interface Token extends _Token {
	start: number
	end: number
	text: string
}

export interface TokenList extends Array<Token> {
	texts: string[]
	slice(start?: number, end?: number): TokenList
}

export enum TokenKind {
	Unknown,
	Variant,
	ClassName,
	CssProperty,
	VariantsGroup,
}

export interface Context {
	variants: TokenList
	important: boolean
}

export interface Unknown extends Context {
	kind: TokenKind.Unknown
	token: Token
}

export interface ClassName extends Context {
	kind: TokenKind.ClassName
	token: Token
}

export interface Variant {
	kind: TokenKind.Variant
	token: Token
}

export interface CssProperty extends Context {
	kind: TokenKind.CssProperty
	token: Token
	key: Token
	value: Token
}

export interface Error {
	message: string
	start: number
	end: number
}

export enum EmptyKind {
	Classname,
	Group,
}

export interface EmptyClass {
	kind: EmptyKind.Classname
	variants: TokenList
	start: number
}

export interface EmptyGroup {
	kind: EmptyKind.Group
	variants: TokenList
	important: boolean
	start: number
	end: number
}

export function createToken(start: number, end: number, value: string) {
	const token: _Token = [start, end, value]
	return new Proxy(token, {
		get(target, prop) {
			switch (prop) {
				case "start":
					return target[0]
				case "end":
					return target[1]
				case "text":
					return target[2]
				default:
					return target[prop]
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
				case "text":
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
		get: function (target, prop) {
			switch (prop) {
				case "texts":
					return target.map(t => t.text)
				case "slice":
					return function (start?: number, end?: number) {
						return createTokenList(target.slice(start, end))
					}
				default:
					return target[prop]
			}
		},
	}) as TokenList
}

export interface ClassList extends Array<Unknown | ClassName | CssProperty> {
	texts: string[]
}

export interface EmptyList extends Array<EmptyClass | EmptyGroup> {
	texts: string[]
}

export function createClassList(arr?: Array<Unknown | ClassName | CssProperty>) {
	return new Proxy(arr ?? [], {
		get: function (target, prop) {
			switch (prop) {
				case "texts": {
					const results: string[] = []
					for (let i = 0; i < target.length; i++) {
						let str = ""
						const item = target[i]
						for (let j = 0; j < item.variants.length; j++) {
							str += target[i].variants[j].text + ":"
						}
						results.push(str + item.token.text + (item.important ? "!" : ""))
					}
					return results
				}
				case "slice":
					return function (start?: number, end?: number) {
						return createClassList(target.slice(start, end))
					}
				default:
					return target[prop]
			}
		},
	}) as ClassList
}

export function createEmptyList(arr?: Array<EmptyClass | EmptyGroup>) {
	return new Proxy(arr ?? [], {
		get: function (target, prop) {
			switch (prop) {
				case "texts": {
					const results: string[] = []
					for (let i = 0; i < target.length; i++) {
						let str = ""
						const item = target[i]
						for (let j = 0; j < item.variants.length; j++) {
							str += target[i].variants[j].text + ":"
						}
						if (item.kind === EmptyKind.Group) {
							results.push(str + "()" + (item.important ? "!" : ""))
						} else {
							results.push(str)
						}
					}
					return results
				}
				case "slice":
					return function (start?: number, end?: number) {
						return createEmptyList(target.slice(start, end))
					}
				default:
					return target[prop]
			}
		},
	}) as EmptyList
}

export interface SelectedUnknown {
	kind: TokenKind.Unknown
	token: Token
}

export interface SelectedClassName {
	kind: TokenKind.ClassName
	token: Token
}

export interface SelectedVariant {
	kind: TokenKind.Variant
	token: Token
}

export interface SelectedCssProperty {
	kind: TokenKind.CssProperty
	token: Token
	key: Token
	value: Token
}

export interface SelectedVariantsGroup {
	kind: TokenKind.VariantsGroup
	token: Token
}
