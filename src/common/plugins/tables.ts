import { Context, isCorePluginEnable, MatchPlugin } from "./_base"

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
