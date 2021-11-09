import { isArbitraryValue } from "../util"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const filter: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "filter")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "filter"
		},
	}

	function isMatch(value: string) {
		return value === "filter" || value === "filter-none"
	}
}
filter.canArbitraryValue = false

export const backdropFilter: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "backdropFilter")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "backdropFilter"
		},
	}

	function isMatch(value: string) {
		return value === "backdrop-filter" || value === "backdrop-filter-none"
	}
}
backdropFilter.canArbitraryValue = false

export const brightness: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "brightness")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.brightness)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "brightness"
		},
	}

	function isMatch(value: string) {
		const match = /^brightness-(.*)/s.exec(value)
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
brightness.canArbitraryValue = true

export const backdropBrightness: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "backdropBrightness")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.backdropBrightness)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "backdropBrightness"
		},
	}

	function isMatch(value: string) {
		const match = /^backdrop-brightness-(.*)/s.exec(value)
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
backdropBrightness.canArbitraryValue = true

export const contrast: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "contrast")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.contrast)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "contrast"
		},
	}

	function isMatch(value: string) {
		const match = /^contrast-(.*)/s.exec(value)
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
contrast.canArbitraryValue = true

export const backdropContrast: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "backdropContrast")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.backdropContrast)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "backdropContrast"
		},
	}

	function isMatch(value: string) {
		const match = /^backdrop-contrast-(.*)/s.exec(value)
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
backdropContrast.canArbitraryValue = true

export const hueRotate: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "hueRotate")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.hueRotate)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "hueRotate"
		},
	}

	function isMatch(value: string) {
		const match = /^-?hue-rotate-(.*)/s.exec(value)
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
hueRotate.canArbitraryValue = true

export const backdropHueRotate: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "backdropHueRotate")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.backdropHueRotate)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "backdropHueRotate"
		},
	}

	function isMatch(value: string) {
		const match = /^-?backdrop-hue-rotate-(.*)/s.exec(value)
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
backdropHueRotate.canArbitraryValue = true

export const saturate: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "saturate")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.saturate)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "saturate"
		},
	}

	function isMatch(value: string) {
		const match = /^saturate-(.*)/s.exec(value)
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
saturate.canArbitraryValue = true

export const backdropSaturate: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "backdropSaturate")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.backdropSaturate)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "backdropSaturate"
		},
	}

	function isMatch(value: string) {
		const match = /^backdrop-saturate-(.*)/s.exec(value)
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
backdropSaturate.canArbitraryValue = true

function getDefault(obj: Record<string, unknown>): [boolean, string[]] {
	const hasDefault = Object.prototype.hasOwnProperty.call(obj, "DEFAULT")
	const values = Object.keys(obj).filter(v => v !== "DEFAULT")
	return [hasDefault, values]
}

export const grayscale: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "grayscale")) throw ErrorNotEnable
	const [hasDefault, size] = getDefault(context.config.theme.grayscale)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "grayscale"
		},
	}

	function isMatch(value: string) {
		const match = /^grayscale(?:-|\b)(.*)/s.exec(value)
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
		return size.some(c => c === val)
	}
}
grayscale.canArbitraryValue = true

export const backdropGrayscale: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "backdropGrayscale")) throw ErrorNotEnable
	const [hasDefault, size] = getDefault(context.config.theme.backdropGrayscale)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "backdropGrayscale"
		},
	}

	function isMatch(value: string) {
		const match = /^backdrop-grayscale(?:-|\b)(.*)/s.exec(value)
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
		return size.some(c => c === val)
	}
}
backdropGrayscale.canArbitraryValue = true

export const invert: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "invert")) throw ErrorNotEnable
	const [hasDefault, size] = getDefault(context.config.theme.invert)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "invert"
		},
	}

	function isMatch(value: string) {
		const match = /^invert(?:-|\b)(.*)/s.exec(value)
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
		return size.some(c => c === val)
	}
}
invert.canArbitraryValue = true

export const backdropInvert: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "backdropInvert")) throw ErrorNotEnable
	const [hasDefault, size] = getDefault(context.config.theme.backdropInvert)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "backdropInvert"
		},
	}

	function isMatch(value: string) {
		const match = /^backdrop-invert(?:-|\b)(.*)/s.exec(value)
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
		return size.some(c => c === val)
	}
}
backdropInvert.canArbitraryValue = true

export const sepia: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "sepia")) throw ErrorNotEnable
	const [hasDefault, size] = getDefault(context.config.theme.sepia)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "sepia"
		},
	}

	function isMatch(value: string) {
		const match = /^sepia(?:-|\b)(.*)/s.exec(value)
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
		return size.some(c => c === val)
	}
}
sepia.canArbitraryValue = true

export const backdropSepia: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "backdropSepia")) throw ErrorNotEnable
	const [hasDefault, size] = getDefault(context.config.theme.backdropSepia)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "backdropSepia"
		},
	}

	function isMatch(value: string) {
		const match = /^backdrop-sepia(?:-|\b)(.*)/s.exec(value)
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
		return size.some(c => c === val)
	}
}
backdropSepia.canArbitraryValue = true
