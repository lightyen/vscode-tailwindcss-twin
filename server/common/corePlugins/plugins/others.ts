import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

export const accessibility: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "accessibility"
		if (!this.context.resolved.corePlugins.some(c => c === "accessibility")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return value === "sr-only" || value === "not-sr-only"
	}
}

export const appearance: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "appearance"
		if (!this.context.resolved.corePlugins.some(c => c === "appearance")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return value === "appearance-none"
	}
}

export const borderCollapse: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "borderCollapse"
		if (!this.context.resolved.corePlugins.some(c => c === "borderCollapse")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return value === "border-collapse" || value === "border-separate"
	}
}

export const borderStyle: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "borderStyle"
		if (!this.context.resolved.corePlugins.some(c => c === "borderStyle")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return (
			value === "border-solid" ||
			value === "border-dashed" ||
			value === "border-dotted" ||
			value === "border-double" ||
			value === "border-none"
		)
	}
}

export const boxDecorationBreak: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "boxDecorationBreak"
		if (!this.context.resolved.corePlugins.some(c => c === "boxDecorationBreak")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return value === "decoration-slice" || value === "decoration-clone"
	}
}

export const boxSizing: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "boxSizing"
		if (!this.context.resolved.corePlugins.some(c => c === "boxSizing")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return value === "box-border" || value === "box-content"
	}
}

export const clear: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "clear"
		if (!this.context.resolved.corePlugins.some(c => c === "clear")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return value === "clear-left" || value === "clear-right" || value === "clear-both" || value === "clear-none"
	}
}

export const container: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "container"
		if (!this.context.resolved.corePlugins.some(c => c === "container")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return value === "container"
	}
}

export const display: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "display"
		if (!this.context.resolved.corePlugins.some(c => c === "display")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
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

export const divideStyle: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "divideStyle"
		if (!this.context.resolved.corePlugins.some(c => c === "divideStyle")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return (
			value === "divide-solid" ||
			value === "divide-dashed" ||
			value === "divide-dotted" ||
			value === "divide-double" ||
			value === "divide-none"
		)
	}
}

export const isolation: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "isolation"
		if (!this.context.resolved.corePlugins.some(c => c === "isolation")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return value === "isolate" || value === "isolation-auto"
	}
}

export const mixBlendMode: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "mixBlendMode"
		if (!this.context.resolved.corePlugins.some(c => c === "mixBlendMode")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
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

export const overflow: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "overflow"
		if (!this.context.resolved.corePlugins.some(c => c === "overflow")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return (
			value === "overflow-auto" ||
			value === "overflow-hidden" ||
			value === "overflow-visible" ||
			value === "overflow-scroll" ||
			value === "overflow-x-auto" ||
			value === "overflow-y-auto" ||
			value === "overflow-x-hidden" ||
			value === "overflow-y-hidden" ||
			value === "overflow-x-visible" ||
			value === "overflow-y-visible" ||
			value === "overflow-x-scroll" ||
			value === "overflow-y-scroll"
		)
	}
}

export const textOverflow: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "textOverflow"
		if (!this.context.resolved.corePlugins.some(c => c === "textOverflow")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return value === "truncate" || value === "overflow-ellipsis" || value === "overflow-clip"
	}
}

export const overscrollBehavior: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "overscrollBehavior"
		if (!this.context.resolved.corePlugins.some(c => c === "overscrollBehavior")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
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

export const pointerEvents: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "pointerEvents"
		if (!this.context.resolved.corePlugins.some(c => c === "pointerEvents")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return value === "pointer-events-none" || value === "pointer-events-auto"
	}
}

export const position: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "position"
		if (!this.context.resolved.corePlugins.some(c => c === "position")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return (
			value === "static" ||
			value === "fixed" ||
			value === "absolute" ||
			value === "relative" ||
			value === "sticky"
		)
	}
}

export const resize: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "resize"
		if (!this.context.resolved.corePlugins.some(c => c === "resize")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return value === "resize-none" || value === "resize" || value === "resize-x" || value === "resize-y"
	}
}

export const tableLayout: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "tableLayout"
		if (!this.context.resolved.corePlugins.some(c => c === "tableLayout")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return value === "table-auto" || value === "table-fixed"
	}
}

export const textDecoration: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "textDecoration"
		if (!this.context.resolved.corePlugins.some(c => c === "textDecoration")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return value === "underline" || value === "line-through" || value === "no-underline"
	}
}

export const textTransform: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "textTransform"
		if (!this.context.resolved.corePlugins.some(c => c === "textTransform")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return value === "uppercase" || value === "lowercase" || value === "capitalize" || value === "normal-case"
	}
}

export const userSelect: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "userSelect"
		if (!this.context.resolved.corePlugins.some(c => c === "userSelect")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return value === "select-none" || value === "select-text" || value === "select-all" || value === "select-auto"
	}
}

export const visibility: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "visibility"
		if (!this.context.resolved.corePlugins.some(c => c === "visibility")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return value === "visible" || value === "invisible"
	}
}

export const whitespace: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "whitespace"
		if (!this.context.resolved.corePlugins.some(c => c === "whitespace")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return (
			value === "whitespace-normal" ||
			value === "whitespace-nowrap" ||
			value === "whitespace-pre" ||
			value === "whitespace-pre-line" ||
			value === "whitespace-pre-wrap"
		)
	}
}

