import { Context, hasDefault, isCorePluginEnable, isField, MatchPlugin } from "./_base"
import { isArbitraryValue } from "./_parse"

export function scale(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "scale")) return null
	const _hasDefault = hasDefault(context.config.theme.scale)
	return {
		getName() {
			return "scale"
		},
		isMatch(value) {
			const match = /^-?scale(?:-x|-y)?(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			const isNegative = match[0].charCodeAt(0) === 45
			if (isArbitraryValue(val)) return !isNegative
			return isField(context.config.theme.scale, val)
		},
	}
}

export function rotate(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "rotate")) return null
	const _hasDefault = hasDefault(context.config.theme.rotate)
	return {
		getName() {
			return "rotate"
		},
		isMatch(value) {
			const match = /^-?rotate(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			const isNegative = match[0].charCodeAt(0) === 45
			if (isArbitraryValue(val)) return !isNegative
			return isField(context.config.theme.rotate, val)
		},
	}
}

export function translate(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "translate")) return null
	const _hasDefault = hasDefault(context.config.theme.translate)
	return {
		getName() {
			return "translate"
		},
		isMatch(value) {
			const match = /^-?translate-(?:x|y)(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			const isNegative = match[0].charCodeAt(0) === 45
			if (isArbitraryValue(val)) return !isNegative
			return isField(context.config.theme.translate, val)
		},
	}
}

export function skew(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "skew")) return null
	const _hasDefault = hasDefault(context.config.theme.skew)
	return {
		getName() {
			return "skew"
		},
		isMatch(value) {
			const match = /^-?skew-(?:x|y)(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			const isNegative = match[0].charCodeAt(0) === 45
			if (isArbitraryValue(val)) return !isNegative
			return isField(context.config.theme.skew, val)
		},
	}
}

export function transformOrigin(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "transformOrigin")) return null
	return {
		getName() {
			return "transformOrigin"
		},
		isMatch(value) {
			const match = /^origin-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (isArbitraryValue(val)) return true
			return (
				val === "center" ||
				val === "top" ||
				val === "top-right" ||
				val === "right" ||
				val === "bottom-right" ||
				val === "bottom" ||
				val === "bottom-left" ||
				val === "left" ||
				val === "left" ||
				val === "top-left"
			)
		},
	}
}

export function transform(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "transform")) return null
	return {
		getName() {
			return "transform"
		},
		isMatch(value) {
			return (
				value === "transform" ||
				value === "transform-cpu" ||
				value === "transform-gpu" ||
				value === "transform-none"
			)
		},
	}
}
