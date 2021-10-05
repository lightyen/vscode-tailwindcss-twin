import isArbitraryValue from "./common/isArbitraryValue"
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
		const match = /^-?indent-(.*)/.exec(value)
		if (!match) {
			return false
		}

		const isNegative = match[0][0] === "-"
		let val = match[1]

		if (!isNegative && isArbitraryValue(val)) {
			return true
		}

		if (isNegative) {
			val = "-" + val
		}

		return values.some(c => c === val)
	}
}
textIndent.canArbitraryValue = true
