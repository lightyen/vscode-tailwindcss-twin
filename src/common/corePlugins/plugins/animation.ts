import { isArbitraryValue } from "../util"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const animation: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "animation")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.animation)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "animation"
		},
	}

	function isMatch(value: string) {
		const match = /^animate-(.*)/s.exec(value)
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
animation.canArbitraryValue = true
