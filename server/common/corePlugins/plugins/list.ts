import isArbitraryValue from "./common/isArbitraryValue"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const listStyleType: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "listStyleType"
		if (!this.context.resolved.corePlugins.some(c => c === "listStyleType")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.listStyleType)
	}
	isMatch(value: string) {
		const match = /^list-(.*)/.exec(value)
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

export const listStylePosition: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "listStylePosition"
		if (!this.context.resolved.corePlugins.some(c => c === "listStylePosition")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return value === "list-inside" || value === "list-outside"
	}
}
