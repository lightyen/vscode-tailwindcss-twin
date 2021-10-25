import { isArbitraryValue } from "../util"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const aspectRatio: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "aspectRatio")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.aspectRatio)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "aspectRatio"
		},
	}

	function isMatch(value: string) {
		const match = /^aspect-(.*)/s.exec(value)
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

aspectRatio.canArbitraryValue = true
