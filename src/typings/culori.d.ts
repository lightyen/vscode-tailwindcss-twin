declare module "culori" {
	interface RgbSpace {
		mode: "rgb"
		r: number
		g: number
		b: number
		alpha: number
	}

	interface HslSpace {
		mode: "hsl"
		h: number
		s: number
		b: number
		alpha: number
	}

	interface LabSpace {
		mode: "lab"
		l: number
		a: number
		b: number
	}

	type Color = RgbSpace | HslSpace

	export function converter(mode: "rgb"): (value: string | Color) => RgbSpace
	export function converter(mode: "hsl"): (value: string | Color) => HslSpace
	export function converter(mode: "lab"): (value: string | Color) => LabSpace

	export function parse(value: string): Color

	export function serializeHex(color: RgbSpace): string
	export function serializeHex8(color: RgbSpace): string
	export function formatHex(color: string | Color): string
	export function formatHex8(color: string | Color): string

	export function serializeRgb(color: RgbSpace): string
	export function formatRgb(color: string | Color): string

	export function serializeHsl(color: HslSpace): string
	export function formatHsl(color: string | Color): string
}
