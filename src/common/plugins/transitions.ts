import { Context, hasDefault, isCorePluginEnable, isField, MatchPlugin } from "./_base"
import { isArbitraryValue } from "./_parse"

export function animation(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "animation")) return null
	const _hasDefault = hasDefault(context.config.theme.animation)
	return {
		getName() {
			return "animation"
		},
		isMatch(value) {
			const match = /^animate(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.animation, val)
		},
	}
}

export function transitionDuration(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "transitionDuration")) return null
	const _hasDefault = hasDefault(context.config.theme.transitionDuration)
	return {
		getName() {
			return "transitionDuration"
		},
		isMatch(value) {
			const match = /^duration(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			const isNegative = match[0].charCodeAt(0) === 45
			if (isArbitraryValue(val)) return !isNegative
			return isField(context.config.theme.transitionDuration, val)
		},
	}
}

export function transitionDelay(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "transitionDelay")) return null
	const _hasDefault = hasDefault(context.config.theme.transitionDelay)
	return {
		getName() {
			return "transitionDelay"
		},
		isMatch(value) {
			const match = /^delay(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			const isNegative = match[0].charCodeAt(0) === 45
			if (isArbitraryValue(val)) return !isNegative
			return isField(context.config.theme.transitionDelay, val)
		},
	}
}

export function transitionProperty(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "transitionProperty")) return null
	const _hasDefault = hasDefault(context.config.theme.transitionProperty)
	return {
		getName() {
			return "transitionProperty"
		},
		isMatch(value) {
			const match = /^transition(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.transitionProperty, val)
		},
	}
}

export function transitionTimingFunction(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "transitionTimingFunction")) return null
	const _hasDefault = hasDefault(context.config.theme.transitionTimingFunction)
	return {
		getName() {
			return "transitionTimingFunction"
		},
		isMatch(value) {
			const match = /^ease(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.transitionTimingFunction, val)
		},
	}
}
