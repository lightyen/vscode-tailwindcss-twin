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
		const match = /^order-(.*)/s.exec(value)
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
order.canArbitraryValue = true

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
		const match = /^z-(.*)/s.exec(value)
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
zIndex.canArbitraryValue = true
