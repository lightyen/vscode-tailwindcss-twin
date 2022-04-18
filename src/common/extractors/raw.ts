import { ExtractedTokenKind, Extractor } from "."

export const rawExtrator: Extractor = {
	findAll(languageId, code, jsxPropImportChecking) {
		return [
			{
				start: 0,
				end: code.length,
				value: code,
				kind: ExtractedTokenKind.Twin,
			},
		]
	},
	find(languageId, code, position, hover, jsxPropImportChecking) {
		return {
			start: 0,
			end: code.length,
			value: code,
			kind: ExtractedTokenKind.Twin,
		}
	},
}
