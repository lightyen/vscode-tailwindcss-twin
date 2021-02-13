import * as lsp from "vscode-languageserver"
import type {
	IPropertyData,
	IAtDirectiveData,
	IPseudoClassData,
	IPseudoElementData,
	IValueData,
	HoverSettings,
} from "vscode-css-languageservice"

import { getEntryDescription as _getEntryDescription } from "vscode-css-languageservice/lib/esm/languageFacts/facts"

export const getEntryDescription = _getEntryDescription as (
	entry: IPropertyData | IAtDirectiveData | IPseudoClassData | IPseudoElementData | IValueData,
	doesSupportMarkdown: boolean,
	settings?: HoverSettings,
) => lsp.MarkupContent

export * from "./builtinData"
