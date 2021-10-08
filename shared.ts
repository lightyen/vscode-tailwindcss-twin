export const NAME = "Tailwind Twin IntelliSense"
export const SECTION_ID = "tailwindcss"
export const DIAGNOSTICS_ID = "tailwindcss"

export interface Settings {
	enabled: boolean
	colorDecorators: "inherit" | "on" | "off"
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
	rootFontSize: number
	logLevel: "none" | "error" | "warning" | "info" | "debug" | "trace"
}

export interface ColorDecoration {
	color?: string
	backgroundColor?: string
	borderColor?: string
}
