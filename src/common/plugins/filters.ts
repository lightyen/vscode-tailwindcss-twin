import { Context, hasDefault, isCorePluginEnable, isField, MatchPlugin } from "./_base"
import { isArbitraryValue } from "./_parse"

export function filter(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "filter")) return null
	return {
		getName() {
			return "filter"
		},
		isMatch(value) {
			return value === "filter" || value === "filter-none"
		},
	}
}

export function backdropFilter(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "backdropFilter")) return null
	return {
		getName() {
			return "backdropFilter"
		},
		isMatch(value) {
			return value === "backdrop-filter" || value === "backdrop-filter-none"
		},
	}
}

export function dropShadow(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "dropShadow")) return null
	const _hasDefault = hasDefault(context.config.theme.dropShadow)
	return {
		getName() {
			return "dropShadow"
		},
		isMatch(value) {
			const match = /^drop-shadow(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.dropShadow, val)
		},
	}
}

export function blur(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "blur")) return null
	const _hasDefault = hasDefault(context.config.theme.blur)
	return {
		getName() {
			return "blur"
		},
		isMatch(value) {
			const match = /^blur(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.blur, val)
		},
	}
}

export function brightness(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "brightness")) return null
	const _hasDefault = hasDefault(context.config.theme.brightness)
	return {
		getName() {
			return "brightness"
		},
		isMatch(value) {
			const match = /^brightness(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.brightness, val)
		},
	}
}

export function contrast(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "contrast")) return null
	const _hasDefault = hasDefault(context.config.theme.contrast)
	return {
		getName() {
			return "contrast"
		},
		isMatch(value) {
			const match = /^contrast(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.contrast, val)
		},
	}
}

export function grayscale(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "grayscale")) return null
	const _hasDefault = hasDefault(context.config.theme.grayscale)
	return {
		getName() {
			return "grayscale"
		},
		isMatch(value) {
			const match = /^grayscale(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.grayscale, val)
		},
	}
}

export function hueRotate(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "hueRotate")) return null
	const _hasDefault = hasDefault(context.config.theme.hueRotate)
	return {
		getName() {
			return "hueRotate"
		},
		isMatch(value) {
			const match = /^-?hue-rotate(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			const isNegative = match[0].charCodeAt(0) === 45
			if (isArbitraryValue(val)) return !isNegative
			return isField(context.config.theme.hueRotate, val)
		},
	}
}

export function invert(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "invert")) return null
	const _hasDefault = hasDefault(context.config.theme.invert)
	return {
		getName() {
			return "invert"
		},
		isMatch(value) {
			const match = /^invert(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.invert, val)
		},
	}
}

export function saturate(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "saturate")) return null
	const _hasDefault = hasDefault(context.config.theme.saturate)
	return {
		getName() {
			return "saturate"
		},
		isMatch(value) {
			const match = /^saturate(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.saturate, val)
		},
	}
}

export function sepia(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "sepia")) return null
	const _hasDefault = hasDefault(context.config.theme.sepia)
	return {
		getName() {
			return "sepia"
		},
		isMatch(value) {
			const match = /^sepia(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.sepia, val)
		},
	}
}

export function backdropOpacity(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "backdropOpacity")) return null
	return {
		getName() {
			return "backdropOpacity"
		},
		isMatch(value) {
			const match = /^backdrop-opacity-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.backdropOpacity, val)
		},
	}
}

export function backdropBlur(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "backdropBlur")) return null
	const _hasDefault = hasDefault(context.config.theme.backdropBlur)
	return {
		getName() {
			return "backdropBlur"
		},
		isMatch(value) {
			const match = /^backdrop-blur(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.backdropBlur, val)
		},
	}
}

export function backdropBrightness(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "backdropBrightness")) return null
	const _hasDefault = hasDefault(context.config.theme.backdropBrightness)
	return {
		getName() {
			return "backdropBrightness"
		},
		isMatch(value) {
			const match = /^backdrop-brightness(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.backdropBrightness, val)
		},
	}
}

export function backdropContrast(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "backdropContrast")) return null
	const _hasDefault = hasDefault(context.config.theme.backdropContrast)
	return {
		getName() {
			return "backdropContrast"
		},
		isMatch(value) {
			const match = /^backdrop-contrast(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.backdropContrast, val)
		},
	}
}

export function backdropGrayscale(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "backdropGrayscale")) return null
	const _hasDefault = hasDefault(context.config.theme.backdropGrayscale)
	return {
		getName() {
			return "backdropGrayscale"
		},
		isMatch(value) {
			const match = /^backdrop-grayscale(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.backdropGrayscale, val)
		},
	}
}

export function backdropHueRotate(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "backdropHueRotate")) return null
	const _hasDefault = hasDefault(context.config.theme.backdropHueRotate)
	return {
		getName() {
			return "backdropHueRotate"
		},
		isMatch(value) {
			const match = /^-?backdrop-hue-rotate(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			const isNegative = match[0].charCodeAt(0) === 45
			if (isArbitraryValue(val)) return !isNegative
			return isField(context.config.theme.backdropHueRotate, val)
		},
	}
}

export function backdropInvert(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "backdropInvert")) return null
	const _hasDefault = hasDefault(context.config.theme.backdropInvert)
	return {
		getName() {
			return "backdropInvert"
		},
		isMatch(value) {
			const match = /^backdrop-invert(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.backdropInvert, val)
		},
	}
}

export function backdropSaturate(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "backdropSaturate")) return null
	const _hasDefault = hasDefault(context.config.theme.backdropSaturate)
	return {
		getName() {
			return "backdropSaturate"
		},
		isMatch(value) {
			const match = /^backdrop-saturate(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.backdropSaturate, val)
		},
	}
}

export function backdropSepia(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "backdropSepia")) return null
	const _hasDefault = hasDefault(context.config.theme.backdropSepia)
	return {
		getName() {
			return "backdropSepia"
		},
		isMatch(value) {
			const match = /^backdrop-sepia(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.backdropSepia, val)
		},
	}
}
