import { Context, hasDefault, isCorePluginEnable, isField, MatchPlugin } from "./_base"
import { isArbitraryValue } from "./_parse"

export function flexBasis(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "flexBasis")) return null
	const _hasDefault = hasDefault(context.config.theme.flexBasis)
	return {
		getName() {
			return "flexBasis"
		},
		isMatch(value) {
			const match = /^basis(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.flexBasis, val)
		},
	}
}

export function flexDirection(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "flexDirection")) return null
	return {
		getName() {
			return "flexDirection"
		},
		isMatch(value) {
			return (
				value === "flex-row" ||
				value === "flex-row-reverse" ||
				value === "flex-col" ||
				value === "flex-col-reverse"
			)
		},
	}
}

export function flexWrap(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "flexWrap")) return null
	return {
		getName() {
			return "flexWrap"
		},
		isMatch(value) {
			return value === "flex-wrap" || value === "flex-wrap-reverse" || value === "flex-nowrap"
		},
	}
}

export function flex(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "flex")) return null
	return {
		getName() {
			return "flex"
		},
		isMatch(value) {
			const match = /^flex-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.flex, val)
		},
	}
}

export function flexGrow(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "flexGrow")) return null
	const _hasDefault = hasDefault(context.config.theme.flexGrow)
	return {
		getName() {
			return "flexGrow"
		},
		isMatch(value) {
			const match = /^(?:flex-)?grow(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.flexGrow, val)
		},
	}
}

export function flexShrink(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "flexShrink")) return null
	const _hasDefault = hasDefault(context.config.theme.flexShrink)
	return {
		getName() {
			return "flexShrink"
		},
		isMatch(value) {
			const match = /^(?:flex-)?shrink(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.flexShrink, val)
		},
	}
}

export function order(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "order")) return null
	const _hasDefault = hasDefault(context.config.theme.order)
	return {
		getName() {
			return "order"
		},
		isMatch(value) {
			const match = /^-?order(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			const isNegative = match[0].charCodeAt(0) === 45
			if (isArbitraryValue(val)) return !isNegative
			return isField(context.config.theme.order, val)
		},
	}
}

export function gridTemplateColumns(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "gridTemplateColumns")) return null
	const _hasDefault = hasDefault(context.config.theme.gridTemplateColumns)
	return {
		getName() {
			return "gridTemplateColumns"
		},
		isMatch(value) {
			const match = /^grid-cols(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.gridTemplateColumns, val)
		},
	}
}

export function gridColumn(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "gridColumn")) return null
	const _hasDefault = hasDefault(context.config.theme.gridColumn)
	return {
		getName() {
			return "gridColumn"
		},
		isMatch(value) {
			const match = /^col(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.gridColumn, val)
		},
	}
}

export function gridColumnStart(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "gridColumnStart")) return null
	const _hasDefault = hasDefault(context.config.theme.gridColumnStart)
	return {
		getName() {
			return "gridColumnStart"
		},
		isMatch(value) {
			const match = /^col-start(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.gridColumnStart, val)
		},
	}
}

export function gridColumnEnd(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "gridColumnEnd")) return null
	const _hasDefault = hasDefault(context.config.theme.gridColumnEnd)
	return {
		getName() {
			return "gridColumnEnd"
		},
		isMatch(value) {
			const match = /^col-end(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.gridColumnEnd, val)
		},
	}
}

export function gridTemplateRows(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "gridTemplateRows")) return null
	const _hasDefault = hasDefault(context.config.theme.gridTemplateRows)
	return {
		getName() {
			return "gridTemplateRows"
		},
		isMatch(value) {
			const match = /^grid-rows(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.gridTemplateRows, val)
		},
	}
}

export function gridRow(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "gridRow")) return null
	const _hasDefault = hasDefault(context.config.theme.gridRow)
	return {
		getName() {
			return "gridRow"
		},
		isMatch(value) {
			const match = /^row(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.gridRow, val)
		},
	}
}

export function gridRowStart(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "gridRowStart")) return null
	const _hasDefault = hasDefault(context.config.theme.gridRowStart)
	return {
		getName() {
			return "gridRowStart"
		},
		isMatch(value) {
			const match = /^row-start(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.gridRowStart, val)
		},
	}
}

