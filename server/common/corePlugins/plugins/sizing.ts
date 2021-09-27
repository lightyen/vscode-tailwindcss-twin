import isArbitraryValue from "./common/isArbitraryValue"
import isLengthValue from "./common/isLengthValue"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const fontSize: PluginConstructor = (context: Context): Plugin => {
	if (!context.resolved.corePlugins.some(c => c === "fontSize")) throw ErrorNotEnable
	const values = Object.keys(context.resolved.theme.fontSize)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "fontSize"
		},
	}

	function isMatch(value: string) {
		const match = /^text-(.*)/.exec(value)
		if (!match) {
			return false
		}

		let val = match[1]

		if (isArbitraryValue(val)) {
			val = val.slice(1, -1).trim()
			return isLengthValue(val)
		}

		return values.some(c => c === val)
	}
}
fontSize.canArbitraryValue = true

export const lineHeight: PluginConstructor = (context: Context): Plugin => {
	if (!context.resolved.corePlugins.some(c => c === "lineHeight")) throw ErrorNotEnable
	const values = Object.keys(context.resolved.theme.lineHeight)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "lineHeight"
		},
	}

	function isMatch(value: string) {
		const match = /^leading-(.*)/.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		if (isArbitraryValue(val)) {
			return true
		}

		return values.some(c => c === val)
	}
}
lineHeight.canArbitraryValue = true

export const strokeWidth: PluginConstructor = (context: Context): Plugin => {
	if (!context.resolved.corePlugins.some(c => c === "strokeWidth")) throw ErrorNotEnable
	const values = Object.keys(context.resolved.theme.strokeWidth)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "strokeWidth"
		},
	}

	function isMatch(value: string) {
		const match = /^stroke-(.*)/.exec(value)
		if (!match) {
			return false
		}

		let val = match[1]

		if (isArbitraryValue(val)) {
			val = val.slice(1, -1).trim()
			return isLengthValue(val)
		}

		return values.some(c => c === val)
	}
}
strokeWidth.canArbitraryValue = true

export const ringOffsetWidth: PluginConstructor = (context: Context): Plugin => {
	if (!context.resolved.corePlugins.some(c => c === "ringOffsetWidth")) throw ErrorNotEnable
	const values = Object.keys(context.resolved.theme.ringOffsetWidth)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "ringOffsetWidth"
		},
	}

	function isMatch(value: string) {
		const match = /^ring-offset-(.*)/.exec(value)
		if (!match) {
			return false
		}

		let val = match[1]

		if (isArbitraryValue(val)) {
			val = val.slice(1, -1).trim()
			return isLengthValue(val)
		}

		return values.some(c => c === val)
	}
}
ringOffsetWidth.canArbitraryValue = true

function getDefault(obj: Record<string, unknown>): [boolean, string[]] {
	const hasDefault = Object.prototype.hasOwnProperty.call(obj, "DEFAULT")
	const values = Object.keys(obj).filter(v => v !== "DEFAULT")
	return [hasDefault, values]
}

export const borderRadius: PluginConstructor = (context: Context): Plugin => {
	if (!context.resolved.corePlugins.some(c => c === "borderRadius")) throw ErrorNotEnable
	const [hasDefault, values] = getDefault(context.resolved.theme.borderRadius)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "borderRadius"
		},
	}

	function isMatch(value: string) {
		const match = /^rounded(?:-tl\b|-tr\b|-br\b|-bl\b|-t\b|-r\b|-b\b|-l\b|\b)(?:-|\b)(.*)/.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		if (hasDefault && val === "") {
			return true
		}

		return values.some(c => c === val)
	}
}
borderRadius.canArbitraryValue = false

export const boxShadow: PluginConstructor = (context: Context): Plugin => {
	if (!context.resolved.corePlugins.some(c => c === "boxShadow")) throw ErrorNotEnable
	const [hasDefault, values] = getDefault(context.resolved.theme.boxShadow)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "boxShadow"
		},
	}

	function isMatch(value: string) {
		if (values == undefined) {
			return false
		}

		const match = /^shadow(?:-|\b)(.*)/.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		if (hasDefault && val === "") {
			return true
		}

		return values.some(c => c === val)
	}
}
boxShadow.canArbitraryValue = false

