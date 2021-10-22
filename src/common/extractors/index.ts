import { URI } from "vscode-uri"
import { Token } from "../twin-parser"
export { typescriptExtractor } from "./typescript-eslint"

type LanguageId = "javascript" | "javascriptreact" | "typescript" | "typescriptreact" | string

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface TextDocument<Position = any> {
	offsetAt(position: Position): number
	getText(): string
	positionAt(offset: number): Position
	languageId: LanguageId
	uri: URI
}

export enum ExtractedTokenKind {
	Twin = "tw",
	TwinTheme = "theme",
	TwinCssProperty = "cs",
	TwinScreen = "screen",
}

export interface ExtractedToken {
	token: Token
	kind: ExtractedTokenKind
}

export interface Extractor {
	find(
		languageId: string,
		code: string,
		position: number,
		hover: boolean,
		jsxPropImportChecking: boolean,
	): ExtractedToken | undefined
	findAll(languageId: string, code: string, jsxPropImportChecking: boolean): ExtractedToken[]
}
