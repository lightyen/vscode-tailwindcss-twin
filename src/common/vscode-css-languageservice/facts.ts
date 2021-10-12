import type {
	HoverSettings,
	IAtDirectiveData,
	IPropertyData,
	IPseudoClassData,
	IPseudoElementData,
	IValueData,
} from "vscode-css-languageservice"
// @ts-ignore TS/7016
import { getEntryDescription as _getEntryDescription } from "vscode-css-languageservice/lib/esm/languageFacts/facts"
import { MarkupContent } from "vscode-languageserver"

export const getEntryDescription = _getEntryDescription as (
	entry: IPropertyData | IAtDirectiveData | IPseudoClassData | IPseudoElementData | IValueData,
	doesSupportMarkdown: boolean,
	settings?: HoverSettings,
) => MarkupContent | undefined

export * from "./builtinData"
