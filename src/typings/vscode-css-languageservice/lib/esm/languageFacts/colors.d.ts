declare module "vscode-css-languageservice/lib/esm/languageFacts/colors" {
	import { Color } from "vscode-css-languageservice/lib/esm/cssLanguageService"
	import * as nodes from "vscode-css-languageservice/lib/esm/parser/cssNodes"
	export const colorFunctions: {
		func: string
		desc: string
	}[]
	export const colors: {
		[name: string]: string
	}
	export const colorKeywords: {
		[name: string]: string
	}
	export function isColorConstructor(node: nodes.Function): boolean
	/**
	 * Returns true if the node is a color value - either
	 * defined a hex number, as rgb or rgba function, or
	 * as color name.
	 */
	export function isColorValue(node: nodes.Node): boolean
	export function hexDigit(charCode: number): number
	export function colorFromHex(text: string): Color | null
	export function colorFrom256RGB(red: number, green: number, blue: number, alpha?: number): Color
	export function colorFromHSL(hue: number, sat: number, light: number, alpha?: number): Color
	export interface HSLA {
		h: number
		s: number
		l: number
		a: number
	}
	export function hslFromColor(rgba: Color): HSLA
	export function getColorValue(node: nodes.Node): Color | null
}
