import isArbitraryValue from "./common/isArbitraryValue"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const textOpacity: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	opacity: string[]
	constructor(private context: Context) {
		this.name = "textOpacity"
		if (!this.context.resolved.corePlugins.some(c => c === "textOpacity")) {
			throw ErrorNotEnable
		}
		this.opacity = Object.keys(this.context.resolved.theme.textOpacity)
	}
	isMatch(value: string) {
		const match = /^text-opacity-(.*)/.exec(value)
		if (!match) {
			return false
		}

		const opacity = match[1]

		if (isArbitraryValue(opacity)) {
			return true
		}

		return this.opacity.some(c => c === opacity)
	}
}

export const backgroundOpacity: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	opacity: string[]
	constructor(private context: Context) {
		this.name = "backgroundOpacity"
		if (!this.context.resolved.corePlugins.some(c => c === "backgroundOpacity")) {
			throw ErrorNotEnable
		}
		this.opacity = Object.keys(this.context.resolved.theme.backgroundOpacity)
	}
	isMatch(value: string) {
		const match = /^bg-opacity-(.*)/.exec(value)
		if (!match) {
			return false
		}

		const opacity = match[1]

		if (isArbitraryValue(opacity)) {
			return true
		}

		return this.opacity.some(c => c === opacity)
	}
}

export const borderOpacity: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	opacity: string[]
	constructor(private context: Context) {
		this.name = "borderOpacity"
		if (!this.context.resolved.corePlugins.some(c => c === "borderOpacity")) {
			throw ErrorNotEnable
		}
		this.opacity = Object.keys(this.context.resolved.theme.borderOpacity)
	}
	isMatch(value: string) {
		const match = /^border-opacity-(.*)/.exec(value)
		if (!match) {
			return false
		}

		const opacity = match[1]

		if (isArbitraryValue(opacity)) {
			return true
		}

		return this.opacity.some(c => c === opacity)
	}
}

export const placeholderOpacity: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	opacity: string[]
	constructor(private context: Context) {
		this.name = "placeholderOpacity"
		if (!this.context.resolved.corePlugins.some(c => c === "placeholderOpacity")) {
			throw ErrorNotEnable
		}
		this.opacity = Object.keys(this.context.resolved.theme.placeholderOpacity)
	}
	isMatch(value: string) {
		const match = /^placeholder-opacity-(.*)/.exec(value)
		if (!match) {
			return false
		}

		const opacity = match[1]

		if (isArbitraryValue(opacity)) {
			return true
		}

		return this.opacity.some(c => c === opacity)
	}
}

export const divideOpacity: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	opacity: string[]
	constructor(private context: Context) {
		this.name = "divideOpacity"
		if (!this.context.resolved.corePlugins.some(c => c === "divideOpacity")) {
			throw ErrorNotEnable
		}
		this.opacity = Object.keys(this.context.resolved.theme.divideOpacity)
	}
	isMatch(value: string) {
		const match = /^divide-opacity-(.*)/.exec(value)
		if (!match) {
			return false
		}

		const opacity = match[1]

		if (isArbitraryValue(opacity)) {
			return true
		}

		return this.opacity.some(c => c === opacity)
	}
}

export const ringOpacity: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	opacity: string[]
	constructor(private context: Context) {
		this.name = "ringOpacity"
		if (!this.context.resolved.corePlugins.some(c => c === "ringOpacity")) {
			throw ErrorNotEnable
		}
		this.opacity = Object.keys(this.context.resolved.theme.ringOpacity)
	}
	isMatch(value: string) {
		const match = /^ring-opacity-(.*)/.exec(value)
		if (!match) {
			return false
		}

		const opacity = match[1]

		if (isArbitraryValue(opacity)) {
			return true
		}

		return this.opacity.some(c => c === opacity)
	}
}

export const opacity: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	opacity: string[]
	constructor(private context: Context) {
		this.name = "opacity"
		if (!this.context.resolved.corePlugins.some(c => c === "opacity")) {
			throw ErrorNotEnable
		}
		this.opacity = Object.keys(this.context.resolved.theme.opacity)
	}
	isMatch(value: string) {
		const match = /^opacity-(.*)/.exec(value)
		if (!match) {
			return false
		}

		const opacity = match[1]

		if (isArbitraryValue(opacity)) {
			return true
		}

		return this.opacity.some(c => c === opacity)
	}
}

export const backdropOpacity: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	opacity: string[]
	constructor(private context: Context) {
		this.name = "backdropOpacity"
		if (!this.context.resolved.corePlugins.some(c => c === "backdropOpacity")) {
			throw ErrorNotEnable
		}
		this.opacity = Object.keys(this.context.resolved.theme.backdropOpacity)
	}
	isMatch(value: string) {
		const match = /^backdrop-opacity-(.*)/.exec(value)
		if (!match) {
			return false
		}

		const opacity = match[1]

		if (isArbitraryValue(opacity)) {
			return true
		}

		return this.opacity.some(c => c === opacity)
	}
}
