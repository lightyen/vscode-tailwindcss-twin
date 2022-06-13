import { ExtractedTokenKind, Extractor } from "."

const rawExtrator: Extractor = {
	acceptLanguage(languageId) {
		return languageId === "twin"
	},
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
export default rawExtrator
