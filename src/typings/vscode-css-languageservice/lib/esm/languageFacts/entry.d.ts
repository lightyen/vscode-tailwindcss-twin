declare module "vscode-css-languageservice/lib/esm/languageFacts/entry" {
	import {
		EntryStatus,
		HoverSettings,
		IAtDirectiveData,
		IPropertyData,
		IPseudoClassData,
		IPseudoElementData,
		IValueData,
		MarkedString,
		MarkupContent,
	} from "vscode-css-languageservice/lib/esm/cssLanguageTypes"
	export interface Browsers {
		E?: string
		FF?: string
		IE?: string
		O?: string
		C?: string
		S?: string
		count: number
		all: boolean
		onCodeComplete: boolean
	}
	export const browserNames: {
		E: string
		FF: string
		S: string
		C: string
		IE: string
		O: string
	}
	export function getEntryDescription(
		entry: IEntry2,
		doesSupportMarkdown: boolean,
		settings?: HoverSettings,
	): MarkupContent | undefined
	export function textToMarkedString(text: string): MarkedString
	/**
	 * Input is like `["E12","FF49","C47","IE","O"]`
	 * Output is like `Edge 12, Firefox 49, Chrome 47, IE, Opera`
	 */
	export function getBrowserLabel(browsers?: string[]): string | null
	export type IEntry2 = IPropertyData | IAtDirectiveData | IPseudoClassData | IPseudoElementData | IValueData
	/**
	 * Todo@Pine: Drop these two types and use IEntry2
	 */
	export interface IEntry {
		name: string
		description?: string | MarkupContent
		browsers?: string[]
		restrictions?: string[]
		status?: EntryStatus
		syntax?: string
		values?: IValue[]
	}
	export interface IValue {
		name: string
		description?: string | MarkupContent
		browsers?: string[]
	}
}
