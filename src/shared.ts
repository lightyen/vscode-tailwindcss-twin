import type { PnpApi } from "@yarnpkg/pnp"
import { URI } from "vscode-uri"

export const NAME = "Tailwind Twin IntelliSense"
export const SECTION_ID = "tailwindcss"
export const DIAGNOSTICS_ID = "twin"

export interface Settings {
	enabled: boolean
	colorDecorators: "inherit" | "on" | "off"
	references: boolean
	preferVariantWithParentheses: boolean
	fallbackDefaultConfig: boolean
	diagnostics: {
		enabled: boolean
		emptyChecking: boolean
	}
	jsxPropImportChecking: boolean
	rootFontSize: number
	logLevel: "none" | "error" | "warning" | "info" | "debug" | "trace"
	documentColors: boolean
	hoverColorHint: "none" | "hex" | "rgb" | "hsl"
	otherLanguages: string[]
	minimumContrastRatio: number
}

export interface ColorDecoration {
	color?: string
	backgroundColor?: string
	borderColor?: string
}

export enum ExtensionMode {
	/**
	 * The extension is installed normally (for example, from the marketplace
	 * or VSIX) in the editor.
	 */
	Production = 1,

	/**
	 * The extension is running from an `--extensionDevelopmentPath` provided
	 * when launching the editor.
	 */
	Development = 2,

	/**
	 * The extension is running from an `--extensionTestsPath` and
	 * the extension host is running unit tests.
	 */
	Test = 3,
}

/**
 * Completion item tags are extra annotations that tweak the rendering of a completion
 * item.
 */
export enum CompletionItemTag {
	/**
	 * Render a completion as obsolete, usually using a strike-out.
	 */
	Deprecated = 1,
}

export interface Environment {
	configPath?: URI
	workspaceFolder: URI
	extensionUri: URI
	serverSourceMapUri: URI
	extensionMode: ExtensionMode
	pnpContext: PnpApi | undefined
}

export type ServiceOptions = Settings & Environment
