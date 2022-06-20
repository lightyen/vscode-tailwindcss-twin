import { Context, hasDefault, isCorePluginEnable, isField, MatchPlugin } from "./_base"
import { isArbitraryValue } from "./_parse"

export function padding(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "padding")) return null
	const _hasDefault = hasDefault(context.config.theme.padding)
	return {
		getName() {
			return "padding"
		},
		isMatch(value) {
			const match = /^(?:pt|pr|pb|pl|px|py|p)(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.padding, val)
		},
	}
}

export function margin(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "margin")) return null
	const _hasDefault = hasDefault(context.config.theme.margin)
	return {
		getName() {
			return "margin"
		},
		isMatch(value) {
			const match = /^-?(?:mt|mr|mb|ml|mx|my|m)(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.margin, val)
		},
	}
}

export function space(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "space")) return null
	const _hasDefault = hasDefault(context.config.theme.space)
	return {
		getName() {
			return "space"
		},
		isMatch(value) {
			const match = /^-?space-(?:x|y)(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (val === "reverse") return true
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.space, val)
		},
	}
}
