import { isArbitraryValue } from "../util"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const willChange: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "willChange")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.willChange)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "willChange"
		},
	}

	function isMatch(value: string) {
		const match = /^will-change-(.*)/s.exec(value)
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

willChange.canArbitraryValue = true
