import { isArbitraryValue } from "../util"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const flex: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "flex")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.flex)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "flex"
		},
	}

	function isMatch(value: string) {
		const match = /^flex-(.*)/s.exec(value)
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
flex.canArbitraryValue = true

export const flexDirection: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "flexDirection")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "flexDirection"
		},
	}

	function isMatch(value: string) {
		return (
			value === "flex-row" || value === "flex-row-reverse" || value === "flex-col" || value === "flex-col-reverse"
		)
	}
}
flexDirection.canArbitraryValue = false

export const flexWrap: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "flexWrap")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "flexWrap"
		},
	}

	function isMatch(value: string) {
		return value === "flex-wrap" || value === "flex-nowrap" || value === "flex-wrap-reverse"
	}
}
flexWrap.canArbitraryValue = false

function getDefault(obj: Record<string, unknown>): [boolean, string[]] {
	const hasDefault = Object.prototype.hasOwnProperty.call(obj, "DEFAULT")
	const values = Object.keys(obj).filter(v => v !== "DEFAULT")
	return [hasDefault, values]
}

export const flexGrow: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "flexGrow")) throw ErrorNotEnable
	const [hasDefault, values] = getDefault(context.config.theme.flexGrow)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "flexGrow"
		},
	}

	function isMatch(value: string) {
		const match = /^flex-grow(?:-|\b)(.*)/s.exec(value)
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
		return values.some(c => c === val)
	}
}
flexGrow.canArbitraryValue = true

export const flexShrink: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "flexShrink")) throw ErrorNotEnable
	const [hasDefault, values] = getDefault(context.config.theme.flexShrink)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "flexShrink"
		},
	}

	function isMatch(value: string) {
		const match = /^flex-shrink(?:-|\b)(.*)/s.exec(value)
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
		return values.some(c => c === val)
	}
}
flexShrink.canArbitraryValue = true
