declare module "vscode-css-languageservice/lib/esm/languageFacts/dataManager" {
	import {
		IAtDirectiveData,
		ICSSDataProvider,
		IPropertyData,
		IPseudoClassData,
		IPseudoElementData,
	} from "vscode-css-languageservice/lib/esm/cssLanguageTypes"
	export class CSSDataManager {
		private dataProviders
		private _propertySet
		private _atDirectiveSet
		private _pseudoClassSet
		private _pseudoElementSet
		private _properties
		private _atDirectives
		private _pseudoClasses
		private _pseudoElements
		constructor(options?: { useDefaultDataProvider?: boolean; customDataProviders?: ICSSDataProvider[] })
		setDataProviders(builtIn: boolean, providers: ICSSDataProvider[]): void
		/**
		 * Collect all data  & handle duplicates
		 */
		private collectData
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
}
