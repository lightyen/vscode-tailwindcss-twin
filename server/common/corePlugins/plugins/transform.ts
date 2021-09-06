import isArbitraryValue from "./common/isArbitraryValue"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const transform: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "transform"
		if (!this.context.resolved.corePlugins.some(c => c === "transform")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return (
			value === "transform" ||
			value === "transform-cpu" ||
			value === "transform-gpu" ||
			value === "transform-none"
		)
	}
}

export const rotate: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "rotate"
		if (!this.context.resolved.corePlugins.some(c => c === "rotate")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.rotate)
	}
	isMatch(value: string) {
		const match = /^-?rotate-(.*)/.exec(value)
		if (!match) {
			return false
		}

		const isNegative = match[0][0] === "-"
		let val = match[1]

		if (!isNegative && isArbitraryValue(val)) {
			return true
		}

		if (isNegative) {
			val = "-" + val
		}

		return this.values.some(c => c === val)
	}
}

export const skew: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "skew"
		if (!this.context.resolved.corePlugins.some(c => c === "skew")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.skew)
	}
	isMatch(value: string) {
		const match = /^-?skew-(?:x-|y-)(.*)/.exec(value)
		if (!match) {
			return false
		}

		const isNegative = match[0][0] === "-"
		let val = match[1]

		if (!isNegative && isArbitraryValue(val)) {
			return true
		}

		if (isNegative) {
			val = "-" + val
		}

		return this.values.some(c => c === val)
	}
}

export const scale: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "scale"
		if (!this.context.resolved.corePlugins.some(c => c === "scale")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.scale)
	}
	isMatch(value: string) {
		const match = /^scale-(?:x-|y-)?(.*)/.exec(value)
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

export const translate: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "translate"
		if (!this.context.resolved.corePlugins.some(c => c === "translate")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.translate)
	}
	isMatch(value: string) {
		const match = /^-?translate-(?:x|y)-(.*)/.exec(value)
		if (!match) {
			return false
		}

		const isNegative = match[0][0] === "-"
		let val = match[1]

		if (!isNegative && isArbitraryValue(val)) {
			return true
		}

		if (isNegative) {
			val = "-" + val
		}

		return this.values.some(c => c === val)
	}
}

export const transformOrigin: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "transformOrigin"
		if (!this.context.resolved.corePlugins.some(c => c === "transformOrigin")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.transformOrigin)
	}
	isMatch(value: string) {
		const match = /^origin-(.*)/.exec(value)
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
