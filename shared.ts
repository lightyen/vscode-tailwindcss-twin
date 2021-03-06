export const NAME = "Tailwind Twin IntelliSense"
export const SECTION_ID = "tailwindcss"
export const DIAGNOSTICS_ID = "tailwindcss"

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
	jsxPropImportChecking: boolean
}

export interface ColorDecoration {
	color?: string
	backgroundColor?: string
	borderColor?: string
}
