import isArbitraryValue from "./common/isArbitraryValue"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const outline: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "outline"
		if (!this.context.resolved.corePlugins.some(c => c === "outline")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.outline)
	}
	isMatch(value: string) {
		const match = /^outline-(.*)/.exec(value)
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