export const dropShadow: PluginConstructor = (context: Context): Plugin => {
	if (!context.resolved.corePlugins.some(c => c === "dropShadow")) throw ErrorNotEnable
	const [hasDefault, values] = getDefault(context.resolved.theme.dropShadow)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "dropShadow"
		},
	}

	function isMatch(value: string) {
		if (values == undefined) {
			return false
		}

		const match = /^drop-shadow(?:-|\b)(.*)/.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		if (hasDefault && val === "") {
			return true
		}

		return values.some(c => c === val)
	}
}
dropShadow.canArbitraryValue = false

export const blur: PluginConstructor = (context: Context): Plugin => {
	if (!context.resolved.corePlugins.some(c => c === "blur")) throw ErrorNotEnable
	const [hasDefault, values] = getDefault(context.resolved.theme.blur)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "blur"
		},
	}

	function isMatch(value: string) {
		if (values == undefined) {
			return false
		}

		const match = /^blur(?:-|\b)(.*)/.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		if (hasDefault && val === "") {
			return true
		}

		if (isArbitraryValue(val)) {
			return true
		}
		return values.some(c => c === val)
	}
}
blur.canArbitraryValue = true

export const backdropBlur: PluginConstructor = (context: Context): Plugin => {
	if (!context.resolved.corePlugins.some(c => c === "backdropBlur")) throw ErrorNotEnable
	const [hasDefault, values] = getDefault(context.resolved.theme.backdropBlur)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "backdropBlur"
		},
	}

	function isMatch(value: string) {
		if (values == undefined) {
			return false
		}

		const match = /^backdrop-blur(?:-|\b)(.*)/.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		if (hasDefault && val === "") {
			return true
		}

		if (isArbitraryValue(val)) {
			return true
		}
		return values.some(c => c === val)
	}
}
backdropBlur.canArbitraryValue = true

export const borderWidth: PluginConstructor = (context: Context): Plugin => {
	if (!context.resolved.corePlugins.some(c => c === "borderWidth")) throw ErrorNotEnable
	const [hasDefault, values] = getDefault(context.resolved.theme.borderWidth)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "borderWidth"
		},
	}

	function isMatch(value: string) {
		if (values == undefined) {
			return false
		}

		const match = /^border(?:-t\b|-r\b|-b\b|-l\b|\b)(?:-|\b)(.*)/.exec(value)
		if (!match) {
			return false
		}

		let val = match[1]

		if (hasDefault && val === "") {
			return true
		}

		if (isArbitraryValue(val)) {
			val = val.slice(1, -1).trim()
			return isLengthValue(val)
		}
		return values.some(c => c === val)
	}
}
borderWidth.canArbitraryValue = true

export const divideWidth: PluginConstructor = (context: Context): Plugin => {
	if (!context.resolved.corePlugins.some(c => c === "divideWidth")) throw ErrorNotEnable
	const [hasDefault, values] = getDefault(context.resolved.theme.divideWidth)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "divideWidth"
		},
	}

	function isMatch(value: string) {
		if (values == undefined) {
			return false
		}

		const match = /^divide-(?:x|y)(?:-|\b)(.*)/.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		if (hasDefault && val === "") {
			return true
		}

		if (isArbitraryValue(val)) {
			return true
		}
		return values.some(c => c === val) || value === "divide-y-reverse" || value === "divide-x-reverse"
	}
}
divideWidth.canArbitraryValue = true

export const ringWidth: PluginConstructor = (context: Context): Plugin => {
	if (!context.resolved.corePlugins.some(c => c === "ringWidth")) throw ErrorNotEnable
	const [hasDefault, values] = getDefault(context.resolved.theme.ringWidth)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "ringWidth"
		},
	}

	function isMatch(value: string) {
		if (values == undefined) {
			return false
		}

		const match = /^ring(?:-|\b)(.*)/.exec(value)
		if (!match) {
			return false
		}

		let val = match[1]

		if (hasDefault && val === "") {
			return true
		}

		if (isArbitraryValue(val)) {
			val = val.slice(1, -1).trim()
			return isLengthValue(val)
		}
		return values.some(c => c === val) || value === "ring-inset"
	}
}
ringWidth.canArbitraryValue = true
