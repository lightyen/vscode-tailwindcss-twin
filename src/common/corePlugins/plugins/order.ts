import { isArbitraryValue } from "../util"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const order: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "order")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.order)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "order"
		},
	}

	function isMatch(value: string) {
		const match = /^-?order-(.*)/s.exec(value)
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
order.canArbitraryValue = true
