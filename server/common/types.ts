import type { IPropertyData } from "vscode-css-languageservice"
import type { CompletionItem } from "vscode-languageserver"
export type CompletionItemPayloadType = "theme" | "screen" | "color" | "utility" | "variant" | "cssProp" | "cssValue"

export type CompletionItemPayload = {
	type: CompletionItemPayloadType
	entry?: IPropertyData
}

export interface ICompletionItem extends CompletionItem {
	data: CompletionItemPayload
}
