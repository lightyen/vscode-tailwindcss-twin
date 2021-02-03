export type Token = [start: number, end: number, value: string]

export enum TokenKind {
	Unknown,
	Variant,
	ClassName,
	CssProperty,
}

export interface Context {
	variants: Token[]
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
	variants: Token[]
	start: number
}

export interface EmptyGroup {
	kind: EmptyKind.Group
	variants: Token[]
	start: number
	end: number
}
