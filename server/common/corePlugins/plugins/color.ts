import isArbitraryValue from "./common/isArbitraryValue"
import isColorValue from "./common/isColorValue"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

function findColors(palette: Tailwind.ResolvedPalette): string[] {
	const names: string[] = []
	for (const prop in palette) {
		const c = palette[prop]
		if (typeof c === "object") {
			for (const k in c) {
				if (k === "DEFAULT") {
					names.push(prop)
					continue
				}
				names.push(`${prop}-${k}`)
			}
		} else if (typeof c === "string" || typeof c === "number") {
			if (prop !== "DEFAULT") {
				names.push(`${prop}`)
			}
		} else if (typeof c === "function") {
			const a = c({ opacityValue: "1", opacityVariable: "" })
			if (typeof a === "object") {
				for (const k in a) {
					if (k === "DEFAULT") {
						names.push(prop)
						continue
					}
					names.push(`${prop}-${k}`)
				}
			} else if (typeof a === "string" || typeof a === "number") {
				names.push(`${prop}`)
			}
		}
	}
	return names
}

export const backgroundColor: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	colors: string[]
	opacity: string[]
	constructor(private context: Context) {
		this.name = "backgroundColor"
		this.colors = findColors(this.context.resolved.theme.backgroundColor)
		if (!this.context.resolved.corePlugins.some(c => c === "backgroundOpacity")) {
			throw ErrorNotEnable
		}
		this.opacity = Object.keys(this.context.resolved.theme.backgroundOpacity)
	}
	isMatch(value: string) {
		const match = /^bg-(.*)/.exec(value)
		if (!match) {
			return false
		}

		const rest = match[1]

		if (!this.opacity) {
			return this.colors.some(c => c === rest)
		}

		const index = rest.lastIndexOf("/")
		if (index === -1) {
			if (isArbitraryValue(rest)) {
				return true
			}
			return this.colors.some(c => c === rest)
		}

		const opacity = rest.slice(index + 1)
		if (isArbitraryValue(opacity)) {
			return true
		}
		return this.opacity.some(c => c === opacity)
	}
}

export const textColor: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	colors: string[]
	opacity: string[]
	constructor(private context: Context) {
		this.name = "textColor"
		this.colors = findColors(this.context.resolved.theme.textColor)
		if (!this.context.resolved.corePlugins.some(c => c === "textOpacity")) {
			throw ErrorNotEnable
		}
		this.opacity = Object.keys(this.context.resolved.theme.textOpacity)
	}
	isMatch(value: string) {
		const match = /^text-(.*)/.exec(value)
		if (!match) {
			return false
		}

		const rest = match[1]

		if (!this.opacity) {
			return this.colors.some(c => c === rest)
		}

		const index = rest.lastIndexOf("/")
		if (index === -1) {
			if (isArbitraryValue(rest)) {
				const val = rest.slice(1, -1).trim()
				return isColorValue(val)
			}
			return this.colors.some(c => c === rest)
		}

		const opacity = rest.slice(index + 1)
		if (isArbitraryValue(opacity)) {
			return true
		}

		return this.opacity.some(c => c === opacity)
	}
}

export const borderColor: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	colors: string[]
	opacity: string[]
	constructor(private context: Context) {
		this.name = "borderColor"
		this.colors = findColors(this.context.resolved.theme.borderColor)
		if (!this.context.resolved.corePlugins.some(c => c === "borderOpacity")) {
			throw ErrorNotEnable
		}
		this.opacity = Object.keys(this.context.resolved.theme.borderOpacity)
	}
	isMatch(value: string) {
		const match = /^border-(?:t-|r-|b-|l-)?(.*)/.exec(value)
		if (!match) {
			return false
		}

		const rest = match[1]

		if (!this.opacity) {
			return this.colors.some(c => c === rest)
		}

		const index = rest.lastIndexOf("/")
		if (index === -1) {
			if (isArbitraryValue(rest)) {
				const val = rest.slice(1, -1).trim()
				return isColorValue(val)
			}
			return this.colors.some(c => c === rest)
		}

		const opacity = rest.slice(index + 1)
		if (isArbitraryValue(opacity)) {
			return true
		}

		return this.opacity.some(c => c === opacity)
	}
}

