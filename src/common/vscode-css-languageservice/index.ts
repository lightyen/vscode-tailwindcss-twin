import type {
	IAtDirectiveData,
	ICSSDataProvider,
	IPropertyData,
	IPseudoClassData,
	IPseudoElementData,
} from "vscode-css-languageservice"
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore TS/7016
import { CSSDataManager } from "vscode-css-languageservice/lib/esm/languageFacts/dataManager"
export * from "./facts"

type Options = { useDefaultDataProvider?: boolean; customDataProviders?: ICSSDataProvider[] }
const options: Options = { useDefaultDataProvider: true }

interface IManager {
	getProperty(name: string): IPropertyData | undefined
	getAtDirective(name: string): IAtDirectiveData | undefined
	getPseudoClass(name: string): IPseudoClassData | undefined
	getPseudoElement(name: string): IPseudoElementData | undefined

	getProperties(): IPropertyData[]
	getAtDirectives(): IAtDirectiveData[]
	getPseudoClasses(): IPseudoClassData[]
	getPseudoElements(): IPseudoElementData[]

	isKnownProperty(name: string): boolean
	isStandardProperty(name: string): boolean
}

export const cssDataManager = new CSSDataManager(options) as IManager
