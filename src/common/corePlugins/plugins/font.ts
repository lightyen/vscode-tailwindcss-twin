import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const fontFamily: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "fontFamily")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.fontFamily)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "fontFamily"
		},
	}

	function isMatch(value: string) {
		const match = /^font-(.*)/s.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		return values.some(c => c === val)
	}
}
fontFamily.canArbitraryValue = false

export const fontWeight: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "fontWeight")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.fontWeight)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "fontWeight"
		},
	}

	function isMatch(value: string) {
		const match = /^font-(.*)/s.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		return values.some(c => c === val)
	}
}
fontWeight.canArbitraryValue = false

export const fontStyle: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "fontStyle")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "fontStyle"
		},
	}

	function isMatch(value: string) {
		return value === "italic" || value === "not-italic"
	}
}
fontStyle.canArbitraryValue = false

export const fontVariantNumeric: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "fontVariantNumeric")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "fontVariantNumeric"
		},
	}

	function isMatch(value: string) {
		return (
			value === "normal-nums" ||
			value === "ordinal" ||
			value === "slashed-zero" ||
			value === "lining-nums" ||
			value === "oldstyle-nums" ||
			value === "proportional-nums" ||
			value === "tabular-nums" ||
			value === "diagonal-fractions" ||
			value === "stacked-fractions"
		)
	}
}
fontVariantNumeric.canArbitraryValue = false

export const fontSmoothing: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "fontSmoothing")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "fontSmoothing"
		},
	}

	function isMatch(value: string) {
		return value === "antialiased" || value === "subpixel-antialiased"
	}
}
fontSmoothing.canArbitraryValue = false
