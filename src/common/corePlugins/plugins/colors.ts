import { is, isArbitraryValue } from "../util"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

function findColors(palette: Tailwind.ResolvedPalette): string[] {
	const names: string[] = []
	for (const prop in palette) {
		const c = palette[prop]
		if (typeof c === "object") {
			for (const k in c) {
				if (k === "DEFAULT") {
					names.push(prop)
					continue
				}
				names.push(`${prop}-${k}`)
			}
		} else if (typeof c === "string" || typeof c === "number") {
			if (prop !== "DEFAULT") {
				names.push(`${prop}`)
			}
		} else if (typeof c === "function") {
			const a = c({ opacityValue: "1", opacityVariable: "" })
			if (typeof a === "object") {
				for (const k in a) {
					if (k === "DEFAULT") {
						names.push(prop)
						continue
					}
					names.push(`${prop}-${k}`)
				}
			} else if (typeof a === "string" || typeof a === "number") {
				names.push(`${prop}`)
			}
		}
	}
	return names
}

/**
 * @param value form: `color`, `[color]`, `[color]/number`, `[color]/[number]`
 */
function isColor(value: string, colors: string[], checkValueType: boolean, opacities?: string[] | null | undefined) {
	const index = value.lastIndexOf("/")
	const n = value.charCodeAt(index + 1)
	if (index === -1 || Number.isNaN(n) || (n !== 91 && (n < 48 || n > 57))) {
		if (isArbitraryValue(value)) {
			if (checkValueType) {
				const val = value.slice(1, -1).trim()
				return is(val, "color")
			}
			return true
		}
		return colors.some(c => c === value)
	}

	if (!opacities) {
		return false
	}

	if (value.indexOf("/") !== index) {
		return false
	}

	const opacity = value.slice(index + 1)
	if (isArbitraryValue(opacity)) {
		return true
	}

	return opacities.some(c => c === opacity)
}

export const backgroundColor: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "backgroundColor")) throw ErrorNotEnable
	const colors = findColors(context.config.theme.backgroundColor)
	const opacities = context.config.corePlugins.some(c => c === "backgroundOpacity")
		? Object.keys(context.config.theme.backgroundOpacity)
		: null

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "backgroundColor"
		},
	}

	function isMatch(value: string) {
		const match = /^bg-(.*)/s.exec(value)
		if (!match) return false
		return isColor(match[1], colors, true, opacities)
	}
}
backgroundColor.canArbitraryValue = true

export const placeholderColor: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "placeholderColor")) throw ErrorNotEnable
	const colors = findColors(context.config.theme.placeholderColor)
	const opacities = context.config.corePlugins.some(c => c === "placeholderOpacity")
		? Object.keys(context.config.theme.placeholderOpacity)
		: null

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "placeholderColor"
		},
	}

	function isMatch(value: string) {
		const match = /^placeholder-(.*)/s.exec(value)
		if (!match) return false
		return isColor(match[1], colors, false, opacities)
	}
}
placeholderColor.canArbitraryValue = true

export const divideColor: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "divideColor")) throw ErrorNotEnable
	const colors = findColors(context.config.theme.divideColor)
	const opacities = context.config.corePlugins.some(c => c === "divideOpacity")
		? Object.keys(context.config.theme.divideOpacity)
		: null

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "divideColor"
		},
	}

	function isMatch(value: string) {
		const match = /^divide-(.*)/s.exec(value)
		if (!match) return false
		return isColor(match[1], colors, false, opacities)
	}
}
divideColor.canArbitraryValue = true

export const caretColor: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "caretColor")) throw ErrorNotEnable
	const colors = findColors(context.config.theme.caretColor)
	const opacities = context.config.corePlugins.some(c => c === "opacity")
		? Object.keys(context.config.theme.opacity)
		: null

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "caretColor"
		},
	}

	function isMatch(value: string) {
		const match = /^caret-(.*)/s.exec(value)
		if (!match) return false
		return isColor(match[1], colors, false, opacities)
	}
}
caretColor.canArbitraryValue = true

