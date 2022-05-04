import { Context, getOpacity, getPalette, hasDefault, isCorePluginEnable, isField, MatchPlugin } from "./_base"
import { Is, isArbitraryValue, isMatchColor } from "./_parse"

export function boxShadow(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "boxShadow")) return null
	const _hasDefault = hasDefault(context.config.theme.boxShadow)
	return {
		getName() {
			return "boxShadow"
		},
		isMatch(value) {
			const match = /^shadow(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			let val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) {
				val = val.slice(1, -1).trim()
				return Is(context, val, "shadow")
			}
			return isField(context.config.theme.boxShadow, val)
		},
	}
}

export function boxShadowColor(context: Context): MatchPlugin | null {
	const palette = getPalette(context, "boxShadowColor")
	if (palette == null) return null
	const colors = new Set(palette)
	const o = getOpacity(context)
	const opacities = o ? new Set(o) : null
	return {
		getName() {
			return "boxShadowColor"
		},
		isMatch(value: string) {
			const match = /^shadow-(.*)/s.exec(value)
			if (!match) return false
			return isMatchColor(match[1], colors, opacities, val => Is(context, val, "color"))
		},
	}
}

export function opacity(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "opacity")) return null
	return {
		getName() {
			return "opacity"
		},
		isMatch(value: string) {
			const match = /^opacity-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.opacity, val)
		},
	}
}

export function mixBlendMode(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "mixBlendMode")) return null
	return {
		getName() {
			return "mixBlendMode"
		},
		isMatch(value) {
			const match = /^mix-blend-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			return (
				val === "normal" ||
				val === "multiply" ||
				val === "screen" ||
				val === "overlay" ||
				val === "darken" ||
				val === "lighten" ||
				val === "color-dodge" ||
				val === "color-burn" ||
				val === "hard-light" ||
				val === "soft-light" ||
				val === "difference" ||
				val === "exclusion" ||
				val === "hue" ||
				val === "saturation" ||
				val === "color" ||
				val === "luminosity"
			)
		},
	}
}

export function backgroundBlendMode(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "backgroundBlendMode")) return null
	return {
		getName() {
			return "backgroundBlendMode"
		},
		isMatch(value) {
			const match = /^bg-blend-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			return (
				val === "normal" ||
				val === "multiply" ||
				val === "screen" ||
				val === "overlay" ||
				val === "darken" ||
				val === "lighten" ||
				val === "color-dodge" ||
				val === "color-burn" ||
				val === "hard-light" ||
				val === "soft-light" ||
				val === "difference" ||
				val === "exclusion" ||
				val === "hue" ||
				val === "saturation" ||
				val === "color" ||
				val === "luminosity"
			)
		},
	}
}
