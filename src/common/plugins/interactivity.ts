import { Context, getOpacity, getPalette, hasDefault, isCorePluginEnable, isField, MatchPlugin } from "./_base"
import { Is, isArbitraryValue, isMatchColor } from "./_parse"

export function accentColor(context: Context): MatchPlugin | null {
	const palette = getPalette(context, "accentColor")
	if (palette == null) return null
	const colors = new Set(palette)
	const o = getOpacity(context)
	const opacities = o ? new Set(o) : null
	return {
		getName() {
			return "accentColor"
		},
		isMatch(value: string) {
			const match = /^accent-(.*)/s.exec(value)
			if (!match) return false
			return isMatchColor(match[1], colors, opacities, val => Is(context, val, "empty", "var", "color"))
		},
	}
}

export function appearance(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "appearance")) return null
	return {
		getName() {
			return "appearance"
		},
		isMatch(value) {
			return value === "appearance-none"
		},
	}
}

export function cursor(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "cursor")) return null
	const _hasDefault = hasDefault(context.config.theme.cursor)
	return {
		getName() {
			return "cursor"
		},
		isMatch(value) {
			const match = /^cursor(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.cursor, val)
		},
	}
}

export function caretColor(context: Context): MatchPlugin | null {
	const palette = getPalette(context, "caretColor")
	if (palette == null) return null
	const colors = new Set(palette)
	const o = getOpacity(context)
	const opacities = o ? new Set(o) : null
	return {
		getName() {
			return "caretColor"
		},
		isMatch(value: string) {
			const match = /^caret-(.*)/s.exec(value)
			if (!match) return false
			return isMatchColor(match[1], colors, opacities, val => Is(context, val, "empty", "var", "color"))
		},
	}
}

export function pointerEvents(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "pointerEvents")) return null
	return {
		getName() {
			return "pointerEvents"
		},
		isMatch(value) {
			return value === "pointer-events-none" || value === "pointer-events-auto"
		},
	}
}

export function resize(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "resize")) return null
	return {
		getName() {
			return "resize"
		},
		isMatch(value) {
			return value === "resize" || value === "resize-none" || value === "resize-x" || value === "resize-y"
		},
	}
}

export function scrollBehavior(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "scrollBehavior")) return null
	return {
		getName() {
			return "scrollBehavior"
		},
		isMatch(value) {
			return value === "scroll-auto" || value === "scroll-smooth"
		},
	}
}

export function scrollMargin(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "scrollMargin")) return null
	const _hasDefault = hasDefault(context.config.theme.scrollMargin)
	return {
		getName() {
			return "scrollMargin"
		},
		isMatch(value) {
			const match = /^-?scroll-(?:mt|mr|mb|ml|mx|my|m)(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.scrollMargin, val)
		},
	}
}

export function scrollPadding(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "scrollPadding")) return null
	const _hasDefault = hasDefault(context.config.theme.scrollPadding)
	return {
		getName() {
			return "scrollPadding"
		},
		isMatch(value) {
			const match = /^scroll-(?:pt|pr|pb|pl|px|py|p)(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.scrollPadding, val)
		},
	}
}

export function scrollSnapAlign(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "scrollSnapAlign")) return null
	return {
		getName() {
			return "scrollSnapAlign"
		},
		isMatch(value) {
			return (
				value === "snap-start" || value === "snap-end" || value === "snap-center" || value === "snap-align-none"
			)
		},
	}
}

export function scrollSnapStop(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "scrollSnapStop")) return null
	return {
		getName() {
			return "scrollSnapStop"
		},
		isMatch(value) {
			return value === "snap-normal" || value === "snap-always"
		},
	}
}

export function scrollSnapType(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "scrollSnapType")) return null
	return {
		getName() {
			return "scrollSnapType"
		},
		isMatch(value) {
			return (
				value === "snap-none" ||
				value === "snap-x" ||
				value === "snap-y" ||
				value === "snap-both" ||
				value === "snap-mandatory" ||
				value === "snap-proximity"
			)
		},
	}
}

export function touchAction(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "touchAction")) return null
	return {
		getName() {
			return "touchAction"
		},
		isMatch(value) {
			const match = /^touch-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			return (
				val === "auto" ||
				val === "none" ||
				val === "pan-x" ||
				val === "pan-left" ||
				val === "pan-right" ||
				val === "pan-y" ||
				val === "pan-up" ||
				val === "pan-down" ||
				val === "pinch-zoom" ||
				val === "manipulation"
			)
		},
	}
}

export function userSelect(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "userSelect")) return null
	return {
		getName() {
			return "userSelect"
		},
		isMatch(value) {
			const match = /^select-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			return val === "none" || val === "text" || val === "all" || val === "auto"
		},
	}
}

export function willChange(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "willChange")) return null
	return {
		getName() {
			return "willChange"
		},
		isMatch(value) {
			const match = /^will-change-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			return val === "auto" || val === "scroll" || val === "contents" || val === "transform"
		},
	}
}

export function accessibility(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "accessibility")) return null
	return {
		getName() {
			return "accessibility"
		},
		isMatch(value) {
			return value === "sr-only" || value === "not-sr-only"
		},
	}
}

export function placeholderColor(context: Context): MatchPlugin | null {
	const palette = getPalette(context, "placeholderColor")
	if (palette == null) return null
	const colors = new Set(palette)
	const o = getOpacity(context)
	const opacities = o ? new Set(o) : null
	return {
		getName() {
			return "placeholderColor"
		},
		isMatch(value: string) {
			const match = /^placeholder-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (isArbitraryValue(val)) return true
			return isMatchColor(match[1], colors, opacities, val => false)
		},
	}
}

export function placeholderOpacity(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "placeholderOpacity")) return null
	return {
		getName() {
			return "placeholderOpacity"
		},
		isMatch(value: string) {
			const match = /^placeholder-opacity-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.placeholderOpacity, val)
		},
	}
}
