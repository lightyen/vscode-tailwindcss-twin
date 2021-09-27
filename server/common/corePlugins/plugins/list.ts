import isArbitraryValue from "./common/isArbitraryValue"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const listStyleType: PluginConstructor = (context: Context): Plugin => {
	if (!context.resolved.corePlugins.some(c => c === "listStyleType")) throw ErrorNotEnable
	const values = Object.keys(context.resolved.theme.listStyleType)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "listStyleType"
		},
	}

	function isMatch(value: string) {
		const match = /^list-(.*)/.exec(value)
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
listStyleType.canArbitraryValue = true

export const listStylePosition: PluginConstructor = (context: Context): Plugin => {
	if (!context.resolved.corePlugins.some(c => c === "listStylePosition")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "listStylePosition"
		},
	}

	function isMatch(value: string) {
		return value === "list-inside" || value === "list-outside"
	}
}
listStylePosition.canArbitraryValue = false
