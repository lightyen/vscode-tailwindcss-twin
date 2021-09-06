import isArbitraryValue from "./common/isArbitraryValue"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const inset: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "inset"
		if (!this.context.resolved.corePlugins.some(c => c === "inset")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.inset)
	}
	isMatch(value: string) {
		const match = /^-?(?:inset-x-|inset-y-|inset-|top-|right-|bottom-|left-)(.*)/.exec(value)
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

export const margin: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "margin"
		if (!this.context.resolved.corePlugins.some(c => c === "margin")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.margin)
	}
	isMatch(value: string) {
		const match = /^-?(?:m|mx|my|mt|mr|mb|ml)-(.*)/.exec(value)
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

export const space: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "space"
		if (!this.context.resolved.corePlugins.some(c => c === "space")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.space)
	}
	isMatch(value: string) {
		const match = /^-?space-(?:x|y)-(.*)/.exec(value)
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

		return this.values.some(c => c === val) || value === "space-y-reverse" || value === "space-x-reverse"
	}
}

export const padding: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "padding"
		if (!this.context.resolved.corePlugins.some(c => c === "padding")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.padding)
	}
	isMatch(value: string) {
		const match = /^(?:p|px|py|pt|pr|pb|pl)-(.*)/.exec(value)
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

export const gap: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "gap"
		if (!this.context.resolved.corePlugins.some(c => c === "gap")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.gap)
	}
	isMatch(value: string) {
		const match = /^(?:gap-x-|gap-y-|gap-)(.*)/.exec(value)
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

export const height: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "height"
		if (!this.context.resolved.corePlugins.some(c => c === "height")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.height)
	}
	isMatch(value: string) {
		const match = /^h-(.*)/.exec(value)
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

export const minHeight: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "minHeight"
		if (!this.context.resolved.corePlugins.some(c => c === "minHeight")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.minHeight)
	}
	isMatch(value: string) {
		const match = /^min-h-(.*)/.exec(value)
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

export const maxHeight: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "maxHeight"
		if (!this.context.resolved.corePlugins.some(c => c === "maxHeight")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.maxHeight)
	}
	isMatch(value: string) {
		const match = /^max-h-(.*)/.exec(value)
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

export const width: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "width"
		if (!this.context.resolved.corePlugins.some(c => c === "width")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.width)
	}
	isMatch(value: string) {
		const match = /^w-(.*)/.exec(value)
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

export const minWidth: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "minWidth"
		if (!this.context.resolved.corePlugins.some(c => c === "minWidth")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.minWidth)
	}
	isMatch(value: string) {
		const match = /^min-w-(.*)/.exec(value)
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

export const maxWidth: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "maxWidth"
		if (!this.context.resolved.corePlugins.some(c => c === "maxWidth")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.maxWidth)
	}
	isMatch(value: string) {
		const match = /^max-w-(.*)/.exec(value)
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
