import isArbitraryValue from "./common/isArbitraryValue"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

function getDefault(obj: Record<string, unknown>): [boolean, string[]] {
	const hasDefault = Object.prototype.hasOwnProperty.call(obj, "DEFAULT")
	const values = Object.keys(obj).filter(v => v !== "DEFAULT")
	return [hasDefault, values]
}

export const transitionProperty: PluginConstructor = (context: Context): Plugin => {
	if (!context.resolved.corePlugins.some(c => c === "transitionProperty")) throw ErrorNotEnable
	const [hasDefault, values] = getDefault(context.resolved.theme.transitionProperty)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "transitionProperty"
		},
	}

	function isMatch(value: string) {
		const match = /^transition(?:-|\b)(.*)/.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		if (hasDefault && val === "") {
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
	if (!context.resolved.corePlugins.some(c => c === "transitionDelay")) throw ErrorNotEnable
	const values = Object.keys(context.resolved.theme.transitionDelay)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "transitionDelay"
		},
	}

	function isMatch(value: string) {
		const match = /^delay-(.*)/.exec(value)
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
	if (!context.resolved.corePlugins.some(c => c === "transitionDuration")) throw ErrorNotEnable
	const values = Object.keys(context.resolved.theme.transitionDuration)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "transitionDuration"
		},
	}

	function isMatch(value: string) {
		const match = /^duration-(.*)/.exec(value)
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
	if (!context.resolved.corePlugins.some(c => c === "transitionTimingFunction")) throw ErrorNotEnable
	const values = Object.keys(context.resolved.theme.transitionTimingFunction)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "transitionTimingFunction"
		},
	}

	function isMatch(value: string) {
		const match = /^ease-(.*)/.exec(value)
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
