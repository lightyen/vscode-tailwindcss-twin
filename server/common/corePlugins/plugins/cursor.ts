import isArbitraryValue from "./common/isArbitraryValue"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const cursor: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "cursor"
		if (!this.context.resolved.corePlugins.some(c => c === "cursor")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.cursor)
	}
	isMatch(value: string) {
		const match = /^cursor-(.*)/.exec(value)
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
