import { Context, getOpacity, getPalette, hasDefault, isCorePluginEnable, isField, MatchPlugin } from "./_base"
import { Is, isArbitraryValue, isMatchColor } from "./_parse"

export function borderRadius(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "borderRadius")) return null
	const _hasDefault = hasDefault(context.config.theme.borderRadius)
	return {
		getName() {
			return "borderRadius"
		},
		isMatch(value) {
			const match = /^rounded(?:-tl\b|-tr\b|-br\b|-bl\b|-t\b|-r\b|-b\b|-l\b|\b)(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			let val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) {
				val = val.slice(1, -1).trim()
				return Is(context, val, "empty", "length", "percentage")
			}
			return isField(context.config.theme.borderRadius, val)
		},
	}
}

export function borderWidth(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "borderWidth")) return null
	const _hasDefault = hasDefault(context.config.theme.borderRadius)
	return {
		getName() {
			return "borderWidth"
		},
		isMatch(value) {
			const match = /^border(?:-x\b|-y\b|-t\b|-r\b|-b\b|-l\b|\b)(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			let val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) {
				val = val.slice(1, -1).trim()
				return Is(context, val, "length", "line-width")
			}
			return isField(context.config.theme.borderWidth, val)
		},
	}
}

export function borderColor(context: Context): MatchPlugin | null {
	const palette = getPalette(context, "borderColor")
	if (palette == null) return null
	const colors = new Set(palette)
	const o = getOpacity(context, "borderOpacity")
	const opacities = o ? new Set(o) : null
	return {
		getName() {
			return "borderColor"
		},
		isMatch(value: string) {
			const match = /^border(?:-x\b|-y\b|-t\b|-r\b|-b\b|-l\b|\b)(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			return isMatchColor(match[1], colors, opacities, val => Is(context, val, "color"))
		},
	}
}

export function borderOpacity(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "borderOpacity")) return null
	const _hasDefault = hasDefault(context.config.theme.borderOpacity)
	return {
		getName() {
			return "borderOpacity"
		},
		isMatch(value) {
			const match = /^border-opacity(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.borderOpacity, val)
		},
	}
}

export function borderStyle(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "borderStyle")) return null
	return {
		getName() {
			return "borderStyle"
		},
		isMatch(value) {
			const match = /^border-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			return (
				val === "solid" ||
				val === "dashed" ||
				val === "dotted" ||
				val === "double" ||
				val === "hidden" ||
				val === "none"
			)
		},
	}
}

export function divideWidth(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "divideWidth")) return null
	const _hasDefault = hasDefault(context.config.theme.divideWidth)
	return {
		getName() {
			return "divideWidth"
		},
		isMatch(value) {
			const match = /^divide-(?:x|y)(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			let val = match[1]
			if (val === "") return _hasDefault
			if (val === "reverse") return true
			if (isArbitraryValue(val)) {
				val = val.slice(1, -1).trim()
				return Is(context, val, "length", "line-width")
			}
			return isField(context.config.theme.divideWidth, val)
		},
	}
}

export function divideColor(context: Context): MatchPlugin | null {
	const palette = getPalette(context, "divideColor")
	if (palette == null) return null
	const colors = new Set(palette)
	const o = getOpacity(context, "divideOpacity")
	const opacities = o ? new Set(o) : null
	return {
		getName() {
			return "divideColor"
		},
		isMatch(value: string) {
			const match = /^divide-(.*)/s.exec(value)
			if (!match) return false
			return isMatchColor(match[1], colors, opacities, val => Is(context, val, "color"))
		},
	}
}

export function divideOpacity(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "divideOpacity")) return null
	return {
		getName() {
			return "divideOpacity"
		},
		isMatch(value: string) {
			const match = /^divide-opacity-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.divideOpacity, val)
		},
	}
}

export function divideStyle(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "divideStyle")) return null
	return {
		getName() {
			return "divideStyle"
		},
		isMatch(value) {
			const match = /^divide-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			return val === "solid" || val === "dashed" || val === "dotted" || val === "double" || val === "none"
		},
	}
}

