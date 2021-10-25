import { is, isArbitraryValue } from "../util"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const accessibility: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "accessibility")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "accessibility"
		},
	}

	function isMatch(value: string) {
		return value === "sr-only" || value === "not-sr-only"
	}
}
accessibility.canArbitraryValue = false

export const appearance: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "appearance")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "appearance"
		},
	}

	function isMatch(value: string) {
		return value === "appearance-none"
	}
}
appearance.canArbitraryValue = false

export const borderCollapse: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "borderCollapse")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "borderCollapse"
		},
	}

	function isMatch(value: string) {
		return value === "border-collapse" || value === "border-separate"
	}
}
borderCollapse.canArbitraryValue = false

export const borderStyle: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "borderStyle")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "borderStyle"
		},
	}

	function isMatch(value: string) {
		return (
			value === "border-solid" ||
			value === "border-dashed" ||
			value === "border-dotted" ||
			value === "border-double" ||
			value === "border-hidden" ||
			value === "border-none"
		)
	}
}
borderStyle.canArbitraryValue = false

export const boxDecorationBreak: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "boxDecorationBreak")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "boxDecorationBreak"
		},
	}

	function isMatch(value: string) {
		return value === "decoration-slice" || value === "decoration-clone"
	}
}
boxDecorationBreak.canArbitraryValue = false

export const boxSizing: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "boxSizing")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "boxSizing"
		},
	}

	function isMatch(value: string) {
		return value === "box-border" || value === "box-content"
	}
}
boxSizing.canArbitraryValue = false

export const clear: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "clear")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "clear"
		},
	}

	function isMatch(value: string) {
		return value === "clear-left" || value === "clear-right" || value === "clear-both" || value === "clear-none"
	}
}
clear.canArbitraryValue = false

export const container: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "container")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "container"
		},
	}

	function isMatch(value: string) {
		return value === "container"
	}
}
container.canArbitraryValue = false

export const display: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "display")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "display"
		},
	}

	function isMatch(value: string) {
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
	}
}
display.canArbitraryValue = false

export const divideStyle: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "divideStyle")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "divideStyle"
		},
	}

	function isMatch(value: string) {
		return (
			value === "divide-solid" ||
			value === "divide-dashed" ||
			value === "divide-dotted" ||
			value === "divide-double" ||
			value === "divide-none"
		)
	}
}
divideStyle.canArbitraryValue = false

export const isolation: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "isolation")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "isolation"
		},
	}

	function isMatch(value: string) {
		return value === "isolate" || value === "isolation-auto"
	}
}
isolation.canArbitraryValue = false

export const mixBlendMode: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "mixBlendMode")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "mixBlendMode"
		},
	}

	function isMatch(value: string) {
		return (
			value === "mix-blend-normal" ||
			value === "mix-blend-multiply" ||
			value === "mix-blend-screen" ||
			value === "mix-blend-overlay" ||
			value === "mix-blend-darken" ||
			value === "mix-blend-lighten" ||
			value === "mix-blend-color-dodge" ||
			value === "mix-blend-color-burn" ||
			value === "mix-blend-hard-light" ||
			value === "mix-blend-soft-light" ||
			value === "mix-blend-difference" ||
			value === "mix-blend-exclusion" ||
			value === "mix-blend-hue" ||
			value === "mix-blend-saturation" ||
			value === "mix-blend-color" ||
			value === "mix-blend-luminosity"
		)
	}
}
mixBlendMode.canArbitraryValue = false

export const overflow: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "overflow")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "overflow"
		},
	}

	function isMatch(value: string) {
		return (
			value === "overflow-auto" ||
			value === "overflow-hidden" ||
			value === "overflow-visible" ||
			value === "overflow-scroll" ||
			value === "overflow-x-auto" ||
			value === "overflow-y-auto" ||
			value === "overflow-x-hidden" ||
			value === "overflow-y-hidden" ||
			value === "overflow-x-clip" ||
			value === "overflow-y-clip" ||
			value === "overflow-x-visible" ||
			value === "overflow-y-visible" ||
			value === "overflow-x-scroll" ||
			value === "overflow-y-scroll"
		)
	}
}
overflow.canArbitraryValue = false

export const textOverflow: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "textOverflow")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "textOverflow"
		},
	}

	function isMatch(value: string) {
		return value === "truncate" || value === "overflow-ellipsis" || value === "overflow-clip"
	}
}
textOverflow.canArbitraryValue = false

export const overscrollBehavior: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "overscrollBehavior")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "overscrollBehavior"
		},
	}

	function isMatch(value: string) {
		return (
			value === "overscroll-auto" ||
			value === "overscroll-contain" ||
			value === "overscroll-none" ||
			value === "overscroll-y-auto" ||
			value === "overscroll-y-contain" ||
			value === "overscroll-y-none" ||
			value === "overscroll-x-auto" ||
			value === "overscroll-x-contain" ||
			value === "overscroll-x-none"
		)
	}
}
overscrollBehavior.canArbitraryValue = false

