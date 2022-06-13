import typescript from "typescript"
import { URI } from "vscode-uri"
import { Logger } from "../logger"
import rawExtrator from "./raw"
import typescriptExtractor from "./typescript"

type LanguageId = "javascript" | "javascriptreact" | "typescript" | "typescriptreact" | "twin" | string

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

export interface Token {
	start: number
	end: number
	value: string
}

export interface ExtractedToken extends Token {
	kind: ExtractedTokenKind
}

export interface Extractor {
	acceptLanguage(languageId: string): boolean
	find(
		languageId: string,
		code: string,
		position: number,
		jsxPropImportChecking: boolean,
		context?: { console: Logger; typescript: typeof typescript; typescriptExtractor: Extractor },
	): ExtractedToken | undefined
	findAll(
		languageId: string,
		code: string,
		jsxPropImportChecking: boolean,
		context?: { console: Logger; typescript: typeof typescript; typescriptExtractor: Extractor },
	): ExtractedToken[]
}

export function isExtrator(value: unknown): value is Extractor {
	if (value == undefined || typeof value !== "object") return false
	if (Object.prototype.hasOwnProperty.call(value, "acceptLanguage")) {
		if (typeof (value as Extractor).acceptLanguage !== "function") return false
	} else return false
	if (Object.prototype.hasOwnProperty.call(value, "find")) {
		if (typeof (value as Extractor).acceptLanguage !== "function") return false
	} else return false
	if (Object.prototype.hasOwnProperty.call(value, "findAll")) {
		if (typeof (value as Extractor).acceptLanguage !== "function") return false
	} else return false
	return true
}

export const defaultExtractors = [typescriptExtractor, rawExtrator]
