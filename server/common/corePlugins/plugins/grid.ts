import isArbitraryValue from "./common/isArbitraryValue"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const gridTemplateColumns: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "gridTemplateColumns"
		if (!this.context.resolved.corePlugins.some(c => c === "gridTemplateColumns")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.gridTemplateColumns)
	}
	isMatch(value: string) {
		const match = /^grid-cols-(.*)/.exec(value)
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

export const gridTemplateRows: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "gridTemplateRows"
		if (!this.context.resolved.corePlugins.some(c => c === "gridTemplateRows")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.gridTemplateRows)
	}
	isMatch(value: string) {
		const match = /^grid-rows-(.*)/.exec(value)
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

export const gridAutoFlow: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "gridAutoFlow"
		if (!this.context.resolved.corePlugins.some(c => c === "gridAutoFlow")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return (
			value === "grid-flow-row" ||
			value === "grid-flow-col" ||
			value === "grid-flow-row-dense" ||
			value === "grid-flow-col-dense"
		)
	}
}

export const gridAutoColumns: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "gridAutoColumns"
		if (!this.context.resolved.corePlugins.some(c => c === "gridAutoColumns")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.gridAutoColumns)
	}
	isMatch(value: string) {
		const match = /^auto-cols-(.*)/.exec(value)
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

export const gridAutoRows: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "gridAutoRows"
		if (!this.context.resolved.corePlugins.some(c => c === "gridAutoRows")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.gridAutoRows)
	}
	isMatch(value: string) {
		const match = /^auto-rows-(.*)/.exec(value)
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

export const gridColumn: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "gridColumn"
		if (!this.context.resolved.corePlugins.some(c => c === "gridColumn")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.gridColumn)
	}
	isMatch(value: string) {
		const match = /^col-(.*)/.exec(value)
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

export const gridColumnStart: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "gridColumnStart"
		if (!this.context.resolved.corePlugins.some(c => c === "gridColumnStart")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.gridColumnStart)
	}
	isMatch(value: string) {
		const match = /^col-start-(.*)/.exec(value)
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

export const gridColumnEnd: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "gridColumnEnd"
		if (!this.context.resolved.corePlugins.some(c => c === "gridColumnEnd")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.gridColumnEnd)
	}
	isMatch(value: string) {
		const match = /^col-end-(.*)/.exec(value)
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

export const gridRow: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "gridRow"
		if (!this.context.resolved.corePlugins.some(c => c === "gridRow")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.gridRow)
	}
	isMatch(value: string) {
		const match = /^row-(.*)/.exec(value)
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

export const gridRowStart: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "gridRowStart"
		if (!this.context.resolved.corePlugins.some(c => c === "gridRowStart")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.gridRowStart)
	}
	isMatch(value: string) {
		const match = /^row-start-(.*)/.exec(value)
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

export const gridRowEnd: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "gridRowEnd"
		if (!this.context.resolved.corePlugins.some(c => c === "gridRowEnd")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.gridRowEnd)
	}
	isMatch(value: string) {
		const match = /^row-end-(.*)/.exec(value)
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
