import { isArbitraryValue } from "../util"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const inset: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "inset")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.inset)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "inset"
		},
	}

	function isMatch(value: string) {
		const match = /^-?(?:inset-x-|inset-y-|inset-|top-|right-|bottom-|left-)(.*)/s.exec(value)
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
inset.canArbitraryValue = true

export const margin: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "margin")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.margin)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "margin"
		},
	}

	function isMatch(value: string) {
		const match = /^-?(?:m|mx|my|mt|mr|mb|ml)-(.*)/s.exec(value)
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
margin.canArbitraryValue = true

export const space: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "space")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.space)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "space"
		},
	}

	function isMatch(value: string) {
		const match = /^-?space-(?:x|y)-(.*)/s.exec(value)
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

		return values.some(c => c === val) || value === "space-y-reverse" || value === "space-x-reverse"
	}
}
space.canArbitraryValue = true

export const padding: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "padding")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.padding)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "padding"
		},
	}

	function isMatch(value: string) {
		const match = /^(?:p|px|py|pt|pr|pb|pl)-(.*)/s.exec(value)
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
padding.canArbitraryValue = true

export const gap: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "gap")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.gap)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "gap"
		},
	}

	function isMatch(value: string) {
		const match = /^(?:gap-x-|gap-y-|gap-)(.*)/s.exec(value)
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
gap.canArbitraryValue = true

export const height: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "height")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.height)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "height"
		},
	}

	function isMatch(value: string) {
		const match = /^h-(.*)/s.exec(value)
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
height.canArbitraryValue = true

export const minHeight: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "minHeight")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.minHeight)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "minHeight"
		},
	}

	function isMatch(value: string) {
		const match = /^min-h-(.*)/s.exec(value)
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
minHeight.canArbitraryValue = true

export const maxHeight: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "maxHeight")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.maxHeight)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "maxHeight"
		},
	}

	function isMatch(value: string) {
		const match = /^max-h-(.*)/s.exec(value)
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
maxHeight.canArbitraryValue = true

export const width: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "width")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.width)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "width"
		},
	}

	function isMatch(value: string) {
		const match = /^w-(.*)/s.exec(value)
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
width.canArbitraryValue = true

export const minWidth: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "minWidth")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.minWidth)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "minWidth"
		},
	}

	function isMatch(value: string) {
		const match = /^min-w-(.*)/s.exec(value)
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
minWidth.canArbitraryValue = true

export const maxWidth: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "maxWidth")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.maxWidth)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "maxWidth"
		},
	}

	function isMatch(value: string) {
		const match = /^max-w-(.*)/s.exec(value)
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
maxWidth.canArbitraryValue = true
