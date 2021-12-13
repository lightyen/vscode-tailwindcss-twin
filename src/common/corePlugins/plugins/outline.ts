import { is, isArbitraryValue } from "../util"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const outlineStyle: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "outlineStyle")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "outlineStyle"
		},
	}

	function isMatch(value: string) {
		const match = /^outline(?:-|\b)(.*)/s.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		if (val === "") {
			return true
		}

		return val === "dashed" || val === "dotted" || val === "double" || val === "hidden" || val === "none"
	}
}
outlineStyle.canArbitraryValue = false

export const outlineWidth: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "outlineWidth")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.outlineWidth)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "outlineWidth"
		},
	}

	function isMatch(value: string) {
		const match = /^outline-(.*)/s.exec(value)
		if (!match) {
			return false
		}

		let val = match[1]

		if (isArbitraryValue(val)) {
			val = val.slice(1, -1).trim()
			return is(val, "length", "number")
		}

		return values.some(c => c === val)
	}
}
outlineWidth.canArbitraryValue = true

export const outlineOffset: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "outlineOffset")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.outlineOffset)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "outlineOffset"
		},
	}

	function isMatch(value: string) {
		const match = /^outline-offset-(.*)/s.exec(value)
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
outlineOffset.canArbitraryValue = true
