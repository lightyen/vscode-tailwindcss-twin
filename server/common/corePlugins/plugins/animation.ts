import isArbitraryValue from "./common/isArbitraryValue"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const animation: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "animation"
		if (!this.context.resolved.corePlugins.some(c => c === "animation")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.animation)
	}
	isMatch(value: string) {
		const match = /^animate-(.*)/.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		if (isArbitraryValue(val)) {
			return true
		}

		return this.values.some(c => c === val)
	}
}
