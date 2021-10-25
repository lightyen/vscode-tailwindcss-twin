import { isArbitraryValue } from "../util"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const transform: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "transform")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "transform"
		},
	}

	function isMatch(value: string) {
		return (
			value === "transform" ||
			value === "transform-cpu" ||
			value === "transform-gpu" ||
			value === "transform-none"
		)
	}
}
transform.canArbitraryValue = false

export const rotate: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "rotate")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.rotate)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "rotate"
		},
	}

	function isMatch(value: string) {
		const match = /^-?rotate-(.*)/s.exec(value)
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
rotate.canArbitraryValue = true

export const skew: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "skew")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.skew)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "skew"
		},
	}

	function isMatch(value: string) {
		const match = /^-?skew-(?:x-|y-)(.*)/s.exec(value)
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
skew.canArbitraryValue = true

export const scale: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "scale")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.scale)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "scale"
		},
	}

	function isMatch(value: string) {
		const match = /^scale-(?:x-|y-)?(.*)/s.exec(value)
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
scale.canArbitraryValue = true

export const translate: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "translate")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.translate)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "translate"
		},
	}

	function isMatch(value: string) {
		const match = /^-?translate-(?:x|y)-(.*)/s.exec(value)
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
translate.canArbitraryValue = true

export const transformOrigin: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "transformOrigin")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.transformOrigin)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "transformOrigin"
		},
	}

	function isMatch(value: string) {
		const match = /^origin-(.*)/s.exec(value)
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
transformOrigin.canArbitraryValue = true
