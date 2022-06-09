import { Context, hasDefault, isCorePluginEnable, isField, MatchPlugin } from "./_base"
import { isArbitraryValue } from "./_parse"

export function borderCollapse(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "borderCollapse")) return null
	return {
		getName() {
			return "borderCollapse"
		},
		isMatch(value) {
			return value === "border-collapse" || value === "border-separate"
		},
	}
}

export function tableLayout(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "tableLayout")) return null
	return {
		getName() {
			return "tableLayout"
		},
		isMatch(value) {
			return value === "table-auto" || value === "table-fixed"
		},
	}
}

export function borderSpacing(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "borderSpacing")) return null
	const _hasDefault = hasDefault(context.config.theme.borderSpacing)
	return {
		getName() {
			return "borderSpacing"
		},
		isMatch(value) {
			const match = /^border-spacing(?:-x|-y|\b)-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.borderSpacing, val)
		},
	}
}
