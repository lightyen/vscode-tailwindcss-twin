import { is, isArbitraryValue } from "../util"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const fontSize: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "fontSize")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.fontSize)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "fontSize"
		},
	}

	function isMatch(value: string) {
		const match = /^text-(.*)/s.exec(value)
		if (!match) {
			return false
		}

		let val = match[1]

		if (isArbitraryValue(val)) {
			val = val.slice(1, -1).trim()
			return is(val, "absolute-size", "relative-size", "length", "percentage")
		}

		return values.some(c => c === val)
	}
}
fontSize.canArbitraryValue = true

export const lineHeight: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "lineHeight")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.lineHeight)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "lineHeight"
		},
	}

	function isMatch(value: string) {
		const match = /^leading-(.*)/s.exec(value)
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
	if (!context.config.corePlugins.some(c => c === "strokeWidth")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.strokeWidth)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "strokeWidth"
		},
	}

	function isMatch(value: string) {
		const match = /^stroke-(.*)/s.exec(value)
		if (!match) {
			return false
		}

		let val = match[1]

		if (isArbitraryValue(val)) {
			val = val.slice(1, -1).trim()
			return is(val, "length", "number", "percentage")
		}

		return values.some(c => c === val)
	}
}
strokeWidth.canArbitraryValue = true

export const ringOffsetWidth: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "ringOffsetWidth")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.ringOffsetWidth)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "ringOffsetWidth"
		},
	}

	function isMatch(value: string) {
		const match = /^ring-offset-(.*)/s.exec(value)
		if (!match) {
			return false
		}

		let val = match[1]

		if (isArbitraryValue(val)) {
			val = val.slice(1, -1).trim()
			return is(val, "length")
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
	if (!context.config.corePlugins.some(c => c === "borderRadius")) throw ErrorNotEnable
	const [hasDefault, values] = getDefault(context.config.theme.borderRadius)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "borderRadius"
		},
	}

	function isMatch(value: string) {
		const match = /^rounded(?:-tl\b|-tr\b|-br\b|-bl\b|-t\b|-r\b|-b\b|-l\b|\b)(?:-|\b)(.*)/s.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		if (hasDefault && (val === "" || val === "DEFAULT")) {
			return true
		}

		if (isArbitraryValue(val)) {
			return true // NO CHECKING
		}

		return values.some(c => c === val)
	}
}
borderRadius.canArbitraryValue = false

export const boxShadow: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "boxShadow")) throw ErrorNotEnable
	const [hasDefault, values] = getDefault(context.config.theme.boxShadow)

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

		const match = /^shadow(?:-|\b)(.*)/s.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		if (hasDefault && (val === "" || val === "DEFAULT")) {
			return true
		}

		if (isArbitraryValue(val)) {
			return true
		}

		return values.some(c => c === val)
	}
}
boxShadow.canArbitraryValue = true

export const dropShadow: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "dropShadow")) throw ErrorNotEnable
	const [hasDefault, values] = getDefault(context.config.theme.dropShadow)

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

		const match = /^drop-shadow(?:-|\b)(.*)/s.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		if (hasDefault && (val === "" || val === "DEFAULT")) {
			return true
		}

		return values.some(c => c === val)
	}
}
dropShadow.canArbitraryValue = false

export const blur: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "blur")) throw ErrorNotEnable
	const [hasDefault, values] = getDefault(context.config.theme.blur)

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

		const match = /^blur(?:-|\b)(.*)/s.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		if (hasDefault && (val === "" || val === "DEFAULT")) {
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
	if (!context.config.corePlugins.some(c => c === "backdropBlur")) throw ErrorNotEnable
	const [hasDefault, values] = getDefault(context.config.theme.backdropBlur)

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

		const match = /^backdrop-blur(?:-|\b)(.*)/s.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		if (hasDefault && (val === "" || val === "DEFAULT")) {
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
	if (!context.config.corePlugins.some(c => c === "borderWidth")) throw ErrorNotEnable
	const [hasDefault, values] = getDefault(context.config.theme.borderWidth)

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

		const match = /^border(?:-x\b|-y\b|-t\b|-r\b|-b\b|-l\b|\b)(?:-|\b)(.*)/s.exec(value)
		if (!match) {
			return false
		}

		let val = match[1]

		if (hasDefault && (val === "" || val === "DEFAULT")) {
			return true
		}

		if (isArbitraryValue(val)) {
			val = val.slice(1, -1).trim()
			return is(val, "line-width", "length")
		}
		return values.some(c => c === val)
	}
}
borderWidth.canArbitraryValue = true

export const divideWidth: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "divideWidth")) throw ErrorNotEnable
	const [hasDefault, values] = getDefault(context.config.theme.divideWidth)

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

		const match = /^divide-(?:x|y)(?:-|\b)(.*)/s.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		if (hasDefault && (val === "" || val === "DEFAULT")) {
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
	if (!context.config.corePlugins.some(c => c === "ringWidth")) throw ErrorNotEnable
	const [hasDefault, values] = getDefault(context.config.theme.ringWidth)

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

		const match = /^ring(?:-|\b)(.*)/s.exec(value)
		if (!match) {
			return false
		}

		let val = match[1]

		if (hasDefault && (val === "" || val === "DEFAULT")) {
			return true
		}

		if (isArbitraryValue(val)) {
			val = val.slice(1, -1).trim()
			return is(val, "length")
		}
		return values.some(c => c === val) || value === "ring-inset"
	}
}
ringWidth.canArbitraryValue = true
