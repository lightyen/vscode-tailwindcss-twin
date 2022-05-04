import type { MatchPlugin } from "./_base"
import { Context, getOpacity, getPalette, isCorePluginEnable, isField } from "./_base"
import { Is, isArbitraryValue, isMatchColor } from "./_parse"

export function backgroundAttachment(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "backgroundAttachment")) return null
	return {
		getName() {
			return "backgroundAttachment"
		},
		isMatch(value) {
			return value === "bg-fixed" || value === "bg-local" || value === "bg-scroll"
		},
	}
}

export function backgroundClip(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "backgroundClip")) return null
	return {
		getName() {
			return "backgroundClip"
		},
		isMatch(value) {
			return (
				value === "bg-clip-border" ||
				value === "bg-clip-padding" ||
				value === "bg-clip-content" ||
				value === "bg-clip-text"
			)
		},
	}
}

export function backgroundColor(context: Context): MatchPlugin | null {
	const palette = getPalette(context, "backgroundColor")
	if (palette == null) return null
	const colors = new Set(palette)
	const o = getOpacity(context, "backgroundOpacity")
	const opacities = o ? new Set(o) : null
	return {
		getName() {
			return "backgroundColor"
		},
		isMatch(value: string) {
			const match = /^bg-(.*)/s.exec(value)
			if (!match) return false
			return isMatchColor(match[1], colors, opacities, val => Is(context, val, "color"))
		},
	}
}

export function backgroundOpacity(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "backgroundOpacity")) return null
	return {
		getName() {
			return "backgroundOpacity"
		},
		isMatch(value) {
			const match = /^bg-opacity-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.backgroundOpacity, val)
		},
	}
}

export function backgroundOrigin(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "backgroundOrigin")) return null
	return {
		getName() {
			return "backgroundOrigin"
		},
		isMatch(value) {
			return value === "bg-origin-border" || value === "bg-origin-padding" || value === "bg-origin-content"
		},
	}
}

export function backgroundPosition(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "backgroundPosition")) return null
	return {
		getName() {
			return "backgroundPosition"
		},
		isMatch(value) {
			const match = /^bg-(.*)/s.exec(value)
			if (!match) return false
			let val = match[1]
			if (isArbitraryValue(val)) {
				val = val.slice(1, -1)
				return Is(context, val, "backgroundPosition")
			}
			return isField(context.config.theme.backgroundPosition, val)
		},
	}
}

export function backgroundRepeat(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "backgroundRepeat")) return null
	return {
		getName() {
			return "backgroundRepeat"
		},
		isMatch(value) {
			return (
				value === "bg-repeat" ||
				value === "bg-no-repeat" ||
				value === "bg-repeat-x" ||
				value === "bg-repeat-y" ||
				value === "bg-repeat-round" ||
				value === "bg-repeat-space"
			)
		},
	}
}

export function backgroundSize(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "backgroundSize")) return null
	return {
		getName() {
			return "backgroundSize"
		},
		isMatch(value) {
			const match = /^bg-(.*)/s.exec(value)
			if (!match) return false
			let val = match[1]
			if (isArbitraryValue(val)) {
				val = val.slice(1, -1)
				return Is(context, val, "backgroundSize")
			}
			return isField(context.config.theme.backgroundSize, val)
		},
	}
}

export function backgroundImage(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "backgroundImage")) return null
	return {
		getName() {
			return "backgroundImage"
		},
		isMatch(value) {
			const match = /^bg-(.*)/s.exec(value)
			if (!match) return false
			let val = match[1]
			if (isArbitraryValue(val)) {
				val = val.slice(1, -1).trim()
				return Is(context, val, "backgroundImage")
			}
			return isField(context.config.theme.backgroundImage, val)
		},
	}
}

export function gradientColorStops(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "gradientColorStops")) return null
	const palette = getPalette(context, "gradientColorStops")
	if (palette == null) return null
	const colors = new Set(palette)
	const o = getOpacity(context)
	const opacities = o ? new Set(o) : null
	return {
		getName() {
			return "gradientColorStops"
		},
		isMatch(value) {
			const match = /^(?:from|to|via)(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			return isMatchColor(match[1], colors, opacities, val => Is(context, val, "color"))
		},
	}
}
