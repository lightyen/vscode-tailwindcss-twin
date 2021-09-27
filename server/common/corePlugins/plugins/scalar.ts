import isArbitraryValue from "./common/isArbitraryValue"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const order: PluginConstructor = (context: Context): Plugin => {
	if (!context.resolved.corePlugins.some(c => c === "order")) throw ErrorNotEnable
	const values = Object.keys(context.resolved.theme.order)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "order"
		},
	}

	function isMatch(value: string) {
		const match = /^order-(.*)/.exec(value)
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
	if (!context.resolved.corePlugins.some(c => c === "zIndex")) throw ErrorNotEnable
	const values = Object.keys(context.resolved.theme.zIndex)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "zIndex"
		},
	}

	function isMatch(value: string) {
		const match = /^z-(.*)/.exec(value)
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
