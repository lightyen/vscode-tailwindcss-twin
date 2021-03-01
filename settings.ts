export interface Settings {
	enabled: boolean
	colorDecorators: boolean | null
	references: boolean
	preferVariantWithParentheses: boolean
	fallbackDefaultConfig: boolean
	diagnostics: {
		enabled: boolean
		conflict: "none" | "loose" | "strict"
		emptyClass: boolean
		emptyGroup: boolean
		emptyCssProperty: boolean
	}
	twPropImportChecking: boolean
}
