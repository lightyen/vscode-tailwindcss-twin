import { isArbitraryValue } from "../util"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const gridTemplateColumns: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "gridTemplateColumns")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.gridTemplateColumns)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "gridTemplateColumns"
		},
	}

	function isMatch(value: string) {
		const match = /^grid-cols-(.*)/s.exec(value)
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
gridTemplateColumns.canArbitraryValue = true

export const gridTemplateRows: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "gridTemplateRows")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.gridTemplateRows)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "gridTemplateRows"
		},
	}

	function isMatch(value: string) {
		const match = /^grid-rows-(.*)/s.exec(value)
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
gridTemplateRows.canArbitraryValue = true

export const gridAutoFlow: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "gridAutoFlow")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "gridAutoFlow"
		},
	}

	function isMatch(value: string) {
		return (
			value === "grid-flow-row" ||
			value === "grid-flow-col" ||
			value === "grid-flow-row-dense" ||
			value === "grid-flow-col-dense"
		)
	}
}
gridAutoFlow.canArbitraryValue = false

export const gridAutoColumns: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "gridAutoColumns")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.gridAutoColumns)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "gridAutoColumns"
		},
	}

	function isMatch(value: string) {
		const match = /^auto-cols-(.*)/s.exec(value)
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
gridAutoColumns.canArbitraryValue = true

export const gridAutoRows: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "gridAutoRows")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.gridAutoRows)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "gridAutoRows"
		},
	}

	function isMatch(value: string) {
		const match = /^auto-rows-(.*)/s.exec(value)
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
gridAutoRows.canArbitraryValue = true

export const gridColumn: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "gridColumn")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.gridColumn)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "gridColumn"
		},
	}

	function isMatch(value: string) {
		const match = /^col-(.*)/s.exec(value)
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
gridColumn.canArbitraryValue = true

export const gridColumnStart: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "gridColumnStart")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.gridColumnStart)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "gridColumnStart"
		},
	}

	function isMatch(value: string) {
		const match = /^col-start-(.*)/s.exec(value)
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
gridColumnStart.canArbitraryValue = true

export const gridColumnEnd: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "gridColumnEnd")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.gridColumnEnd)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "gridColumnEnd"
		},
	}

	function isMatch(value: string) {
		const match = /^col-end-(.*)/s.exec(value)
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
gridColumnEnd.canArbitraryValue = true

export const gridRow: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "gridRow")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.gridRow)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "gridRow"
		},
	}

	function isMatch(value: string) {
		const match = /^row-(.*)/s.exec(value)
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
gridRow.canArbitraryValue = true

export const gridRowStart: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "gridRowStart")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.gridRowStart)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "gridRowStart"
		},
	}

	function isMatch(value: string) {
		const match = /^row-start-(.*)/s.exec(value)
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
gridRowStart.canArbitraryValue = true

export const gridRowEnd: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "gridRowEnd")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.gridRowEnd)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "gridRowEnd"
		},
	}

	function isMatch(value: string) {
		const match = /^row-end-(.*)/s.exec(value)
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
gridRowEnd.canArbitraryValue = true
