import isArbitraryValue from "./common/isArbitraryValue"
import isLengthValue from "./common/isLengthValue"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const fontSize: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "fontSize"
		if (!this.context.resolved.corePlugins.some(c => c === "fontSize")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.fontSize)
	}
	isMatch(value: string) {
		const match = /^text-(.*)/.exec(value)
		if (!match) {
			return false
		}

		let val = match[1]

		if (isArbitraryValue(val)) {
			val = val.slice(1, -1).trim()
			return isLengthValue(val)
		}

		return this.values.some(c => c === val)
	}
}

export const lineHeight: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "lineHeight"
		if (!this.context.resolved.corePlugins.some(c => c === "lineHeight")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.lineHeight)
	}
	isMatch(value: string) {
		const match = /^leading-(.*)/.exec(value)
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

export const strokeWidth: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "strokeWidth"
		if (!this.context.resolved.corePlugins.some(c => c === "strokeWidth")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.strokeWidth)
	}
	isMatch(value: string) {
		const match = /^stroke-(.*)/.exec(value)
		if (!match) {
			return false
		}

		let val = match[1]

		if (isArbitraryValue(val)) {
			val = val.slice(1, -1).trim()
			return isLengthValue(val)
		}

		return this.values.some(c => c === val)
	}
}

export const ringOffsetWidth: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "ringOffsetWidth"
		if (!this.context.resolved.corePlugins.some(c => c === "ringOffsetWidth")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.ringOffsetWidth)
	}
	isMatch(value: string) {
		const match = /^ring-offset-(.*)/.exec(value)
		if (!match) {
			return false
		}

		let val = match[1]

		if (isArbitraryValue(val)) {
			val = val.slice(1, -1).trim()
			return isLengthValue(val)
		}

		return this.values.some(c => c === val)
	}
}

function getDefault(obj: Record<string, unknown>): [boolean, string[]] {
	const hasDefault = Object.prototype.hasOwnProperty.call(obj, "DEFAULT")
	const values = Object.keys(obj).filter(v => v !== "DEFAULT")
	return [hasDefault, values]
}

export const borderRadius: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	hasDefault: boolean
	constructor(private context: Context) {
		this.name = "borderRadius"
		if (!this.context.resolved.corePlugins.some(c => c === "borderRadius")) {
			throw ErrorNotEnable
		}
		;[this.hasDefault, this.values] = getDefault(this.context.resolved.theme.borderRadius)
	}
	isMatch(value: string) {
		const match = /^rounded(?:-tl\b|-tr\b|-br\b|-bl\b|-t\b|-r\b|-b\b|-l\b|\b)(?:-|\b)(.*)/.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		if (this.hasDefault && val === "") {
			return true
		}

		return this.values.some(c => c === val)
	}
}

export const boxShadow: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	hasDefault: boolean
	constructor(private context: Context) {
		this.name = "boxShadow"
		if (!this.context.resolved.corePlugins.some(c => c === "boxShadow")) {
			throw ErrorNotEnable
		}
		;[this.hasDefault, this.values] = getDefault(this.context.resolved.theme.boxShadow)
	}
	isMatch(value: string) {
		if (this.values == undefined) {
			return false
		}

		const match = /^shadow(?:-|\b)(.*)/.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		if (this.hasDefault && val === "") {
			return true
		}

		return this.values.some(c => c === val)
	}
}

export const dropShadow: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	hasDefault: boolean
	constructor(private context: Context) {
		this.name = "dropShadow"
		if (!this.context.resolved.corePlugins.some(c => c === "dropShadow")) {
			throw ErrorNotEnable
		}
		;[this.hasDefault, this.values] = getDefault(this.context.resolved.theme.dropShadow)
	}
	isMatch(value: string) {
		if (this.values == undefined) {
			return false
		}

		const match = /^drop-shadow(?:-|\b)(.*)/.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		if (this.hasDefault && val === "") {
			return true
		}

		return this.values.some(c => c === val)
	}
}

export const blur: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	hasDefault: boolean
	constructor(private context: Context) {
		this.name = "blur"
		if (!this.context.resolved.corePlugins.some(c => c === "blur")) {
			throw ErrorNotEnable
		}
		;[this.hasDefault, this.values] = getDefault(this.context.resolved.theme.blur)
	}
	isMatch(value: string) {
		if (this.values == undefined) {
			return false
		}

		const match = /^blur(?:-|\b)(.*)/.exec(value)
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

export const backdropBlur: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	hasDefault: boolean
	constructor(private context: Context) {
		this.name = "backdropBlur"
		if (!this.context.resolved.corePlugins.some(c => c === "backdropBlur")) {
			throw ErrorNotEnable
		}
		;[this.hasDefault, this.values] = getDefault(this.context.resolved.theme.backdropBlur)
	}
	isMatch(value: string) {
		if (this.values == undefined) {
			return false
		}

		const match = /^backdrop-blur(?:-|\b)(.*)/.exec(value)
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

export const borderWidth: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	hasDefault: boolean
	constructor(private context: Context) {
		this.name = "borderWidth"
		if (!this.context.resolved.corePlugins.some(c => c === "borderWidth")) {
			throw ErrorNotEnable
		}
		;[this.hasDefault, this.values] = getDefault(this.context.resolved.theme.borderWidth)
	}
	isMatch(value: string) {
		if (this.values == undefined) {
			return false
		}

		const match = /^border(?:-t\b|-r\b|-b\b|-l\b|\b)(?:-|\b)(.*)/.exec(value)
		if (!match) {
			return false
		}

		let val = match[1]

		if (this.hasDefault && val === "") {
			return true
		}

		if (isArbitraryValue(val)) {
			val = val.slice(1, -1).trim()
			return isLengthValue(val)
		}
		return this.values.some(c => c === val)
	}
}

export const divideWidth: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	hasDefault: boolean
	constructor(private context: Context) {
		this.name = "divideWidth"
		if (!this.context.resolved.corePlugins.some(c => c === "divideWidth")) {
			throw ErrorNotEnable
		}
		;[this.hasDefault, this.values] = getDefault(this.context.resolved.theme.divideWidth)
	}
	isMatch(value: string) {
		if (this.values == undefined) {
			return false
		}

		const match = /^divide-(?:x|y)(?:-|\b)(.*)/.exec(value)
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
		return this.values.some(c => c === val) || value === "divide-y-reverse" || value === "divide-x-reverse"
	}
}

export const ringWidth: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	hasDefault: boolean
	constructor(private context: Context) {
		this.name = "ringWidth"
		if (!this.context.resolved.corePlugins.some(c => c === "ringWidth")) {
			throw ErrorNotEnable
		}
		;[this.hasDefault, this.values] = getDefault(this.context.resolved.theme.ringWidth)
	}
	isMatch(value: string) {
		if (this.values == undefined) {
			return false
		}

		const match = /^ring(?:-|\b)(.*)/.exec(value)
		if (!match) {
			return false
		}

		let val = match[1]

		if (this.hasDefault && val === "") {
			return true
		}

		if (isArbitraryValue(val)) {
			val = val.slice(1, -1).trim()
			return isLengthValue(val)
		}
		return this.values.some(c => c === val) || value === "ring-inset"
	}
}