export const pointerEvents: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "pointerEvents")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "pointerEvents"
		},
	}

	function isMatch(value: string) {
		return value === "pointer-events-none" || value === "pointer-events-auto"
	}
}
pointerEvents.canArbitraryValue = false

export const position: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "position")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "position"
		},
	}

	function isMatch(value: string) {
		return (
			value === "static" ||
			value === "fixed" ||
			value === "absolute" ||
			value === "relative" ||
			value === "sticky"
		)
	}
}
position.canArbitraryValue = false

export const resize: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "resize")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "resize"
		},
	}

	function isMatch(value: string) {
		return value === "resize-none" || value === "resize" || value === "resize-x" || value === "resize-y"
	}
}
resize.canArbitraryValue = false

export const tableLayout: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "tableLayout")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "tableLayout"
		},
	}

	function isMatch(value: string) {
		return value === "table-auto" || value === "table-fixed"
	}
}
tableLayout.canArbitraryValue = false

export const textDecoration: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "textDecoration")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "textDecoration"
		},
	}

	function isMatch(value: string) {
		return value === "underline" || value === "line-through" || value === "no-underline"
	}
}
textDecoration.canArbitraryValue = false

export const textTransform: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "textTransform")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "textTransform"
		},
	}

	function isMatch(value: string) {
		return value === "uppercase" || value === "lowercase" || value === "capitalize" || value === "normal-case"
	}
}
textTransform.canArbitraryValue = false

export const userSelect: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "userSelect")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "userSelect"
		},
	}

	function isMatch(value: string) {
		return value === "select-none" || value === "select-text" || value === "select-all" || value === "select-auto"
	}
}
userSelect.canArbitraryValue = false

export const visibility: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "visibility")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "visibility"
		},
	}

	function isMatch(value: string) {
		return value === "visible" || value === "invisible"
	}
}
visibility.canArbitraryValue = false

export const whitespace: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "whitespace")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "whitespace"
		},
	}

	function isMatch(value: string) {
		return (
			value === "whitespace-normal" ||
			value === "whitespace-nowrap" ||
			value === "whitespace-pre" ||
			value === "whitespace-pre-line" ||
			value === "whitespace-pre-wrap"
		)
	}
}
whitespace.canArbitraryValue = false

export const wordBreak: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "wordBreak")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "wordBreak"
		},
	}

	function isMatch(value: string) {
		return value === "break-normal" || value === "break-words" || value === "break-all"
	}
}
wordBreak.canArbitraryValue = false

export const float: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "float")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "float"
		},
	}

	function isMatch(value: string) {
		return value === "float-right" || value === "float-left" || value === "float-none"
	}
}
float.canArbitraryValue = false

export const alignContent: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "alignContent")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "alignContent"
		},
	}

	function isMatch(value: string) {
		return (
			value === "content-center" ||
			value === "content-start" ||
			value === "content-end" ||
			value === "content-between" ||
			value === "content-around" ||
			value === "content-evenly"
		)
	}
}
alignContent.canArbitraryValue = false

export const alignItems: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "alignItems")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "alignItems"
		},
	}

	function isMatch(value: string) {
		return (
			value === "items-start" ||
			value === "items-end" ||
			value === "items-center" ||
			value === "items-baseline" ||
			value === "items-stretch"
		)
	}
}
alignItems.canArbitraryValue = false

export const alignSelf: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "alignSelf")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "alignSelf"
		},
	}

	function isMatch(value: string) {
		return (
			value === "self-auto" ||
			value === "self-start" ||
			value === "self-end" ||
			value === "self-center" ||
			value === "self-stretch" ||
			value === "self-baseline"
		)
	}
}
alignSelf.canArbitraryValue = false

export const placeContent: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "placeContent")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "placeContent"
		},
	}

	function isMatch(value: string) {
		return (
			value === "place-content-center" ||
			value === "place-content-start" ||
			value === "place-content-end" ||
			value === "place-content-between" ||
			value === "place-content-around" ||
			value === "place-content-evenly" ||
			value === "place-content-stretch"
		)
	}
}
placeContent.canArbitraryValue = false

export const placeItems: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "placeItems")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "placeItems"
		},
	}

	function isMatch(value: string) {
		return (
			value === "place-items-start" ||
			value === "place-items-end" ||
			value === "place-items-center" ||
			value === "place-items-stretch"
		)
	}
}
placeItems.canArbitraryValue = false

export const placeSelf: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "placeSelf")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "placeSelf"
		},
	}

	function isMatch(value: string) {
		return (
			value === "place-self-auto" ||
			value === "place-self-start" ||
			value === "place-self-end" ||
			value === "place-self-center" ||
			value === "place-self-stretch"
		)
	}
}
placeSelf.canArbitraryValue = false

export const justifyContent: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "justifyContent")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "justifyContent"
		},
	}

	function isMatch(value: string) {
		return (
			value === "justify-start" ||
			value === "justify-end" ||
			value === "justify-center" ||
			value === "justify-between" ||
			value === "justify-around" ||
			value === "justify-evenly"
		)
	}
}
justifyContent.canArbitraryValue = false

