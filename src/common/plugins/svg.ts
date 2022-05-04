import { Context, getOpacity, getPalette, hasDefault, isCorePluginEnable, isField, MatchPlugin } from "./_base"
import { Is, isArbitraryValue, isMatchColor } from "./_parse"

export function fill(context: Context): MatchPlugin | null {
	const palette = getPalette(context, "fill")
	if (palette == null) return null
	const colors = new Set(palette)
	const o = getOpacity(context)
	const opacities = o ? new Set(o) : null
	return {
		getName() {
			return "fill"
		},
		isMatch(value: string) {
			const match = /^fill-(.*)/s.exec(value)
			if (!match) return false
			return isMatchColor(match[1], colors, opacities, val =>
				Is(context, val, "empty", "url", "var", "color", "none"),
			)
		},
	}
}

export function stroke(context: Context): MatchPlugin | null {
	const palette = getPalette(context, "stroke")
	if (palette == null) return null
	const colors = new Set(palette)
	const o = getOpacity(context)
	const opacities = o ? new Set(o) : null
	return {
		getName() {
			return "stroke"
		},
		isMatch(value: string) {
			const match = /^stroke-(.*)/s.exec(value)
			if (!match) return false
			return isMatchColor(match[1], colors, opacities, val => Is(context, val, "url", "color"))
		},
	}
}

export function strokeWidth(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "strokeWidth")) return null
	const _hasDefault = hasDefault(context.config.theme.strokeWidth)
	return {
		getName() {
			return "strokeWidth"
		},
		isMatch(value) {
			const match = /^stroke(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			let val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) {
				val = val.slice(1, -1)
				return Is(context, val, "length", "percentage", "number")
			}
			return isField(context.config.theme.strokeWidth, val)
		},
	}
}
