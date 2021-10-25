import { isArbitraryValue } from "../util"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const scrollSnapType: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "scrollSnapType")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "scrollSnapType"
		},
	}

	function isMatch(value: string) {
		const match = /^snap-(.*)/s.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		return (
			val === "none" || val === "x" || val === "y" || val === "both" || val === "mandatory" || val === "proximity"
		)
	}
}
scrollSnapType.canArbitraryValue = false

export const scrollSnapAlign: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "scrollSnapAlign")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "scrollSnapAlign"
		},
	}

	function isMatch(value: string) {
		const match = /^snap-(.*)/s.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		return val === "start" || val === "end" || val === "center" || val === "align-none"
	}
}
scrollSnapAlign.canArbitraryValue = false

export const scrollSnapStop: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "scrollSnapStop")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "scrollSnapStop"
		},
	}

	function isMatch(value: string) {
		const match = /^snap-(.*)/s.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		return val === "normal" || val === "always"
	}
}
scrollSnapStop.canArbitraryValue = false

export const scrollMargin: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "scrollMargin")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.scrollMargin)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "scrollMargin"
		},
	}

	function isMatch(value: string) {
		const match = /^-?scroll-(?:m|mx|my|mt|mr|mb|ml)-(.*)/s.exec(value)
		if (!match) {
			return false
		}

		const isNegative = match[0].charCodeAt(0) === 45
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
scrollMargin.canArbitraryValue = true

export const scrollPadding: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "scrollPadding")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.scrollPadding)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "scrollPadding"
		},
	}

	function isMatch(value: string) {
		const match = /^scroll-(?:p|px|py|pt|pr|pb|pl)-(.*)/s.exec(value)
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
scrollPadding.canArbitraryValue = true

export const scrollBehavior: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "scrollBehavior")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "scrollBehavior"
		},
	}

	function isMatch(value: string) {
		return value === "scroll-auto" || value === "scroll-smooth"
	}
}
scrollBehavior.canArbitraryValue = true