export const justifyItems: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "justifyItems")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "justifyItems"
		},
	}

	function isMatch(value: string) {
		return (
			value === "justify-items-start" ||
			value === "justify-items-end" ||
			value === "justify-items-center" ||
			value === "justify-items-stretch"
		)
	}
}
justifyItems.canArbitraryValue = false

export const justifySelf: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "justifySelf")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "justifySelf"
		},
	}

	function isMatch(value: string) {
		return (
			value === "justify-self-auto" ||
			value === "justify-self-start" ||
			value === "justify-self-end" ||
			value === "justify-self-center" ||
			value === "justify-self-stretch"
		)
	}
}
justifySelf.canArbitraryValue = false

export const verticalAlign: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "verticalAlign")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "verticalAlign"
		},
	}

	function isMatch(value: string) {
		return (
			value === "align-baseline" ||
			value === "align-top" ||
			value === "align-middle" ||
			value === "align-bottom" ||
			value === "align-text-top" ||
			value === "align-text-bottom" ||
			value === "align-sub" ||
			value === "align-super"
		)
	}
}
verticalAlign.canArbitraryValue = false

export const textAlign: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "textAlign")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "textAlign"
		},
	}

	function isMatch(value: string) {
		return value === "text-left" || value === "text-center" || value === "text-right" || value === "text-justify"
	}
}
textAlign.canArbitraryValue = false

export const backgroundBlendMode: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "backgroundBlendMode")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "backgroundBlendMode"
		},
	}

	function isMatch(value: string) {
		return (
			value === "bg-blend-normal" ||
			value === "bg-blend-multiply" ||
			value === "bg-blend-screen" ||
			value === "bg-blend-overlay" ||
			value === "bg-blend-darken" ||
			value === "bg-blend-lighten" ||
			value === "bg-blend-color-dodge" ||
			value === "bg-blend-color-burn" ||
			value === "bg-blend-hard-light" ||
			value === "bg-blend-soft-light" ||
			value === "bg-blend-difference" ||
			value === "bg-blend-exclusion" ||
			value === "bg-blend-hue" ||
			value === "bg-blend-saturation" ||
			value === "bg-blend-color" ||
			value === "bg-blend-luminosity"
		)
	}
}
backgroundBlendMode.canArbitraryValue = false

export const backgroundClip: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "backgroundClip")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "backgroundClip"
		},
	}

	function isMatch(value: string) {
		return (
			value === "bg-clip-border" ||
			value === "bg-clip-padding" ||
			value === "bg-clip-content" ||
			value === "bg-clip-text"
		)
	}
}
backgroundClip.canArbitraryValue = false

export const backgroundOrigin: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "backgroundOrigin")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "backgroundOrigin"
		},
	}

	function isMatch(value: string) {
		return value === "bg-origin-border" || value === "bg-origin-padding" || value === "bg-origin-content"
	}
}
backgroundOrigin.canArbitraryValue = false

export const backgroundAttachment: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "backgroundAttachment")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "backgroundAttachment"
		},
	}

	function isMatch(value: string) {
		return value === "bg-fixed" || value === "bg-local" || value === "bg-scroll"
	}
}
backgroundAttachment.canArbitraryValue = false

export const backgroundRepeat: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "backgroundRepeat")) throw ErrorNotEnable

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "backgroundRepeat"
		},
	}

	function isMatch(value: string) {
		return (
			value === "bg-repeat" ||
			value === "bg-no-repeat" ||
			value === "bg-repeat-round" ||
			value === "bg-repeat-space" ||
			value === "bg-repeat-x" ||
			value === "bg-repeat-y"
		)
	}
}
backgroundRepeat.canArbitraryValue = false

export const backgroundImage: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "backgroundImage")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.backgroundImage)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "backgroundImage"
		},
	}

	function isMatch(value: string) {
		const match = /^bg-(.*)/s.exec(value)
		if (!match) {
			return false
		}

		let val = match[1]

		if (isArbitraryValue(val)) {
			val = val.slice(1, -1).trim()
			return is(val, "image")
		}

		return values.some(c => c === val)
	}
}
backgroundImage.canArbitraryValue = false

export const backgroundPosition: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "backgroundPosition")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.backgroundPosition)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "backgroundPosition"
		},
	}

	function isMatch(value: string) {
		const match = /^bg-(.*)/s.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		return values.some(c => c === val)
	}
}
backgroundPosition.canArbitraryValue = false

export const backgroundSize: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "backgroundSize")) throw ErrorNotEnable
	const values = Object.keys(context.config.theme.backgroundSize)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "backgroundSize"
		},
	}

	function isMatch(value: string) {
		const match = /^bg-(.*)/s.exec(value)
		if (!match) {
			return false
		}

		let val = match[1]

		if (isArbitraryValue(val)) {
			val = val.slice(1, -1)
			return is(val, "length", "percentage")
		}

		return values.some(c => c === val)
	}
}
backgroundSize.canArbitraryValue = true
