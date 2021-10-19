import { URI } from "vscode-uri"
import { Settings } from "~/shared"
import { Token } from "../twin-parser"
export { typescriptExtractor } from "./typescript"

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

export interface Extractor<Position = unknown> {
	find(document: TextDocument, position: Position, hover: boolean, option: Settings): ExtractedToken | undefined
	findAll(document: TextDocument, option: Settings): ExtractedToken[]
}
