import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const fontFamily: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "fontFamily"
		if (!this.context.resolved.corePlugins.some(c => c === "fontFamily")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.fontFamily)
	}
	isMatch(value: string) {
		const match = /^font-(.*)/.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		return this.values.some(c => c === val)
	}
}

export const fontWeight: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "fontWeight"
		if (!this.context.resolved.corePlugins.some(c => c === "fontWeight")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.fontWeight)
	}
	isMatch(value: string) {
		const match = /^font-(.*)/.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		return this.values.some(c => c === val)
	}
}

export const fontStyle: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "fontStyle"
		if (!this.context.resolved.corePlugins.some(c => c === "fontStyle")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return value === "italic" || value === "not-italic"
	}
}

export const fontVariantNumeric: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "fontVariantNumeric"
		if (!this.context.resolved.corePlugins.some(c => c === "fontVariantNumeric")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return (
			value === "normal-nums" ||
			value === "ordinal" ||
			value === "slashed-zero" ||
			value === "lining-nums" ||
			value === "oldstyle-nums" ||
			value === "proportional-nums" ||
			value === "tabular-nums" ||
			value === "diagonal-fractions" ||
			value === "stacked-fractions"
		)
	}
}

export const fontSmoothing: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "fontSmoothing"
		if (!this.context.resolved.corePlugins.some(c => c === "fontSmoothing")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return value === "antialiased" || value === "subpixel-antialiased"
	}
}
