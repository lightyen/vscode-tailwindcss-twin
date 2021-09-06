import isArbitraryValue from "./common/isArbitraryValue"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const filter: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "filter"
		if (!this.context.resolved.corePlugins.some(c => c === "filter")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return value === "filter" || value === "filter-none"
	}
}

export const backdropFilter: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "backdropFilter"
		if (!this.context.resolved.corePlugins.some(c => c === "backdropFilter")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return value === "backdrop-filter" || value === "backdrop-filter-none"
	}
}

export const brightness: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "brightness"
		if (!this.context.resolved.corePlugins.some(c => c === "brightness")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.brightness)
	}
	isMatch(value: string) {
		const match = /^brightness-(.*)/.exec(value)
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

export const backdropBrightness: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "backdropBrightness"
		if (!this.context.resolved.corePlugins.some(c => c === "backdropBrightness")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.backdropBrightness)
	}
	isMatch(value: string) {
		const match = /^backdrop-brightness-(.*)/.exec(value)
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

export const contrast: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "contrast"
		if (!this.context.resolved.corePlugins.some(c => c === "contrast")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.contrast)
	}
	isMatch(value: string) {
		const match = /^contrast-(.*)/.exec(value)
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

export const backdropContrast: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "backdropContrast"
		if (!this.context.resolved.corePlugins.some(c => c === "backdropContrast")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.backdropContrast)
	}
	isMatch(value: string) {
		const match = /^backdrop-contrast-(.*)/.exec(value)
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

export const hueRotate: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "hueRotate"
		if (!this.context.resolved.corePlugins.some(c => c === "hueRotate")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.hueRotate)
	}
	isMatch(value: string) {
		const match = /^-?hue-rotate-(.*)/.exec(value)
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

export const backdropHueRotate: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "backdropHueRotate"
		if (!this.context.resolved.corePlugins.some(c => c === "backdropHueRotate")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.backdropHueRotate)
	}
	isMatch(value: string) {
		const match = /^-?backdrop-hue-rotate-(.*)/.exec(value)
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

export const saturate: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "saturate"
		if (!this.context.resolved.corePlugins.some(c => c === "saturate")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.saturate)
	}
	isMatch(value: string) {
		const match = /^saturate-(.*)/.exec(value)
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

export const backdropSaturate: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "backdropSaturate"
		if (!this.context.resolved.corePlugins.some(c => c === "backdropSaturate")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.backdropSaturate)
	}
	isMatch(value: string) {
		const match = /^backdrop-saturate-(.*)/.exec(value)
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

function getDefault(obj: Record<string, unknown>): [boolean, string[]] {
	const hasDefault = Object.prototype.hasOwnProperty.call(obj, "DEFAULT")
	const values = Object.keys(obj).filter(v => v !== "DEFAULT")
	return [hasDefault, values]
}

export const grayscale: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	size: string[]
	hasDefault: boolean
	constructor(private context: Context) {
		this.name = "grayscale"
		if (!this.context.resolved.corePlugins.some(c => c === "grayscale")) {
			throw ErrorNotEnable
		}
		;[this.hasDefault, this.size] = getDefault(this.context.resolved.theme.grayscale)
	}
	isMatch(value: string) {
		const match = /^grayscale(?:-|\b)(.*)/.exec(value)
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
		return this.size.some(c => c === val)
	}
}

export const backdropGrayscale: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	size: string[]
	hasDefault: boolean
	constructor(private context: Context) {
		this.name = "backdropGrayscale"
		if (!this.context.resolved.corePlugins.some(c => c === "backdropGrayscale")) {
			throw ErrorNotEnable
		}
		;[this.hasDefault, this.size] = getDefault(this.context.resolved.theme.backdropGrayscale)
	}
	isMatch(value: string) {
		const match = /^backdrop-grayscale(?:-|\b)(.*)/.exec(value)
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
		return this.size.some(c => c === val)
	}
}

export const invert: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	size: string[]
	hasDefault: boolean
	constructor(private context: Context) {
		this.name = "invert"
		if (!this.context.resolved.corePlugins.some(c => c === "invert")) {
			throw ErrorNotEnable
		}
		;[this.hasDefault, this.size] = getDefault(this.context.resolved.theme.invert)
	}
	isMatch(value: string) {
		const match = /^invert(?:-|\b)(.*)/.exec(value)
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
		return this.size.some(c => c === val)
	}
}

export const backdropInvert: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	size: string[]
	hasDefault: boolean
	constructor(private context: Context) {
		this.name = "backdropInvert"
		if (!this.context.resolved.corePlugins.some(c => c === "backdropInvert")) {
			throw ErrorNotEnable
		}
		;[this.hasDefault, this.size] = getDefault(this.context.resolved.theme.backdropInvert)
	}
	isMatch(value: string) {
		const match = /^backdrop-invert(?:-|\b)(.*)/.exec(value)
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
		return this.size.some(c => c === val)
	}
}

export const sepia: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	size: string[]
	hasDefault: boolean
	constructor(private context: Context) {
		this.name = "sepia"
		if (!this.context.resolved.corePlugins.some(c => c === "sepia")) {
			throw ErrorNotEnable
		}
		;[this.hasDefault, this.size] = getDefault(this.context.resolved.theme.sepia)
	}
	isMatch(value: string) {
		const match = /^sepia(?:-|\b)(.*)/.exec(value)
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
		return this.size.some(c => c === val)
	}
}

export const backdropSepia: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	size: string[]
	hasDefault: boolean
	constructor(private context: Context) {
		this.name = "backdropSepia"
		if (!this.context.resolved.corePlugins.some(c => c === "backdropSepia")) {
			throw ErrorNotEnable
		}
		;[this.hasDefault, this.size] = getDefault(this.context.resolved.theme.backdropSepia)
	}
	isMatch(value: string) {
		const match = /^backdrop-sepia(?:-|\b)(.*)/.exec(value)
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
		return this.size.some(c => c === val)
	}
}