export const placeholderColor: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	colors: string[]
	opacity: string[]
	constructor(private context: Context) {
		this.name = "placeholderColor"
		this.colors = findColors(this.context.resolved.theme.placeholderColor)
		if (!this.context.resolved.corePlugins.some(c => c === "placeholderOpacity")) {
			throw ErrorNotEnable
		}
		this.opacity = Object.keys(this.context.resolved.theme.placeholderOpacity)
	}
	isMatch(value: string) {
		const match = /^placeholder-(.*)/.exec(value)
		if (!match) {
			return false
		}

		const rest = match[1]

		if (!this.opacity) {
			return this.colors.some(c => c === rest)
		}

		const index = rest.lastIndexOf("/")
		if (index === -1) {
			if (isArbitraryValue(rest)) {
				return true
			}
			return this.colors.some(c => c === rest)
		}

		const opacity = rest.slice(index + 1)
		if (isArbitraryValue(opacity)) {
			return true
		}
		return this.opacity.some(c => c === opacity)
	}
}

export const ringColor: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	colors: string[]
	opacity: string[]
	constructor(private context: Context) {
		this.name = "ringColor"
		this.colors = findColors(this.context.resolved.theme.ringColor)
		if (!this.context.resolved.corePlugins.some(c => c === "ringOpacity")) {
			throw ErrorNotEnable
		}
		this.opacity = Object.keys(this.context.resolved.theme.ringOpacity)
	}
	isMatch(value: string) {
		const match = /^ring-(.*)/.exec(value)
		if (!match) {
			return false
		}

		const rest = match[1]

		if (!this.opacity) {
			return this.colors.some(c => c === rest)
		}

		const index = rest.lastIndexOf("/")
		if (index === -1) {
			if (isArbitraryValue(rest)) {
				const val = rest.slice(1, -1).trim()
				return isColorValue(val)
			}
			return this.colors.some(c => c === rest)
		}

		const opacity = rest.slice(index + 1)
		if (isArbitraryValue(opacity)) {
			return true
		}

		return this.opacity.some(c => c === opacity)
	}
}

export const ringOffsetColor: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	colors: string[]
	opacity: string[]
	constructor(private context: Context) {
		this.name = "ringOffsetColor"
		this.colors = findColors(this.context.resolved.theme.ringOffsetColor)
		if (!this.context.resolved.corePlugins.some(c => c === "ringOpacity")) {
			throw ErrorNotEnable
		}
		this.opacity = Object.keys(this.context.resolved.theme.ringOpacity)
	}
	isMatch(value: string) {
		const match = /^ring-offset-(.*)/.exec(value)
		if (!match) {
			return false
		}

		const rest = match[1]

		if (!this.opacity) {
			return this.colors.some(c => c === rest)
		}

		const index = rest.lastIndexOf("/")
		if (index === -1) {
			if (isArbitraryValue(rest)) {
				const val = rest.slice(1, -1).trim()
				return isColorValue(val)
			}
			return this.colors.some(c => c === rest)
		}

		const opacity = rest.slice(index + 1)
		if (isArbitraryValue(opacity)) {
			return true
		}
		return this.opacity.some(c => c === opacity)
	}
}

export const divideColor: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	colors: string[]
	opacity: string[]
	constructor(private context: Context) {
		this.name = "divideColor"
		this.colors = findColors(this.context.resolved.theme.divideColor)
		if (!this.context.resolved.corePlugins.some(c => c === "divideOpacity")) {
			throw ErrorNotEnable
		}
		this.opacity = Object.keys(this.context.resolved.theme.divideOpacity)
	}
	isMatch(value: string) {
		const match = /^divide-(.*)/.exec(value)
		if (!match) {
			return false
		}

		const rest = match[1]

		if (!this.opacity) {
			return this.colors.some(c => c === rest)
		}

		const index = rest.lastIndexOf("/")
		if (index === -1) {
			if (isArbitraryValue(rest)) {
				return true
			}
			return this.colors.some(c => c === rest)
		}

		const opacity = rest.slice(index + 1)
		if (isArbitraryValue(opacity)) {
			return true
		}
		return this.opacity.some(c => c === opacity)
	}
}

