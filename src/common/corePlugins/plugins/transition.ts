import { isArbitraryValue } from "../util"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

function getDefault(obj: Record<string, unknown>): [boolean, string[]] {
	const hasDefault = Object.prototype.hasOwnProperty.call(obj, "DEFAULT")
	const values = Object.keys(obj).filter(v => v !== "DEFAULT")
	return [hasDefault, values]
}

export const transitionProperty: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "transitionProperty")) throw ErrorNotEnable
	const [hasDefault, values] = getDefault(context.config.theme.transitionProperty)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "transitionProperty"
		},
	}

	function isMatch(value: string) {
		const match = /^transition(?:-|\b)(.*)/s.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		if (hasDefault && (val === "" || val === "DEFAULT")) {
			return true
		}

		if (isArbitraryValue(val)) {
			return true
		}

		return values.some(c => c === val)
	}
}
transitionProperty.canArbitraryValue = true

export const transitionDelay: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "transitionDelay")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.transitionDelay)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "transitionDelay"
		},
	}

	function isMatch(value: string) {
		const match = /^delay-(.*)/s.exec(value)
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
transitionDelay.canArbitraryValue = true

export const transitionDuration: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "transitionDuration")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.transitionDuration)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "transitionDuration"
		},
	}

	function isMatch(value: string) {
		const match = /^duration-(.*)/s.exec(value)
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
transitionDuration.canArbitraryValue = true

export const transitionTimingFunction: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "transitionTimingFunction")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.transitionTimingFunction)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "transitionTimingFunction"
		},
	}

	function isMatch(value: string) {
		const match = /^ease-(.*)/s.exec(value)
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
transitionTimingFunction.canArbitraryValue = true
