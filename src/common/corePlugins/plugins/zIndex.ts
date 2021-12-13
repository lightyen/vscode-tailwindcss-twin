import { isArbitraryValue } from "../util"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const zIndex: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "zIndex")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.zIndex)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "zIndex"
		},
	}

	function isMatch(value: string) {
		const match = /^-?z-(.*)/s.exec(value)
		if (!match) {
			return false
		}

		const isNegative = match[0].charCodeAt(0) === 45
		const val = match[1]

		if (isArbitraryValue(val)) {
			return !isNegative
		}

		return values.some(c => c === val)
	}
}
zIndex.canArbitraryValue = true
