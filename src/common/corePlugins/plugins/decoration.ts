import { is, isArbitraryValue } from "../util"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const textDecoration: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "textDecoration")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "textDecoration"
		},
	}

	function isMatch(value: string) {
		return value === "underline" || value === "overline" || value === "line-through" || value === "no-underline"
	}
}
textDecoration.canArbitraryValue = false

export const textDecorationStyle: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "textDecorationStyle")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "textDecorationStyle"
		},
	}

	function isMatch(value: string) {
		return (
			value === "decoration-solid" ||
			value === "decoration-double" ||
			value === "decoration-dotted" ||
			value === "decoration-dashed" ||
			value === "decoration-wavy"
		)
	}
}
textDecorationStyle.canArbitraryValue = false

export const textDecorationThickness: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "textDecorationThickness")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.textDecorationThickness)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "textDecorationThickness"
		},
	}

	function isMatch(value: string) {
		const match = /^decoration-(.*)/s.exec(value)
		if (!match) {
			return false
		}

		let val = match[1]

		if (isArbitraryValue(val)) {
			val = val.slice(1, -1).trim()
			return is(val, "length", "number", "percentage")
		}

		return values.some(c => c === val)
	}
}
textDecorationThickness.canArbitraryValue = true

export const textUnderlineOffset: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "textUnderlineOffset")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.textUnderlineOffset)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "textUnderlineOffset"
		},
	}

	function isMatch(value: string) {
		const match = /^underline-offset-(.*)/s.exec(value)
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
textUnderlineOffset.canArbitraryValue = true