export const gradientColorStops: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "gradientColorStops")) throw ErrorNotEnable
	const colors = findColors(context.config.theme.gradientColorStops)
	const opacities = context.config.corePlugins.some(c => c === "opacity")
		? Object.keys(context.config.theme.opacity)
		: null

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "gradientColorStops"
		},
	}

	function isMatch(value: string) {
		const match = /^(?:from-|to-|via-)(.*)/s.exec(value)
		if (!match) return false
		return isColor(match[1], colors, false, opacities)
	}
}
gradientColorStops.canArbitraryValue = true

export const fill: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "fill")) throw ErrorNotEnable
	const colors = findColors(context.config.theme.fill)
	const opacities = context.config.corePlugins.some(c => c === "opacity")
		? Object.keys(context.config.theme.opacity)
		: null

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "fill"
		},
	}

	function isMatch(value: string) {
		const match = /^fill-(.*)/s.exec(value)
		if (!match) return false
		return isColor(match[1], colors, false, opacities)
	}
}
fill.canArbitraryValue = true

export const textColor: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "textColor")) throw ErrorNotEnable
	const colors = findColors(context.config.theme.textColor)
	const opacities = context.config.corePlugins.some(c => c === "textOpacity")
		? Object.keys(context.config.theme.textOpacity)
		: null

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "textColor"
		},
	}

	function isMatch(value: string) {
		const match = /^text-(.*)/s.exec(value)
		if (!match) return false
		return isColor(match[1], colors, true, opacities)
	}
}
textColor.canArbitraryValue = true

export const borderColor: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "borderColor")) throw ErrorNotEnable
	const colors = findColors(context.config.theme.borderColor)
	const opacities = context.config.corePlugins.some(c => c === "borderOpacity")
		? Object.keys(context.config.theme.borderOpacity)
		: null

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "borderColor"
		},
	}

	function isMatch(value: string) {
		const match = /^border-(?:x-|y-|t-|r-|b-|l-)?(.*)/s.exec(value)
		if (!match) return false
		return isColor(match[1], colors, true, opacities)
	}
}
borderColor.canArbitraryValue = true

export const stroke: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "stroke")) throw ErrorNotEnable
	const colors = findColors(context.config.theme.stroke)
	const opacities = context.config.corePlugins.some(c => c === "opacity")
		? Object.keys(context.config.theme.opacity)
		: null

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "stroke"
		},
	}

	function isMatch(value: string) {
		const match = /^stroke-(.*)/s.exec(value)
		if (!match) return false

		value = match[1]
		const index = value.lastIndexOf("/")
		const n = value.charCodeAt(index + 1)
		if (index === -1 || Number.isNaN(n) || (n !== 91 && (n < 48 || n > 57))) {
			if (isArbitraryValue(value)) {
				const val = value.slice(1, -1).trim()
				return is(val, "color", "url")
			}
			return colors.some(c => c === value)
		}

		if (!opacities) {
			return false
		}

		if (value.indexOf("/") !== index) {
			return false
		}

		const opacity = value.slice(index + 1)
		if (isArbitraryValue(opacity)) {
			return true
		}

		return opacities.some(c => c === opacity)
	}
}
stroke.canArbitraryValue = true

export const ringColor: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "ringColor")) throw ErrorNotEnable
	const colors = findColors(context.config.theme.ringColor)
	const opacities = context.config.corePlugins.some(c => c === "ringOpacity")
		? Object.keys(context.config.theme.ringOpacity)
		: null

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "ringColor"
		},
	}

	function isMatch(value: string) {
		const match = /^ring-(.*)/s.exec(value)
		if (!match) return false
		return isColor(match[1], colors, true, opacities)
	}
}
ringColor.canArbitraryValue = true

export const ringOffsetColor: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "ringOffsetColor")) throw ErrorNotEnable
	const colors = findColors(context.config.theme.ringOffsetColor)
	const opacities = context.config.corePlugins.some(c => c === "ringOpacity")
		? Object.keys(context.config.theme.ringOpacity)
		: null

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "ringOffsetColor"
		},
	}

	function isMatch(value: string) {
		const match = /^ring-offset-(.*)/s.exec(value)
		if (!match) return false
		return isColor(match[1], colors, true, opacities)
	}
}
ringOffsetColor.canArbitraryValue = true
