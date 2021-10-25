import { isArbitraryValue } from "../util"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const objectFit: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "objectFit")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "objectFit"
		},
	}

	function isMatch(value: string) {
		return (
			value === "object-contain" ||
			value === "object-cover" ||
			value === "object-fill" ||
			value === "object-none" ||
			value === "object-scale-down"
		)
	}
}
objectFit.canArbitraryValue = false

export const objectPosition: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "objectPosition")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.objectPosition)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "objectPosition"
		},
	}

	function isMatch(value: string) {
		const match = /^object-(.*)/s.exec(value)
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
objectPosition.canArbitraryValue = true
