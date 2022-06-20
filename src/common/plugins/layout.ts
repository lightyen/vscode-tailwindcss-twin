import { Context, hasDefault, isCorePluginEnable, isField, MatchPlugin } from "./_base"
import { isArbitraryValue } from "./_parse"

export function aspectRatio(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "aspectRatio")) return null
	const _hasDefault = hasDefault(context.config.theme.aspectRatio)
	return {
		getName() {
			return "aspectRatio"
		},
		isMatch(value) {
			const match = /^aspect(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.aspectRatio, val)
		},
	}
}

export function container(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "container")) return null
	return {
		getName() {
			return "container"
		},
		isMatch(value) {
			return value === "container"
		},
	}
}

export function columns(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "columns")) return null
	const _hasDefault = hasDefault(context.config.theme.columns)
	return {
		getName() {
			return "columns"
		},
		isMatch(value) {
			const match = /^columns(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.columns, val)
		},
	}
}

export function breakAfter(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "breakAfter")) return null
	return {
		getName() {
			return "breakAfter"
		},
		isMatch(value) {
			const match = /^break-after-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			return (
				val === "auto" ||
				val === "avoid" ||
				val === "all" ||
				val === "avoid-page" ||
				val === "page" ||
				val === "left" ||
				val === "right" ||
				val === "column"
			)
		},
	}
}

export function breakBefore(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "breakBefore")) return null
	return {
		getName() {
			return "breakBefore"
		},
		isMatch(value) {
			const match = /^break-before-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			return (
				val === "auto" ||
				val === "avoid" ||
				val === "all" ||
				val === "avoid-page" ||
				val === "page" ||
				val === "left" ||
				val === "right" ||
				val === "column"
			)
		},
	}
}

export function breakInside(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "breakInside")) return null
	return {
		getName() {
			return "breakInside"
		},
		isMatch(value) {
			const match = /^break-inside-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			return val === "auto" || val === "avoid" || val === "avoid-page" || val === "avoid-column"
		},
	}
}

export function boxDecorationBreak(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "boxDecorationBreak")) return null
	return {
		getName() {
			return "boxDecorationBreak"
		},
		isMatch(value) {
			return (
				value === "decoration-slice" || // deprecated
				value === "decoration-clone" || // deprecated
				value === "box-decoration-slice" ||
				value === "box-decoration-clone"
			)
		},
	}
}

export function boxSizing(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "boxSizing")) return null
	return {
		getName() {
			return "boxSizing"
		},
		isMatch(value) {
			return value === "box-border" || value === "box-content"
		},
	}
}

export function display(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "display")) return null
	return {
		getName() {
			return "display"
		},
		isMatch(value) {
			return (
				value === "block" ||
				value === "inline-block" ||
				value === "inline" ||
				value === "flex" ||
				value === "inline-flex" ||
				value === "table" ||
				value === "inline-table" ||
				value === "table-caption" ||
				value === "table-cell" ||
				value === "table-column" ||
				value === "table-column-group" ||
				value === "table-footer-group" ||
				value === "table-header-group" ||
				value === "table-row-group" ||
				value === "table-row" ||
				value === "flow-root" ||
				value === "grid" ||
				value === "inline-grid" ||
				value === "contents" ||
				value === "list-item" ||
				value === "hidden"
			)
		},
	}
}

export function float(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "float")) return null
	return {
		getName() {
			return "float"
		},
		isMatch(value) {
			return value === "float-left" || value === "float-right" || value === "float-none"
		},
	}
}

export function clear(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "clear")) return null
	return {
		getName() {
			return "clear"
		},
		isMatch(value) {
			const match = /^clear-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			return val === "left" || val === "right" || val === "both" || val === "none"
		},
	}
}

export function isolation(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "isolation")) return null
	return {
		getName() {
			return "isolation"
		},
		isMatch(value) {
			return value === "isolate" || value === "isolation-auto"
		},
	}
}

export function objectFit(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "objectFit")) return null
	return {
		getName() {
			return "objectFit"
		},
		isMatch(value) {
			const match = /^object-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			return val === "contain" || val === "cover" || val === "fill" || val === "none" || val === "scale-down"
		},
	}
}

export function objectPosition(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "objectPosition")) return null
	const _hasDefault = hasDefault(context.config.theme.objectPosition)
	return {
		getName() {
			return "objectPosition"
		},
		isMatch(value) {
			const match = /^-?object(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.objectPosition, val)
		},
	}
}

export function overflow(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "overflow")) return null
	return {
		getName() {
			return "overflow"
		},
		isMatch(value) {
			const match = /^overflow-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			return (
				val === "auto" ||
				val === "hidden" ||
				val === "clip" ||
				val === "visible" ||
				val === "scroll" ||
				val === "x-auto" ||
				val === "x-hidden" ||
				val === "x-clip" ||
				val === "x-visible" ||
				val === "x-scroll" ||
				val === "y-auto" ||
				val === "y-hidden" ||
				val === "y-clip" ||
				val === "y-visible" ||
				val === "y-scroll"
			)
		},
	}
}

export function overscrollBehavior(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "overscrollBehavior")) return null
	return {
		getName() {
			return "overscrollBehavior"
		},
		isMatch(value) {
			const match = /^overscroll-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			return (
				val === "auto" ||
				val === "contain" ||
				val === "none" ||
				val === "x-auto" ||
				val === "x-contain" ||
				val === "x-none" ||
				val === "y-auto" ||
				val === "y-contain" ||
				val === "y-none"
			)
		},
	}
}

export function position(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "position")) return null
	return {
		getName() {
			return "position"
		},
		isMatch(value) {
			return (
				value === "static" ||
				value === "fixed" ||
				value === "absolute" ||
				value === "relative" ||
				value === "sticky"
			)
		},
	}
}

export function inset(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "inset")) return null
	const _hasDefault = hasDefault(context.config.theme.inset)
	return {
		getName() {
			return "inset"
		},
		isMatch(value) {
			const match = /^-?(?:inset-x|inset-y|inset|top|right|bottom|left)(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.inset, val)
		},
	}
}

export function visibility(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "visibility")) return null
	return {
		getName() {
			return "visibility"
		},
		isMatch(value) {
			return value === "visible" || value === "invisible"
		},
	}
}

export function zIndex(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "zIndex")) return null
	const _hasDefault = hasDefault(context.config.theme.zIndex)
	return {
		getName() {
			return "zIndex"
		},
		isMatch(value) {
			const match = /^-?z(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.zIndex, val)
		},
	}
}
