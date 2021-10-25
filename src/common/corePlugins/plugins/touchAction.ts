import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const touchAction: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "touchAction")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "touchAction"
		},
	}

	function isMatch(value: string) {
		const match = /^touch-(.*)/s.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		return (
			val === "auto" ||
			val === "none" ||
			val === "pan-x" ||
			val === "pan-left" ||
			val === "pan-right" ||
			val === "pan-y" ||
			val === "pan-up" ||
			val === "pan-down" ||
			val === "pinch-zoom" ||
			val === "manipulation"
		)
	}
}
touchAction.canArbitraryValue = false
