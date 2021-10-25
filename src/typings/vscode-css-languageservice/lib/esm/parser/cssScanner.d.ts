declare module "vscode-css-languageservice/lib/esm/parser/cssScanner" {
	export enum TokenType {
		Ident = 0,
		AtKeyword = 1,
		String = 2,
		BadString = 3,
		UnquotedString = 4,
		Hash = 5,
		Num = 6,
		Percentage = 7,
		Dimension = 8,
		UnicodeRange = 9,
		CDO = 10,
		CDC = 11,
		Colon = 12,
		SemiColon = 13,
		CurlyL = 14,
		CurlyR = 15,
		ParenthesisL = 16,
		ParenthesisR = 17,
		BracketL = 18,
		BracketR = 19,
		Whitespace = 20,
		Includes = 21,
		Dashmatch = 22,
		SubstringOperator = 23,
		PrefixOperator = 24,
		SuffixOperator = 25,
		Delim = 26,
		EMS = 27,
		EXS = 28,
		Length = 29,
		Angle = 30,
		Time = 31,
		Freq = 32,
		Exclamation = 33,
		Resolution = 34,
		Comma = 35,
		Charset = 36,
		EscapedJavaScript = 37,
		BadEscapedJavaScript = 38,
		Comment = 39,
		SingleLineComment = 40,
		EOF = 41,
		CustomToken = 42,
	}
	export interface IToken {
		type: TokenType
		text: string
		offset: number
		len: number
	}
	export class MultiLineStream {
		private source
		private len
		private position
		constructor(source: string)
		substring(from: number, to?: number): string
		eos(): boolean
		pos(): number
		goBackTo(pos: number): void
		goBack(n: number): void
		advance(n: number): void
		nextChar(): number
		peekChar(n?: number): number
		lookbackChar(n?: number): number
		advanceIfChar(ch: number): boolean
		advanceIfChars(ch: number[]): boolean
		advanceWhileChar(condition: (ch: number) => boolean): number
	}
	export class Scanner {
		stream: MultiLineStream
		ignoreComment: boolean
		ignoreWhitespace: boolean
		inURL: boolean
		setSource(input: string): void
		finishToken(offset: number, type: TokenType, text?: string): IToken
		substring(offset: number, len: number): string
		pos(): number
		goBackTo(pos: number): void
		scanUnquotedString(): IToken | null
		scan(): IToken
		protected scanNext(offset: number): IToken
		protected trivia(): IToken | null
		protected comment(): boolean
		private _number
		private _newline
		private _escape
		private _stringChar
		private _string
		private _unquotedChar
		protected _unquotedString(result: string[]): boolean
		private _whitespace
		private _name
		protected ident(result: string[]): boolean
		private _identFirstChar
		private _minus
		private _identChar
	}
}