export function outlineWidth(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "outlineWidth")) return null
	const _hasDefault = hasDefault(context.config.theme.outlineWidth)
	return {
		getName() {
			return "outlineWidth"
		},
		isMatch(value) {
			const match = /^outline(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			let val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) {
				val = val.slice(1, -1).trim()
				return Is(context, val, "length", "line-width")
			}
			return isField(context.config.theme.outlineWidth, val)
		},
	}
}

export function outlineColor(context: Context): MatchPlugin | null {
	const palette = getPalette(context, "outlineColor")
	if (palette == null) return null
	const colors = new Set(palette)
	const o = getOpacity(context)
	const opacities = o ? new Set(o) : null
	return {
		getName() {
			return "outlineColor"
		},
		isMatch(value: string) {
			const match = /^outline-(.*)/s.exec(value)
			if (!match) return false
			return isMatchColor(match[1], colors, opacities, val => Is(context, val, "color"))
		},
	}
}

export function outlineStyle(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "outlineStyle")) return null
	return {
		getName() {
			return "outlineStyle"
		},
		isMatch(value) {
			return (
				value === "outline" ||
				value === "outline-none" ||
				value === "outline-dashed" ||
				value === "outline-dotted" ||
				value === "outline-double" ||
				value === "outline-hidden"
			)
		},
	}
}

export function outlineOffset(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "outlineOffset")) return null
	const _hasDefault = hasDefault(context.config.theme.outlineOffset)
	return {
		getName() {
			return "outlineOffset"
		},
		isMatch(value) {
			const match = /^-?outline-offset(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			let val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) {
				val = val.slice(1, -1).trim()
				return Is(context, val, "length")
			}
			return isField(context.config.theme.outlineOffset, val)
		},
	}
}

export function ringWidth(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "ringWidth")) return null
	const _hasDefault = hasDefault(context.config.theme.ringWidth)
	return {
		getName() {
			return "ringWidth"
		},
		isMatch(value) {
			const match = /^ring(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			let val = match[1]
			if (val === "") return _hasDefault
			if (val === "inset") return true
			if (isArbitraryValue(val)) {
				val = val.slice(1, -1).trim()
				return Is(context, val, "length")
			}
			return isField(context.config.theme.ringWidth, val)
		},
	}
}

export function ringColor(context: Context): MatchPlugin | null {
	const palette = getPalette(context, "ringColor")
	if (palette == null) return null
	const colors = new Set(palette)
	const o = getOpacity(context, "ringOpacity")
	const opacities = o ? new Set(o) : null
	return {
		getName() {
			return "ringColor"
		},
		isMatch(value: string) {
			const match = /^ring-(.*)/s.exec(value)
			if (!match) return false
			return isMatchColor(match[1], colors, opacities, val => Is(context, val, "color"))
		},
	}
}

export function ringOpacity(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "ringOpacity")) return null
	return {
		getName() {
			return "ringOpacity"
		},
		isMatch(value) {
			const match = /^ring-opacity-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.ringOpacity, val)
		},
	}
}

export function ringOffsetWidth(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "ringOffsetWidth")) return null
	const _hasDefault = hasDefault(context.config.theme.ringOffsetWidth)
	return {
		getName() {
			return "ringOffsetWidth"
		},
		isMatch(value) {
			const match = /^ring-offset(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			let val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) {
				val = val.slice(1, -1).trim()
				return Is(context, val, "length")
			}
			return isField(context.config.theme.ringOffsetWidth, val)
		},
	}
}

export function ringOffsetColor(context: Context): MatchPlugin | null {
	const palette = getPalette(context, "ringOffsetColor")
	if (palette == null) return null
	const colors = new Set(palette)
	const o = getOpacity(context, "ringOpacity")
	const opacities = o ? new Set(o) : null
	return {
		getName() {
			return "ringOffsetColor"
		},
		isMatch(value: string) {
			const match = /^ring-offset-(.*)/s.exec(value)
			if (!match) return false
			return isMatchColor(match[1], colors, opacities, val => Is(context, val, "color"))
		},
	}
}
