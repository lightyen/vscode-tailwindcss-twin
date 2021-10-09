import type { CompletionItem } from "vscode"
import type { IPropertyData } from "vscode-css-languageservice"
export type CompletionItemPayloadType = "theme" | "screen" | "color" | "utility" | "variant" | "cssProp" | "cssValue"

export type CompletionItemPayload = {
	type: CompletionItemPayloadType
	entry?: IPropertyData
	uri?: string
}

export interface ICompletionItem extends CompletionItem {
	label: string
	data: CompletionItemPayload
}