export const wordBreak: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "wordBreak"
		if (!this.context.resolved.corePlugins.some(c => c === "wordBreak")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return value === "break-normal" || value === "break-words" || value === "break-all"
	}
}

export const float: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "float"
		if (!this.context.resolved.corePlugins.some(c => c === "float")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return value === "float-right" || value === "float-left" || value === "float-none"
	}
}

export const alignContent: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "alignContent"
		if (!this.context.resolved.corePlugins.some(c => c === "alignContent")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
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

export const alignItems: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "alignItems"
		if (!this.context.resolved.corePlugins.some(c => c === "alignItems")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return (
			value === "items-start" ||
			value === "items-end" ||
			value === "items-center" ||
			value === "items-baseline" ||
			value === "items-stretch"
		)
	}
}

export const alignSelf: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "alignSelf"
		if (!this.context.resolved.corePlugins.some(c => c === "alignSelf")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
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

export const placeContent: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "placeContent"
		if (!this.context.resolved.corePlugins.some(c => c === "placeContent")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
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

export const placeItems: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "placeItems"
		if (!this.context.resolved.corePlugins.some(c => c === "placeItems")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return (
			value === "place-items-start" ||
			value === "place-items-end" ||
			value === "place-items-center" ||
			value === "place-items-stretch"
		)
	}
}

export const placeSelf: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "placeSelf"
		if (!this.context.resolved.corePlugins.some(c => c === "placeSelf")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return (
			value === "place-self-auto" ||
			value === "place-self-start" ||
			value === "place-self-end" ||
			value === "place-self-center" ||
			value === "place-self-stretch"
		)
	}
}

export const justifyContent: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "justifyContent"
		if (!this.context.resolved.corePlugins.some(c => c === "justifyContent")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
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

export const justifyItems: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "justifyItems"
		if (!this.context.resolved.corePlugins.some(c => c === "justifyItems")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return (
			value === "justify-items-start" ||
			value === "justify-items-end" ||
			value === "justify-items-center" ||
			value === "justify-items-stretch"
		)
	}
}

export const justifySelf: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "justifySelf"
		if (!this.context.resolved.corePlugins.some(c => c === "justifySelf")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return (
			value === "justify-self-auto" ||
			value === "justify-self-start" ||
			value === "justify-self-end" ||
			value === "justify-self-center" ||
			value === "justify-self-stretch"
		)
	}
}

export const verticalAlign: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "verticalAlign"
		if (!this.context.resolved.corePlugins.some(c => c === "verticalAlign")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return (
			value === "align-baseline" ||
			value === "align-top" ||
			value === "align-middle" ||
			value === "align-bottom" ||
			value === "align-text-top" ||
			value === "align-text-bottom"
		)
	}
}

export const textAlign: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "textAlign"
		if (!this.context.resolved.corePlugins.some(c => c === "textAlign")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return value === "text-left" || value === "text-center" || value === "text-right" || value === "text-justify"
	}
}

export const backgroundBlendMode: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "backgroundBlendMode"
		if (!this.context.resolved.corePlugins.some(c => c === "backgroundBlendMode")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
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

export const backgroundClip: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "backgroundClip"
		if (!this.context.resolved.corePlugins.some(c => c === "backgroundClip")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return (
			value === "bg-clip-border" ||
			value === "bg-clip-padding" ||
			value === "bg-clip-content" ||
			value === "bg-clip-text"
		)
	}
}

export const backgroundOrigin: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "backgroundOrigin"
		if (!this.context.resolved.corePlugins.some(c => c === "backgroundOrigin")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return value === "bg-origin-border" || value === "bg-origin-padding" || value === "bg-origin-content"
	}
}

export const backgroundAttachment: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "backgroundAttachment"
		if (!this.context.resolved.corePlugins.some(c => c === "backgroundAttachment")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
		return value === "bg-fixed" || value === "bg-local" || value === "bg-scroll"
	}
}

export const backgroundRepeat: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	constructor(private context: Context) {
		this.name = "backgroundRepeat"
		if (!this.context.resolved.corePlugins.some(c => c === "backgroundRepeat")) {
			throw ErrorNotEnable
		}
	}
	isMatch(value: string) {
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

export const backgroundImage: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "backgroundImage"
		if (!this.context.resolved.corePlugins.some(c => c === "backgroundImage")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.backgroundImage)
	}
	isMatch(value: string) {
		const match = /^bg-(.*)/.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		return this.values.some(c => c === val)
	}
}

export const backgroundPosition: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "backgroundPosition"
		if (!this.context.resolved.corePlugins.some(c => c === "backgroundPosition")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.backgroundPosition)
	}
	isMatch(value: string) {
		const match = /^bg-(.*)/.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		return this.values.some(c => c === val)
	}
}

export const backgroundSize: PluginConstructor = class implements Plugin {
	static canArbitraryValue = false
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	constructor(private context: Context) {
		this.name = "backgroundSize"
		if (!this.context.resolved.corePlugins.some(c => c === "backgroundSize")) {
			throw ErrorNotEnable
		}
		this.values = Object.keys(this.context.resolved.theme.backgroundSize)
	}
	isMatch(value: string) {
		const match = /^bg-(.*)/.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		return this.values.some(c => c === val)
	}
}
