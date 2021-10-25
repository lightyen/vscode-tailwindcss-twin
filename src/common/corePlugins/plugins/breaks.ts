import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const breakBefore: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "breakBefore")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "breakBefore"
		},
	}

	function isMatch(value: string) {
		const match = /^break-before-(.*)/s.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		return (
			val === "auto" ||
			val === "avoid" ||
			val === "all" ||
			val === "avoid-page" ||
			val === "page" ||
			val === "left" ||
			val === "right" ||
			val === "column"
		)
	}
}
breakBefore.canArbitraryValue = false

export const breakInside: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "breakInside")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "breakInside"
		},
	}

	function isMatch(value: string) {
		const match = /^break-inside-(.*)/s.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		return val === "auto" || val === "avoid" || val === "avoid-page" || val === "avoid-column"
	}
}
breakInside.canArbitraryValue = false

export const breakAfter: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "breakAfter")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "breakAfter"
		},
	}

	function isMatch(value: string) {
		const match = /^break-after-(.*)/s.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		return (
			val === "auto" ||
			val === "avoid" ||
			val === "all" ||
			val === "avoid-page" ||
			val === "page" ||
			val === "left" ||
			val === "right" ||
			val === "column"
		)
	}
}
breakAfter.canArbitraryValue = false
