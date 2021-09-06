import isArbitraryValue from "./common/isArbitraryValue"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const objectFit: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "objectFit"
		if (!this.context.resolved.corePlugins.some(c => c === "objectFit")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return (
			value === "object-contain" ||
			value === "object-cover" ||
			value === "object-fill" ||
			value === "object-none" ||
			value === "object-scale-down"
		)
	}
}

export const objectPosition: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "objectPosition"
		if (!this.context.resolved.corePlugins.some(c => c === "objectPosition")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.objectPosition)
	}

	isMatch(value: string) {
		const match = /^object-(.*)/.exec(value)
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