export const caretColor: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	colors: string[]
	opacity: string[]
	constructor(private context: Context) {
		this.name = "caretColor"
		this.colors = findColors(this.context.resolved.theme.caretColor)
		this.opacity = Object.keys(this.context.resolved.theme.opacity)
	}

	isMatch(value: string) {
		const match = /^caret-(.*)/.exec(value)
		if (!match) {
			return false
		}

		const rest = match[1]

		if (!this.opacity) {
			return this.colors.some(c => c === rest)
		}

		const index = rest.lastIndexOf("/")
		if (index === -1) {
			if (isArbitraryValue(rest)) {
				return true
			}
			return this.colors.some(c => c === rest)
		}

		const opacity = rest.slice(index + 1)
		if (isArbitraryValue(opacity)) {
			return true
		}

		return this.opacity.some(c => c === opacity)
	}
}

export const gradientColorStops: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	colors: string[]
	opacity: string[]
	constructor(private context: Context) {
		this.name = "gradientColorStops"
		this.colors = findColors(this.context.resolved.theme.gradientColorStops)
		this.opacity = Object.keys(this.context.resolved.theme.opacity)
	}

	isMatch(value: string) {
		const match = /^(?:from-|to-|via-)(.*)/.exec(value)
		if (!match) {
			return false
		}

		const rest = match[1]

		const index = rest.lastIndexOf("/")
		if (index === -1) {
			if (isArbitraryValue(rest)) {
				return true
			}
			return this.colors.some(c => c === rest)
		}

		const opacity = rest.slice(index + 1)
		if (isArbitraryValue(opacity)) {
			return true
		}
		return this.opacity.some(c => c === opacity)
	}
}

export const stroke: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	colors: string[]
	opacity: string[]
	constructor(private context: Context) {
		this.name = "stroke"
		this.colors = findColors(this.context.resolved.theme.stroke)
		if (!this.context.resolved.corePlugins.some(c => c === "stroke")) {
			throw ErrorNotEnable
		}
		this.opacity = Object.keys(this.context.resolved.theme.opacity)
	}
	isMatch(value: string) {
		const match = /^stroke-(.*)/.exec(value)
		if (!match) {
			return false
		}

		const rest = match[1]

		if (!this.opacity) {
			return this.colors.some(c => c === rest)
		}

		const index = rest.lastIndexOf("/")
		if (index === -1) {
			if (isArbitraryValue(rest)) {
				const val = rest.slice(1, -1).trim()
				return isColorValue(val)
			}
			return this.colors.some(c => c === rest)
		}

		const opacity = rest.slice(index + 1)
		if (isArbitraryValue(opacity)) {
			return true
		}

		return this.opacity.some(c => c === opacity)
	}
}

export const fill: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	colors: string[]
	opacity: string[]
	constructor(private context: Context) {
		this.name = "fill"
		this.colors = findColors(this.context.resolved.theme.fill)
		if (!this.context.resolved.corePlugins.some(c => c === "fill")) {
			throw ErrorNotEnable
		}
		this.opacity = Object.keys(this.context.resolved.theme.opacity)
	}
	isMatch(value: string) {
		const match = /^fill-(.*)/.exec(value)
		if (!match) {
			return false
		}

		const rest = match[1]

		if (!this.opacity) {
			return this.colors.some(c => c === rest)
		}

		const index = rest.lastIndexOf("/")
		if (index === -1) {
			if (isArbitraryValue(rest)) {
				return true
			}
			return this.colors.some(c => c === rest)
		}

		const opacity = rest.slice(index + 1)
		if (isArbitraryValue(opacity)) {
			return true
		}

		return this.opacity.some(c => c === opacity)
	}
}
