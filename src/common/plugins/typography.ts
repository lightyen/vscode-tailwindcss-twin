import type { MatchPlugin } from "./_base"
import { Context, getOpacity, getPalette, hasDefault, isCorePluginEnable, isField } from "./_base"
import { Is, isArbitraryValue, isMatchColor } from "./_parse"

export function fontFamily(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "fontFamily")) return null
	const _hasDefault = hasDefault(context.config.theme.fontFamily)
	return {
		getName() {
			return "fontFamily"
		},
		isMatch(value) {
			const match = /^font(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			let val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) {
				val = val.slice(1, -1)
				return Is(context, val, "fontFamily")
			}
			return isField(context.config.theme.fontFamily, val)
		},
	}
}

export function fontSize(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "fontSize")) return null
	const _hasDefault = hasDefault(context.config.theme.fontSize)
	return {
		getName() {
			return "fontSize"
		},
		isMatch(value) {
			const match = /^text(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			let val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) {
				val = val.slice(1, -1)
				return Is(context, val, "length", "percentage", "absolute-size", "relative-size")
			}
			return isField(context.config.theme.fontSize, val)
		},
	}
}

export function fontSmoothing(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "fontSmoothing")) return null
	return {
		getName() {
			return "fontSmoothing"
		},
		isMatch(value) {
			return value === "antialiased" || value === "subpixel-antialiased"
		},
	}
}

export function fontStyle(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "fontStyle")) return null
	return {
		getName() {
			return "fontStyle"
		},
		isMatch(value) {
			return value === "italic" || value === "not-italic"
		},
	}
}

export function fontWeight(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "fontWeight")) return null
	const _hasDefault = hasDefault(context.config.theme.fontWeight)
	return {
		getName() {
			return "fontWeight"
		},
		isMatch(value) {
			const match = /^font(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			let val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) {
				val = val.slice(1, -1)
				return Is(context, val, "number")
			}
			return isField(context.config.theme.fontWeight, val)
		},
	}
}

export function fontVariantNumeric(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "fontVariantNumeric")) return null
	return {
		getName() {
			return "fontVariantNumeric"
		},
		isMatch(value) {
			return (
				value === "normal-nums" ||
				value === "ordinal" ||
				value === "slashed-zero" ||
				value === "lining-nums" ||
				value === "oldstyle-nums" ||
				value === "proportional-nums" ||
				value === "tabular-nums" ||
				value === "diagonal-fractions" ||
				value === "stacked-fractions"
			)
		},
	}
}

export function letterSpacing(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "letterSpacing")) return null
	const _hasDefault = hasDefault(context.config.theme.letterSpacing)
	return {
		getName() {
			return "letterSpacing"
		},
		isMatch(value) {
			const match = /^-?tracking(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			const isNegative = match[0].charCodeAt(0) === 45
			if (isArbitraryValue(val)) return !isNegative
			return isField(context.config.theme.letterSpacing, val)
		},
	}
}

export function lineHeight(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "lineHeight")) return null
	const _hasDefault = hasDefault(context.config.theme.lineHeight)
	return {
		getName() {
			return "lineHeight"
		},
		isMatch(value) {
			const match = /^leading(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.lineHeight, val)
		},
	}
}

export function listStyleType(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "listStyleType")) return null
	return {
		getName() {
			return "listStyleType"
		},
		isMatch(value) {
			return value === "list-none" || value === "list-disc" || value === "list-decimal"
		},
	}
}

export function listStylePosition(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "listStylePosition")) return null
	return {
		getName() {
			return "listStylePosition"
		},
		isMatch(value) {
			return value === "list-inside" || value === "list-outside"
		},
	}
}

export function textAlign(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "textAlign")) return null
	return {
		getName() {
			return "textAlign"
		},
		isMatch(value) {
			return (
				value === "text-left" ||
				value === "text-center" ||
				value === "text-right" ||
				value === "text-justify" ||
				value === "text-start" ||
				value === "text-end"
			)
		},
	}
}

export function textColor(context: Context): MatchPlugin | null {
	const palette = getPalette(context, "textColor")
	if (palette == null) return null
	const colors = new Set(palette)
	const o = getOpacity(context, "textOpacity")
	const opacities = o ? new Set(o) : null
	return {
		getName() {
			return "textColor"
		},
		isMatch(value: string) {
			const match = /^text-(.*)/s.exec(value)
			if (!match) return false
			return isMatchColor(match[1], colors, opacities, val => Is(context, val, "color"))
		},
	}
}

