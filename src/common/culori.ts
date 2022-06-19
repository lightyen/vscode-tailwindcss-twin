import { RgbSpace } from "culori"

function clone(rgb: RgbSpace): RgbSpace {
	return { ...rgb }
}

export function ensureContrastRatio(rgb: RgbSpace, base: RgbSpace, ratio: number): RgbSpace | undefined {
	const rgbL = relativeLuminance(rgb)
	const baseL = relativeLuminance(base)
	if (contrastRatio(rgbL, baseL) < ratio) {
		const increased = clone(rgb)
		increaseLuminance(increased, base, ratio)
		if (contrastRatio(relativeLuminance(increased), baseL) >= ratio) {
			return increased
		}
		const reduced = clone(rgb)
		reduceLuminance(reduced, base, ratio)
		return reduced
	}
	return undefined
}

export function relativeLuminance({ r, g, b }: RgbSpace) {
	r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)
	g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)
	b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4)
	return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrastRatio(l1: number, l2: number) {
	if (l1 < l2) return (l2 + 0.05) / (l1 + 0.05)
	return (l1 + 0.05) / (l2 + 0.05)
}

function reduceLuminance(rgb: RgbSpace, base: RgbSpace, ratio: number) {
	const baseL = relativeLuminance(base)
	const p = 0.1
	let r = contrastRatio(relativeLuminance(rgb), baseL)
	const e = 10e-4
	while (r < ratio && (rgb.r > e || rgb.g > e || rgb.b > e)) {
		rgb.r = (1 - p) * rgb.r
		rgb.g = (1 - p) * rgb.g
		rgb.b = (1 - p) * rgb.b
		r = contrastRatio(relativeLuminance(rgb), baseL)
	}
}

function increaseLuminance(rgb: RgbSpace, base: RgbSpace, ratio: number) {
	const baseL = relativeLuminance(base)
	const p = 0.1
	let r = contrastRatio(relativeLuminance(rgb), baseL)
	const e = 1 - 10e-4
	while (r < ratio && (rgb.r < e || rgb.g < e || rgb.b < e)) {
		rgb.r = rgb.r + (1 - rgb.r) * p
		rgb.g = rgb.g + (1 - rgb.g) * p
		rgb.b = rgb.b + (1 - rgb.b) * p
		r = contrastRatio(relativeLuminance(rgb), baseL)
	}
}
