import { isArbitraryValue } from "../util"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const columns: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "columns")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.columns)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "columns"
		},
	}

	function isMatch(value: string) {
		const match = /^columns-(.*)/s.exec(value)
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
columns.canArbitraryValue = true
