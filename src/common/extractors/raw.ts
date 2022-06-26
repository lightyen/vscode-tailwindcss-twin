import type { Extractor } from "./types"

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
				kind: "tw",
			},
		]
	},
	find(languageId, code, position, hover, jsxPropImportChecking) {
		return {
			start: 0,
			end: code.length,
			value: code,
			kind: "tw",
		}
	},
}
export default rawExtrator
