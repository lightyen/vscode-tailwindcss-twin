declare module "vscode-css-languageservice/lib/esm/services/lintUtil" {
	import * as nodes from "vscode-css-languageservice/lib/esm/parser/cssNodes"
	export class Element {
		readonly fullPropertyName: string
		readonly node: nodes.Declaration
		constructor(decl: nodes.Declaration)
	}
	interface SideState {
		value: boolean
		properties: Element[]
	}
	interface BoxModel {
		width?: Element
		height?: Element
		top: SideState
		right: SideState
		bottom: SideState
		left: SideState
	}
	export default function calculateBoxModel(propertyTable: Element[]): BoxModel
}
