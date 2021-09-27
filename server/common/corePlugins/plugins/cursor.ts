import isArbitraryValue from "./common/isArbitraryValue"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const cursor: PluginConstructor = (context: Context): Plugin => {
	if (!context.resolved.corePlugins.some(c => c === "cursor")) throw ErrorNotEnable
	const values = Object.keys(context.resolved.theme.cursor)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "cursor"
		},
	}

	function isMatch(value: string) {
		const match = /^cursor-(.*)/.exec(value)
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
cursor.canArbitraryValue = true
