import isArbitraryValue from "./common/isArbitraryValue"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const outline: PluginConstructor = (context: Context): Plugin => {
	if (!context.resolved.corePlugins.some(c => c === "outline")) throw ErrorNotEnable
	const values = Object.keys(context.resolved.theme.outline)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "outline"
		},
	}

	function isMatch(value: string) {
		const match = /^outline-(.*)/.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		if (isArbitraryValue(val)) {
			return true
		}

		return values.some(c => c === val)
	}
}
outline.canArbitraryValue = true
