import { isArbitraryValue } from "../util"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const textOpacity: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "textOpacity")) throw ErrorNotEnable
	const opacities = Object.keys(context.config.theme.textOpacity)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "textOpacity"
		},
	}

	function isMatch(value: string) {
		const match = /^text-opacity-(.*)/s.exec(value)
		if (!match) {
			return false
		}

		const opacity = match[1]

		if (isArbitraryValue(opacity)) {
			return true
		}

		return opacities.some(c => c === opacity)
	}
}
textOpacity.canArbitraryValue = true

export const backgroundOpacity: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "backgroundOpacity")) throw ErrorNotEnable
	const opacities = Object.keys(context.config.theme.backgroundOpacity)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "backgroundOpacity"
		},
	}

	function isMatch(value: string) {
		const match = /^bg-opacity-(.*)/s.exec(value)
		if (!match) {
			return false
		}

		const opacity = match[1]

		if (isArbitraryValue(opacity)) {
			return true
		}

		return opacities.some(c => c === opacity)
	}
}
backgroundOpacity.canArbitraryValue = true

export const borderOpacity: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "borderOpacity")) throw ErrorNotEnable
	const opacities = Object.keys(context.config.theme.borderOpacity)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "borderOpacity"
		},
	}

	function isMatch(value: string) {
		const match = /^border-opacity-(.*)/s.exec(value)
		if (!match) {
			return false
		}

		const opacity = match[1]

		if (isArbitraryValue(opacity)) {
			return true
		}

		return opacities.some(c => c === opacity)
	}
}
borderOpacity.canArbitraryValue = true

export const placeholderOpacity: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "placeholderOpacity")) throw ErrorNotEnable
	const opacities = Object.keys(context.config.theme.placeholderOpacity)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "placeholderOpacity"
		},
	}

	function isMatch(value: string) {
		const match = /^placeholder-opacity-(.*)/s.exec(value)
		if (!match) {
			return false
		}

		const opacity = match[1]

		if (isArbitraryValue(opacity)) {
			return true
		}

		return opacities.some(c => c === opacity)
	}
}
placeholderOpacity.canArbitraryValue = true

export const divideOpacity: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "divideOpacity")) throw ErrorNotEnable
	const opacities = Object.keys(context.config.theme.divideOpacity)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "divideOpacity"
		},
	}

	function isMatch(value: string) {
		const match = /^divide-opacity-(.*)/s.exec(value)
		if (!match) {
			return false
		}

		const opacity = match[1]

		if (isArbitraryValue(opacity)) {
			return true
		}

		return opacities.some(c => c === opacity)
	}
}
divideOpacity.canArbitraryValue = true

export const ringOpacity: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "ringOpacity")) throw ErrorNotEnable
	const opacities = Object.keys(context.config.theme.ringOpacity)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "ringOpacity"
		},
	}

	function isMatch(value: string) {
		const match = /^ring-opacity-(.*)/s.exec(value)
		if (!match) {
			return false
		}

		const opacity = match[1]

		if (isArbitraryValue(opacity)) {
			return true
		}

		return opacities.some(c => c === opacity)
	}
}
ringOpacity.canArbitraryValue = true

export const opacity: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "opacity")) throw ErrorNotEnable
	const opacities = Object.keys(context.config.theme.opacity)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "opacity"
		},
	}

	function isMatch(value: string) {
		const match = /^opacity-(.*)/s.exec(value)
		if (!match) {
			return false
		}

		const opacity = match[1]

		if (isArbitraryValue(opacity)) {
			return true
		}

		return opacities.some(c => c === opacity)
	}
}
opacity.canArbitraryValue = true

export const backdropOpacity: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "backdropOpacity")) throw ErrorNotEnable
	const opacities = Object.keys(context.config.theme.backdropOpacity)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "backdropOpacity"
		},
	}

	function isMatch(value: string) {
		const match = /^backdrop-opacity-(.*)/s.exec(value)
		if (!match) {
			return false
		}

		const opacity = match[1]

		if (isArbitraryValue(opacity)) {
			return true
		}

		return opacities.some(c => c === opacity)
	}
}
backdropOpacity.canArbitraryValue = true