export function gridRowEnd(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "gridRowEnd")) return null
	const _hasDefault = hasDefault(context.config.theme.gridRowEnd)
	return {
		getName() {
			return "gridRowEnd"
		},
		isMatch(value) {
			const match = /^row-end(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.gridRowEnd, val)
		},
	}
}

export function gridAutoFlow(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "gridAutoFlow")) return null
	return {
		getName() {
			return "gridAutoFlow"
		},
		isMatch(value) {
			const match = /^grid-flow-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			return val === "row" || val === "col" || val === "dense" || val === "row-dense" || val === "col-dense"
		},
	}
}

export function gridAutoColumns(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "gridAutoColumns")) return null
	const _hasDefault = hasDefault(context.config.theme.gridAutoColumns)
	return {
		getName() {
			return "gridAutoColumns"
		},
		isMatch(value) {
			const match = /^auto-cols(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.gridAutoColumns, val)
		},
	}
}

export function gridAutoRows(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "gridAutoRows")) return null
	const _hasDefault = hasDefault(context.config.theme.gridAutoRows)
	return {
		getName() {
			return "gridAutoRows"
		},
		isMatch(value) {
			const match = /^auto-rows(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.gridAutoRows, val)
		},
	}
}

export function gap(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "gap")) return null
	const _hasDefault = hasDefault(context.config.theme.gap)
	return {
		getName() {
			return "gap"
		},
		isMatch(value) {
			const match = /^(?:gap-x|gap-y|gap)(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.spacing, val)
		},
	}
}

export function justifyContent(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "justifyContent")) return null
	return {
		getName() {
			return "justifyContent"
		},
		isMatch(value) {
			const match = /^justify-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			return (
				val === "start" ||
				val === "end" ||
				val === "center" ||
				val === "between" ||
				val === "around" ||
				val === "evenly"
			)
		},
	}
}

export function justifyItems(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "justifyItems")) return null
	return {
		getName() {
			return "justifyItems"
		},
		isMatch(value) {
			const match = /^justify-items-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			return val === "start" || val === "end" || val === "center" || val === "stretch"
		},
	}
}

export function justifySelf(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "justifySelf")) return null
	return {
		getName() {
			return "justifySelf"
		},
		isMatch(value) {
			const match = /^justify-self-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			return val === "auto" || val === "start" || val === "end" || val === "center" || val === "stretch"
		},
	}
}

export function alignContent(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "alignContent")) return null
	return {
		getName() {
			return "alignContent"
		},
		isMatch(value) {
			const match = /^content-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			return (
				val === "center" ||
				val === "start" ||
				val === "end" ||
				val === "between" ||
				val === "around" ||
				val === "evenly"
			)
		},
	}
}

export function alignItems(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "alignItems")) return null
	return {
		getName() {
			return "alignItems"
		},
		isMatch(value) {
			const match = /^items-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			return val === "start" || val === "end" || val === "center" || val === "baseline" || val === "stretch"
		},
	}
}

export function alignSelf(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "alignSelf")) return null
	return {
		getName() {
			return "alignSelf"
		},
		isMatch(value) {
			const match = /^self-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			return (
				val === "auto" ||
				val === "start" ||
				val === "end" ||
				val === "center" ||
				val === "stretch" ||
				val === "baseline"
			)
		},
	}
}

export function placeContent(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "placeContent")) return null
	return {
		getName() {
			return "placeContent"
		},
		isMatch(value) {
			const match = /^place-content-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			return (
				val === "center" ||
				val === "start" ||
				val === "end" ||
				val === "between" ||
				val === "around" ||
				val === "evenly" ||
				val === "stretch"
			)
		},
	}
}

export function placeItems(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "placeItems")) return null
	return {
		getName() {
			return "placeItems"
		},
		isMatch(value) {
			const match = /^place-items-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			return val === "start" || val === "end" || val === "center" || val === "stretch"
		},
	}
}

export function placeSelf(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "placeSelf")) return null
	return {
		getName() {
			return "placeSelf"
		},
		isMatch(value) {
			const match = /^place-self-(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			return val === "auto" || val === "start" || val === "end" || val === "center" || val === "stretch"
		},
	}
}
