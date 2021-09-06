import isArbitraryValue from "./common/isArbitraryValue"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

function getDefault(obj: Record<string, unknown>): [boolean, string[]] {
	const hasDefault = Object.prototype.hasOwnProperty.call(obj, "DEFAULT")
	const values = Object.keys(obj).filter(v => v !== "DEFAULT")
	return [hasDefault, values]
}

export const transitionProperty: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	hasDefault: boolean
	constructor(private context: Context) {
		this.name = "transitionProperty"
		if (!this.context.resolved.corePlugins.some(c => c === "transitionProperty")) {
			throw ErrorNotEnable
		}
		;[this.hasDefault, this.values] = getDefault(this.context.resolved.theme.transitionProperty)
	}
	isMatch(value: string) {
		const match = /^transition(?:-|\b)(.*)/.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		if (this.hasDefault && val === "") {
			return true
		}

		if (isArbitraryValue(val)) {
			return true
		}

		return this.values.some(c => c === val)
	}
}

export const transitionDelay: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "transitionDelay"
		if (!this.context.resolved.corePlugins.some(c => c === "transitionDelay")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.transitionDelay)
	}
	isMatch(value: string) {
		const match = /^delay-(.*)/.exec(value)
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

export const transitionDuration: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "transitionDuration"
		if (!this.context.resolved.corePlugins.some(c => c === "transitionDuration")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.transitionDuration)
	}
	isMatch(value: string) {
		const match = /^duration-(.*)/.exec(value)
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

export const transitionTimingFunction: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "transitionTimingFunction"
		if (!this.context.resolved.corePlugins.some(c => c === "transitionTimingFunction")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.transitionTimingFunction)
	}
	isMatch(value: string) {
		const match = /^ease-(.*)/.exec(value)
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
