import { isArbitraryValue } from "../util"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const textIndent: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "textIndent")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.textIndent)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "textIndent"
		},
	}

	function isMatch(value: string) {
		const match = /^-?indent-(.*)/s.exec(value)
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
textIndent.canArbitraryValue = true
