import isArbitraryValue from "./common/isArbitraryValue"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const order: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "order"
		if (!this.context.resolved.corePlugins.some(c => c === "order")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.order)
	}
	isMatch(value: string) {
		const match = /^order-(.*)/.exec(value)
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

export const zIndex: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "zIndex"
		if (!this.context.resolved.corePlugins.some(c => c === "zIndex")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.zIndex)
	}
	isMatch(value: string) {
		const match = /^z-(.*)/.exec(value)
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
