import { Context, hasDefault, isCorePluginEnable, isField, MatchPlugin } from "./_base"
import { isArbitraryValue } from "./_parse"

export function width(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "width")) return null
	const _hasDefault = hasDefault(context.config.theme.width)
	return {
		getName() {
			return "width"
		},
		isMatch(value) {
			const match = /^w(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.width, val)
		},
	}
}

export function minWidth(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "minWidth")) return null
	const _hasDefault = hasDefault(context.config.theme.minWidth)
	return {
		getName() {
			return "minWidth"
		},
		isMatch(value) {
			const match = /^min-w(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.minWidth, val)
		},
	}
}

export function maxWidth(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "maxWidth")) return null
	const _hasDefault = hasDefault(context.config.theme.maxWidth)
	return {
		getName() {
			return "maxWidth"
		},
		isMatch(value) {
			const match = /^max-w(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.maxWidth, val)
		},
	}
}

export function height(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "height")) return null
	const _hasDefault = hasDefault(context.config.theme.height)
	return {
		getName() {
			return "height"
		},
		isMatch(value) {
			const match = /^h(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.height, val)
		},
	}
}

export function minHeight(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "minHeight")) return null
	const _hasDefault = hasDefault(context.config.theme.minHeight)
	return {
		getName() {
			return "minHeight"
		},
		isMatch(value) {
			const match = /^min-h(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.minHeight, val)
		},
	}
}

export function maxHeight(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "maxHeight")) return null
	const _hasDefault = hasDefault(context.config.theme.maxHeight)
	return {
		getName() {
			return "maxHeight"
		},
		isMatch(value) {
			const match = /^max-h(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.maxHeight, val)
		},
	}
}
