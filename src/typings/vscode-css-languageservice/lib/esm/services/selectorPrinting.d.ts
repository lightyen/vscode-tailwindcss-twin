declare module "vscode-css-languageservice/lib/esm/services/selectorPrinting" {
	import { MarkedString } from "vscode-css-languageservice/lib/esm/cssLanguageTypes"
	import { CSSDataManager } from "vscode-css-languageservice/lib/esm/languageFacts/dataManager"
	import * as nodes from "vscode-css-languageservice/lib/esm/parser/cssNodes"
	export class Element {
		parent: Element | null
		children: Element[] | null
		attributes:
			| {
					name: string
					value: string
			  }[]
			| null
		findAttribute(name: string): string | null
		addChild(child: Element): void
		append(text: string): void
		prepend(text: string): void
		findRoot(): Element
		removeChild(child: Element): boolean
		addAttr(name: string, value: string): void
		clone(cloneChildren?: boolean): Element
		cloneWithParent(): Element
	}
	export class RootElement extends Element {}
	export class LabelElement extends Element {
		constructor(label: string)
	}
	export function toElement(node: nodes.SimpleSelector, parentElement?: Element | null): Element
	export class SelectorPrinting {
		private cssDataManager
		constructor(cssDataManager: CSSDataManager)
		selectorToMarkedString(node: nodes.Selector): MarkedString[]
		simpleSelectorToMarkedString(node: nodes.SimpleSelector): MarkedString[]
		private isPseudoElementIdentifier
		private selectorToSpecificityMarkedString
	}
	export function selectorToElement(node: nodes.Selector): Element | null
}
