import isArbitraryValue from "./common/isArbitraryValue"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const flex: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "flex"
		if (!this.context.resolved.corePlugins.some(c => c === "flex")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.flex)
	}
	isMatch(value: string) {
		const match = /^flex-(.*)/.exec(value)
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

export const flexDirection: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "flexDirection"
		if (!this.context.resolved.corePlugins.some(c => c === "flexDirection")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return (
			value === "flex-row" || value === "flex-row-reverse" || value === "flex-col" || value === "flex-col-reverse"
		)
	}
}

export const flexWrap: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "flexWrap"
		if (!this.context.resolved.corePlugins.some(c => c === "flexWrap")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return value === "flex-wrap" || value === "flex-nowrap" || value === "flex-wrap-reverse"
	}
}

function getDefault(obj: Record<string, unknown>): [boolean, string[]] {
	const hasDefault = Object.prototype.hasOwnProperty.call(obj, "DEFAULT")
	const values = Object.keys(obj).filter(v => v !== "DEFAULT")
	return [hasDefault, values]
}

export const flexGrow: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	hasDefault: boolean
	constructor(private context: Context) {
		this.name = "flexGrow"
		if (!this.context.resolved.corePlugins.some(c => c === "flexGrow")) {
			throw ErrorNotEnable
		}
		;[this.hasDefault, this.values] = getDefault(this.context.resolved.theme.flexGrow)
	}
	isMatch(value: string) {
		const match = /^flex-grow(?:-|\b)(.*)/.exec(value)
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

export const flexShrink: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	hasDefault: boolean
	constructor(private context: Context) {
		this.name = "flexShrink"
		if (!this.context.resolved.corePlugins.some(c => c === "flexShrink")) {
			throw ErrorNotEnable
		}
		;[this.hasDefault, this.values] = getDefault(this.context.resolved.theme.flexShrink)
	}
	isMatch(value: string) {
		const match = /^flex-shrink(?:-|\b)(.*)/.exec(value)
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