export function textOpacity(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "textOpacity")) return null
	return {
		getName() {
			return "textOpacity"
		},
		isMatch(value) {
			const match = /^text-opacity-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.textOpacity, val)
		},
	}
}

export function textDecoration(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "textDecoration")) return null
	return {
		getName() {
			return "textDecoration"
		},
		isMatch(value) {
			return value === "underline" || value === "overline" || value === "line-through" || value === "no-underline"
		},
	}
}

export function textDecorationColor(context: Context): MatchPlugin | null {
	const palette = getPalette(context, "textDecorationColor")
	if (palette == null) return null
	const colors = new Set(palette)
	const o = getOpacity(context)
	const opacities = o ? new Set(o) : null
	return {
		getName() {
			return "textDecorationColor"
		},
		isMatch(value: string) {
			const match = /^decoration-(.*)/s.exec(value)
			if (!match) return false
			return isMatchColor(match[1], colors, opacities, val => Is(context, val, "color"))
		},
	}
}

export function textDecorationStyle(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "textDecorationStyle")) return null
	return {
		getName() {
			return "textDecorationStyle"
		},
		isMatch(value) {
			const match = /^decoration-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			return val === "solid" || val === "double" || val === "dotted" || val === "dashed" || val === "wavy"
		},
	}
}

export function textDecorationThickness(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "textDecorationThickness")) return null
	const _hasDefault = hasDefault(context.config.theme.textDecorationThickness)
	return {
		getName() {
			return "textDecorationThickness"
		},
		isMatch(value) {
			const match = /^decoration(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			let val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) {
				val = val.slice(1, -1)
				return Is(context, val, "length", "percentage")
			}
			return isField(context.config.theme.textDecorationThickness, val)
		},
	}
}

export function textUnderlineOffset(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "textUnderlineOffset")) return null
	const _hasDefault = hasDefault(context.config.theme.textUnderlineOffset)
	return {
		getName() {
			return "textUnderlineOffset"
		},
		isMatch(value) {
			const match = /^underline-offset(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.textUnderlineOffset, val)
		},
	}
}

export function textTransform(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "textTransform")) return null
	return {
		getName() {
			return "textTransform"
		},
		isMatch(value) {
			return value === "uppercase" || value === "lowercase" || value === "capitalize" || value === "normal-case"
		},
	}
}

export function textOverflow(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "textOverflow")) return null
	return {
		getName() {
			return "textOverflow"
		},
		isMatch(value) {
			return (
				value === "truncate" ||
				value === "text-ellipsis" ||
				value === "text-clip" ||
				value === "overflow-ellipsis"
			)
		},
	}
}

export function textIndent(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "textIndent")) return null
	const _hasDefault = hasDefault(context.config.theme.textIndent)
	return {
		getName() {
			return "textIndent"
		},
		isMatch(value) {
			const match = /^-?indent(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			const isNegative = match[0].charCodeAt(0) === 45
			if (isArbitraryValue(val)) return !isNegative
			return isField(context.config.theme.textIndent, val)
		},
	}
}

export function verticalAlign(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "verticalAlign")) return null
	return {
		getName() {
			return "verticalAlign"
		},
		isMatch(value) {
			const match = /^align-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (isArbitraryValue(val)) return true
			return (
				val === "baseline" ||
				val === "top" ||
				val === "middle" ||
				val === "bottom" ||
				val === "text-top" ||
				val === "text-bottom" ||
				val === "sub" ||
				val === "super"
			)
		},
	}
}

export function whitespace(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "whitespace")) return null
	return {
		getName() {
			return "whitespace"
		},
		isMatch(value) {
			const match = /^whitespace-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			return val === "normal" || val === "nowrap" || val === "pre" || val === "pre-line" || val === "pre-wrap"
		},
	}
}

export function wordBreak(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "wordBreak")) return null
	return {
		getName() {
			return "wordBreak"
		},
		isMatch(value) {
			const match = /^break-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			return val === "normal" || val === "words" || val === "all"
		},
	}
}
