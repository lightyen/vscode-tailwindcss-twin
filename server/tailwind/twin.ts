/* eslint-disable @typescript-eslint/no-non-null-assertion */
import chroma from "chroma-js"
import Fuse from "fuse.js"
import type { AtRule, Node, Result, Rule } from "postcss"
import parser from "postcss-selector-parser"
import { getValueType, ValueType } from "./cssValue"

const twinVariants: Array<[string, string[]]> = [
	// @media
	["dark", ["@media (prefers-color-scheme: dark)"]],
	["light", ["@media (prefers-color-scheme: light)"]],
	["screen", ["@media screen"]],
	["print", ["@media print"]],
	["landscape", ["@media (orientation: landscape)"]],
	["portrait", ["@media (orientation: portrait)"]],
	["any-pointer-none", ["@media (any-pointer: none)"]],
	["any-pointer-fine", ["@media (any-pointer: fine)"]],
	["any-pointer-coarse", ["@media (any-pointer: coarse)"]],
	["pointer-none", ["@media (pointer: none)"]],
	["pointer-fine", ["@media (pointer: fine)"]],
	["pointer-coarse", ["@media (pointer: coarse)"]],
	["any-hover", ["@media (any-hover: hover)"]],
	["any-hover-none", ["@media (any-hover: none)"]],
	["can-hover", ["@media (hover: hover)"]],
	["cant-hover", ["@media (hover: none)"]],
	["motion-reduce", ["@media (prefers-reduced-motion: reduce)"]],
	["motion-safe", ["@media (prefers-reduced-motion: no-preference)"]],

	// selector
	["all", ["*"]],
	["svg", ["svg"]],
	["sibling", ["~ *"]],
	["all-child", ["> *"]],

	// not
	["not-first", [":not(:first-child)"]],
	["not-last", [":not(:last-child)"]],
	["not-only", [":not(:only-child)"]], // NOTE: maybe not supported
	["not-first-of-type", [":not(:first-of-type)"]],
	["not-last-of-type", [":not(:last-of-type)"]],
	["not-only-of-type", [":not(:only-of-type)"]],
	["not-checked", [":not(:checked)"]],
	["not-disabled", [":not(:disabled)"]],

	// Basic pseudo variants
	["first", [":first-child"]],
	["last", [":last-child"]],
	["only", [":only-child"]], // NOTE: duplicate with "only-child:"
	["even", [":nth-child(even)"]],
	["odd", [":nth-child(odd)"]],
	["first-of-type", [":first-of-type"]],
	["last-of-type", [":last-of-type"]],
	["only-of-type", [":only-of-type"]],
	["hover", [":hover"]],
	["focus", [":focus"]],
	["disabled", [":disabled"]],
	["active", [":active"]],
	["target", [":target"]],
	["visited", [":visited"]],
	["default", [":default"]],
	["checked", [":checked"]],
	["indeterminate", [":indeterminate"]],
	["placeholder-shown", [":placeholder-shown"]],
	["autofill", [":autofill"]],
	["focus-within", [":focus-within"]],
	["focus-visible", [":focus-visible"]],
	["required", [":required"]],
	["valid", [":valid"]],
	["invalid", [":invalid"]],
	["in-range", [":in-range"]],
	["out-of-range", [":out-of-range"]],
	["read-only", [":read-only"]],
	["empty", [":empty"]],

	// Pseudo-element variants
	["first-letter", ["::first-letter"]],
	["first-line", ["::first-line"]],
	["marker", ["::marker"]],
	["selection", ["::selection"]],
	["before", ["::before"]],
	["after", ["::after"]],

	// Group variants
	["group-first", [".group:first-child"]], // NOTE: maybe not supported
	["group-last", [".group:last-child"]], // NOTE: maybe not supported
	["group-only", [".group:only-child"]], // NOTE: maybe not supported
	["group-even", [".group:nth-child(even)"]], // NOTE: maybe not supported
	["group-odd", [".group:nth-child(odd)"]], // NOTE: maybe not supported
	["group-first-of-type", [".group:first-of-type"]], // NOTE: maybe not supported
	["group-last-of-type", [".group:last-of-type"]], // NOTE: maybe not supported
	["group-only-of-type", [".group:only-of-type"]], // NOTE: maybe not supported
	["group-hover", [".group:hover"]],
	["group-focus", [".group:focus"]],
	["group-disabled", [".group:disabled"]], // NOTE: maybe not supported
	["group-active", [".group:active"]],
	["group-target", [".group:target"]], // NOTE: maybe not supported
	["group-visited", [".group:visited"]],
	["group-default", [".group:default"]], // NOTE: maybe not supported
	["group-checked", [".group:checked"]], // NOTE: maybe not supported
	["group-indeterminate", [".group:indeterminate"]], // NOTE: maybe not supported
	["group-placeholder-shown", [".group:placeholder-shown"]], // NOTE: maybe not supported
	["group-autofill", [".group:autofill"]], // NOTE: maybe not supported
	["group-focus-within", [".group:focus-within"]], // NOTE: maybe not supported
	["group-focus-visible", [".group:focus-visible"]], // NOTE: maybe not supported
	["group-required", [".group:required"]], // NOTE: maybe not supported
	["group-valid", [".group:valid"]], // NOTE: maybe not supported
	["group-invalid", [".group:invalid"]], // NOTE: maybe not supported
	["group-in-range", [".group:in-range"]], // NOTE: maybe not supported
	["group-out-of-range", [".group:out-of-range"]], // NOTE: maybe not supported
	["group-read-only", [".group:read-only"]], // NOTE: maybe not supported
	["group-empty", [".group:empty"]], // NOTE: maybe not supported

	// Peer variants
	["peer-first", [".peer:first-child ~"]],
	["peer-last", [".peer:last-child ~"]],
	["peer-only", [".peer:only-child ~"]],
	["peer-even", [".peer:nth-child(even) ~"]],
	["peer-odd", [".peer:nth-child(odd) ~"]],
	["peer-first-of-type", [".peer:first-of-type ~"]],
	["peer-last-of-type", [".peer:last-of-type ~"]],
	["peer-only-of-type", [".peer:only-of-type ~"]],
	["peer-hover", [".peer:hover ~"]],
	["peer-focus", [".peer:focus ~"]],
	["peer-disabled", [".peer:disabled ~"]],
	["peer-active", [".peer:active ~"]],
	["peer-target", [".peer:target ~"]],
	["peer-visited", [".peer:visited ~"]],
	["peer-default", [".peer:default ~"]],
	["peer-checked", [".peer:checked ~"]],
	["peer-indeterminate", [".peer:indeterminate ~"]],
	["peer-placeholder-shown", [".peer:placeholder-shown ~"]],
	["peer-autofill", [".peer:autofill ~"]],
	["peer-focus-within", [".peer:focus-within ~"]],
	["peer-focus-visible", [".peer:focus-visible ~"]],
	["peer-required", [".peer:required ~"]],
	["peer-valid", [".peer:valid ~"]],
	["peer-invalid", [".peer:invalid ~"]],
	["peer-in-range", [".peer:in-range ~"]],
	["peer-out-of-range", [".peer:out-of-range ~"]],
	["peer-read-only", [".peer:read-only ~"]],
	["peer-empty", [".peer:empty ~"]],

	// others
	["even-of-type", [":nth-of-type(even)"]],
	["odd-of-type", [":nth-of-type(odd)"]],
	["enabled", [":enabled"]],
	["link", [":link"]],
	["optional", [":optional"]],
	["read-write", [":read-write"]],
	["placeholder", ["::placeholder"]],
	["hocus", [":hover", ":focus"]],
	["only-child", [":only-child"]],
	["not-only-child", [":not(:only-child)"]],
	["group-hocus", [".group:hover", ".group:focus"]],
	["peer-hocus", [".peer:hover ~", ".peer:focus ~"]], // NOTE: maybe not supported
	["peer-only-child", [".peer:only-child ~"]], // NOTE: maybe not supported
]

interface ClassNameMetaItem {
	name: string
	variants: string[]
	pseudo: string[]
	context: string[]
	rest: string
}

interface RuleMetaItem {
	classname: ClassNameMetaItem[]
	decls: Record<string, string[]>
}

export interface RuleItem extends ClassNameMetaItem {
	source: string
	decls: Record<string, string[]>
}

export type ClassNameItem = RuleItem[]
export type VariantItem = string[]
export type ScreenItem = number
export type ColorItem = {
	color?: string
	backgroundColor?: string
	borderColor?: string
}

enum Flag {
	None = 0,
	Responsive = 1 << 0,
	DarkLightMode = 1 << 1,
	MotionControl = 1 << 2,
	CommonVariant = 1 << 3,
}

export const __INNER_TAILWIND_SEPARATOR__ = "_twsp_"

type _KeyValuePair<T = unknown> = [string, T]

interface KeyValuePair<T> extends _KeyValuePair<T> {
	key: string
	value: T
}

interface IMap<T> extends Omit<Array<KeyValuePair<T>>, "keys" | "get"> {
	[Symbol.iterator](): IterableIterator<KeyValuePair<T>>
	keys(): IterableIterator<string>
	get(key: string): T | undefined
}

type Purge = {
	enabled: boolean
	content: string[]
	safelist?: string[]
}

type DarkMode = false | "media" | "class"

export type TailwindConfigJS = {
	separator?: string
	prefix: string
	darkMode?: DarkMode
	purge: Purge
	mode?: "jit" | "aot"
	important?: boolean
	theme: {
		colors: unknown
		opacity: Record<string, unknown>
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function preprocessConfig(config: any, silent?: boolean): any {
	const cfg = { ...config } as TailwindConfigJS
	cfg.separator = cfg.separator ?? ":"
	if (cfg.separator !== ":") {
		if (!silent) console.info("Option: `separator` forced to be set ':'.")
	}
	cfg.separator = __INNER_TAILWIND_SEPARATOR__
	cfg.purge = { enabled: false, content: [] }

	if (cfg?.mode === "jit") {
		if (!silent) console.info("Option: `mode` forced to be set 'aot'.")
		cfg.mode = "aot"
	}

	if (cfg?.important) {
		console.info("Option: `important` forced to be set false.")
		cfg.important = false
	}

	if (cfg?.darkMode !== "media" && cfg?.darkMode !== "class") {
		if (!silent) console.info("Option: `darkMode` forced to be set 'media'.")
		cfg.darkMode = "media"
	}

	if (typeof cfg?.prefix !== "string") {
		cfg.prefix = ""
	}

	return cfg
}
export class Twin {
	static selectorProcessor = parser()
	readonly config: TailwindConfigJS
	readonly separator: string
	readonly prefix: string
	readonly darkMode: string
	readonly isColorShorthandOpacity: (value: string) => [boolean, string]
	readonly isColorArbitraryOpacity: (value: string) => [boolean, string]
	readonly isArbitraryStyle: (value: string) => [boolean, string]
	constructor(options: TailwindConfigJS, ...results: Array<{ result: Result; source?: string }>) {
		this.config = options
		const { separator = ":", prefix = "", darkMode = "media", theme } = options
		this.separator = separator
		this.prefix = prefix || ""
		this.darkMode = darkMode || "media" // always enable dark mode
		const colors = this.getColorNames(theme.colors)
		const opacity = Object.keys(theme.opacity)
		results.forEach(a => this.parseResult(a))
		const regexp_isColorShorthandOpacity = new RegExp(`(.*(?:${colors.join("|")}))\\/(?:${opacity.join("|")})$`)
		const regexp_isColorArbitraryOpacity = new RegExp(`(.*(?:${colors.join("|")}))\\/\\[.*?]$`)
		this.isColorShorthandOpacity = (value: string) => {
			const match = regexp_isColorShorthandOpacity.exec(value)
			if (!match) {
				return [false, ""]
			}
			return [match[1] !== value, match[1]]
		}
		this.isColorArbitraryOpacity = (value: string) => {
			const match = regexp_isColorArbitraryOpacity.exec(value)
			if (!match) {
				return [false, ""]
			}
			return [match[1] !== value, match[1]]
		}
		this.isArbitraryStyle = (value: string) => {
			const match = /(.*?)(?:-|\/)\[.*?\]$/.exec(value)
			if (!match) {
				return [false, ""]
			}
			return [true, match[1]]
		}

		// post processing
		for (let i = 0; i < twinVariants.length; i++) {
			const [key, value] = twinVariants[i]
			this.variantsMap.set(key, value)
		}
		if (this.darkMode === "class") {
			this.classnamesMap.delete(this.prefix + "dark")
			this.variantsMap.set("dark", ["." + "dark"])
			this.variantsMap.set("light", ["." + "light"])
		}
		this.classnamesMap.delete(this.prefix + "group")
		if (this.config.mode !== "jit") {
			this.classnamesMap.set(this.prefix + "content", [
				{
					name: this.prefix + "content",
					source: "utilities",
					variants: [],
					context: [],
					pseudo: [],
					rest: "",
					decls: { content: ['""'] },
				},
			])
		}

		// collection
		this.variants = createMap(this.variantsMap)
		this.classnames = createMap(this.classnamesMap)
		this.customProperties = Array.from(this.customPropertiesSet)

		this.screens = collectScreens(this.variants)
		this.colors = collectColors(this.classnames)

		this.searchers = {
			variants: new Fuse(
				this.variants.map(v => v[0]),
				{ includeScore: true },
			),
			classnames: new Fuse(
				this.classnames.map(v => v[0]),
				{ includeScore: true },
			),
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private getColorNames(colors: any) {
		const names: string[] = []
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		function traversal(c: any, prefix = "") {
			for (const key in c) {
				if (key === "DEFAULT") {
					names.push(prefix.slice(0, -1))
					continue
				}

				if (typeof c[key] === "string" || typeof c[key] === "number" || typeof c[key] === "function") {
					if (prefix) {
						names.push(`${prefix}${key}`)
					} else {
						names.push(key)
					}
				} else if (c[key] instanceof Array) {
					//
				} else if (typeof c[key] === "object") {
					traversal(c[key], key + "-")
				}
			}
		}
		traversal(colors)
		return names
	}

	private getRuleMetaItem(rule: Rule, separator: string): RuleMetaItem {
		const classname: ClassNameMetaItem[] = []
		const { nodes } = Twin.selectorProcessor.astSync(rule.selector)

		// get context, ex: "@media (min-width: 1024px)"
		function getContext(rule: Rule) {
			let p = rule as Node | undefined
			const context: string[] = []
			while (p?.parent?.type !== "root") {
				p = p?.parent
				if (p?.type === "atrule") {
					const at = p as AtRule
					context.push(`@${at.name} ${at.params}`)
				}
			}
			return context
		}

		function newItem(): ClassNameMetaItem {
			return {
				name: "",
				variants: [],
				pseudo: [],
				context: [],
				rest: "",
			}
		}

		const context = getContext(rule)

		function pushClassnameMetaItem(item: ClassNameMetaItem) {
			item.context.push(...context)
			classname.push(item)
		}

		for (let i = 0; i < nodes.length; i++) {
			const selector = nodes[i]
			let temp: ClassNameMetaItem | undefined

			for (let j = 0; j < selector.nodes.length; j++) {
				const node = selector.nodes[j]
				switch (node.type) {
					case "class": {
						if (temp) {
							pushClassnameMetaItem(temp)
							temp = undefined
						}
						temp = newItem()

						const fields = node.value.split(separator)
						if (fields.length === 1) {
							temp.name = fields[0]
						} else if (fields.length > 1) {
							temp.variants = fields.slice(0, -1)
							temp.name = fields[fields.length - 1]
						}

						break
					}
					case "pseudo":
						if (temp) {
							if (temp.rest === "") {
								temp.pseudo.push(node.toString())
							} else {
								temp.rest += node.toString()
							}
						}
						break
					default:
						if (temp) {
							temp.rest += node.toString()
						}
				}
			}

			if (temp) {
				pushClassnameMetaItem(temp)
				temp = undefined
			}
		}

		const decls: Record<string, string[]> = {}
		rule.walkDecls(decl => {
			const cur = decls[decl.prop]
			if (cur instanceof Array) {
				cur.push(decl.value)
			} else {
				decls[decl.prop] = [decl.value]
				if (decl.prop.startsWith("--")) {
					this.customPropertiesSet.add(decl.prop)
				}
			}
		})

		return {
			classname,
			decls,
		}
	}

	private readonly variantsMap: Map<string, string[]> = new Map()
	private readonly classnamesMap: Map<string, ClassNameItem> = new Map()
	private readonly customPropertiesSet: Set<string> = new Set()
	public readonly customProperties: string[] = []
	readonly variants: IMap<VariantItem>
	readonly classnames: IMap<ClassNameItem>
	readonly colors: IMap<ColorItem>
	readonly screens: IMap<ScreenItem>
	readonly searchers!: { variants: Fuse<string>; classnames: Fuse<string> }

	private parseResult({ result, source = "" }: { result: Result; source?: string }) {
		result.root.walkRules(rule => {
			const item = this.getRuleMetaItem(rule, this.separator)
			if (item) {
				const { classname, decls } = item
				for (const c of classname) {
					if (c.variants.length > 0) {
						const [key] = c.variants
						if (!this.variantsMap.has(key)) {
							if (c.context.length > 0) {
								this.variantsMap.set(key, c.context)
							} else if (c.pseudo.length > 0) {
								this.variantsMap.set(key, c.pseudo)
							} else {
								this.variantsMap.set(key, [])
							}
						}
						continue
					}

					let items = this.classnamesMap.get(c.name)
					if (!(items instanceof Array)) {
						this.classnamesMap.set(c.name, [])
					}
					items = this.classnamesMap.get(c.name)!
					items.push({ ...c, source, decls })
				}
			}
		})
	}

	isDarkLightMode(key: string) {
		return key === "dark" || key === "light"
	}

	isResponsive(key: string) {
		return this.screens.get(key) != undefined
	}

	isVariant(key: string) {
		return this.variantsMap.get(key) != undefined
	}

	hasDarkLightMode(keys: string[]) {
		return keys.some(v => this.isDarkLightMode(v))
	}

	hasScreen(keys: string[]) {
		return keys.some(v => this.screens.get(v) != undefined)
	}

	isCommonVariant(key: string) {
		if (this.isResponsive(key)) {
			return false
		}
		if (this.isDarkLightMode(key)) {
			return false
		}
		return this.isVariant(key)
	}

	isClassName(key: string) {
		return this.classnamesMap.has(key)
	}

	isSuggestedClassName(variants: string[], key: string) {
		if (this.getSuggestedClassNameFilter(variants)(key)) {
			return this.isClassName(key)
		}
		return false
	}

	getSuggestedClassNameFilter(variants: string[]): (key: string) => boolean {
		return key => {
			switch (key) {
				case this.prefix + "container":
					return variants.length === 0
			}
			return true
		}
	}

	getSuggestedVariantFilter(variants: string[]): (key: string) => boolean {
		const flags: Flag =
			(this.hasScreen(variants) ? Flag.Responsive : Flag.None) |
			(this.hasDarkLightMode(variants) ? Flag.DarkLightMode : Flag.None) |
			(variants.some(v => this.isCommonVariant(v)) ? Flag.CommonVariant : Flag.None)
		return key => {
			if (variants.some(v => v === key)) {
				return false
			}
			if (flags & Flag.Responsive) {
				if (this.isResponsive(key)) {
					return false
				}
			}
			if (flags & Flag.DarkLightMode) {
				if (this.isDarkLightMode(key)) {
					return false
				}
			}
			return true
		}
	}

	getSampleArbitraryName(prop: string, content: string): string {
		if (this.colors[prop]) {
			return prop
		}

		// *-[color]
		switch (prop) {
			case "bg":
				return "bg-black"
			case "divide":
				return "divide-black"
			case "from":
				return "from-black"
			case "via":
				return "via-black"
			case "to":
				return "to-black"
			case "ring-offset":
				return "ring-offset-black"
			case "placeholder":
				return "placeholder-black"
		}

		// *-[len]
		switch (prop) {
			case "space-x":
				return "space-x-0"
			case "space-y":
				return "space-y-0"
			case "divide-x":
				return "divide-x-0"
			case "divide-y":
				return "divide-y-0"
			case "w":
				return "w-0"
			case "h":
				return "h-0"
			case "leading":
				return "leading-0"
			case "m":
				return "m-0"
			case "mx":
				return "mx-0"
			case "my":
				return "my-0"
			case "mt":
				return "mt-0"
			case "mr":
				return "mr-0"
			case "mb":
				return "mb-0"
			case "ml":
				return "ml-0"
			case "p":
				return "p-0"
			case "px":
				return "px-0"
			case "py":
				return "py-0"
			case "pt":
				return "pt-0"
			case "pr":
				return "pr-0"
			case "pb":
				return "pb-0"
			case "pl":
				return "pl-0"
			case "max-w":
				return "max-w-0"
			case "max-h":
				return "max-h-0"
			case "inset":
				return "inset-0"
			case "inset-x":
				return "inset-x-0"
			case "inset-y":
				return "inset-y-0"
			case "top":
				return "top-0"
			case "right":
				return "right-0"
			case "bottom":
				return "bottom-0"
			case "left":
				return "left-0"
			case "gap":
				return "gap-0"
			case "translate-x":
				return "translate-x-0"
			case "translate-y":
				return "translate-y-0"
			case "blur":
				return "blur-none"
			case "backdrop-blur":
				return "backdrop-blur-none"
		}

		// *-[number]
		switch (prop) {
			case "bg-opacity":
				return "bg-opacity-0"
			case "text-opacity":
				return "text-opacity-0"
			case "divide-opacity":
				return "divide-opacity-0"
			case "border-opacity":
				return "border-opacity-0"
			case "placeholder-opacity":
				return "placeholder-opacity-0"
			case "ring-opacity":
				return "ring-opacity-0"
			case "order":
				return "order-1"
			case "scale":
				return "scale-0"
			case "scale-x":
				return "scale-x-0"
			case "scale-y":
				return "scale-y-0"
			case "opacity":
				return "opacity-0"
			case "brightness":
				return "brightness-0"
			case "contrast":
				return "contrast-0"
			case "grayscale":
				return "grayscale-0"
			case "saturate":
				return "saturate-0"
			case "sepia":
				return "sepia-0"
			case "backdrop-opacity":
				return "backdrop-opacity-0"
			case "backdrop-brightness":
				return "backdrop-brightness-0"
			case "backdrop-contrast":
				return "backdrop-contrast-0"
			case "backdrop-grayscale":
				return "backdrop-grayscale-0"
			case "backdrop-saturate":
				return "backdrop-saturate-0"
			case "backdrop-sepia":
				return "backdrop-sepia-0"
			case "rotate":
				return "rotate-0"
			case "skew":
				return "skew-0"
			case "hue-rotate":
				return "hue-rotate-0"
			case "backdrop-hue-rotate":
				return "backdrop-hue-rotate-0"
			case "duration":
				return "duration-100"
			case "delay":
				return "delay-100"
			case "ease":
				return "ease-in"
			case "grid-cols":
				return "grid-cols-1"
			case "grid-rows":
				return "grid-rows-1"
			case "col-span":
				return "col-span-1"
			case "col-start":
				return "col-start-1"
			case "col-end":
				return "col-end-1"
		}

		content = content.trim()
		let t = ValueType.Any

		if (content.startsWith("length:")) {
			content = content.slice(7)
			t = ValueType.Length
		} else if (content.startsWith("color:")) {
			content = content.slice(6)
			t = ValueType.Color
		} else if (content === "transparent") {
			t = ValueType.Color
		}

		if (t === ValueType.Any) {
			t = getValueType(content)
		}

		if (t === ValueType.Color) {
			switch (prop) {
				case "border":
					return "border-black"
				case "border-t":
					return "border-t-black"
				case "border-r":
					return "border-r-black"
				case "border-b":
					return "border-b-black"
				case "border-l":
					return "border-l-black"
				case "text":
					return "text-black"
				case "ring":
					return "ring-black"
				case "stroke":
					return "stroke-current"
			}
		} else if (t === ValueType.Length) {
			switch (prop) {
				case "border":
					return "border-0"
				case "border-t":
					return "border-t-0"
				case "border-r":
					return "border-r-0"
				case "border-b":
					return "border-b-0"
				case "border-l":
					return "border-l-0"
				case "text":
					return "text-base"
				case "ring":
					return "ring-0"
				case "stroke":
					return "stroke-0"
			}
		}

		return ""
	}

	isArbitraryColor(prop: string, content: string): boolean {
		switch (prop) {
			case "bg":
			case "divide":
			case "from":
			case "via":
			case "to":
			case "ring-offset":
			case "placeholder":
				return true
		}

		switch (prop) {
			case "border":
			case "border-t":
			case "border-r":
			case "border-b":
			case "border-l":
			case "text":
			case "ring":
			case "stroke":
				break
			default:
				return false
		}

		content = content.trim()
		let t = ValueType.Any

		if (content.startsWith("color:")) {
			content = content.slice(6)
			t = ValueType.Color
		}

		if (t === ValueType.Any) {
			t = getValueType(content)
		}

		if (t === ValueType.Color) {
			return true
		}

		return false
	}
}

function createKeyValuePair<T>(record: [string, T]) {
	return new Proxy(record, {
		get: function (target, prop) {
			switch (prop) {
				case "key":
					return record[0]
				case "value":
					return record[1]
				default:
					return Reflect.get(target, prop)
			}
		},
	}) as KeyValuePair<T>
}

function createMap<T>(m: Map<string, T>) {
	return new Proxy(Array.from(m).map(createKeyValuePair), {
		get: function (target, prop) {
			switch (prop) {
				case "keys":
					return function () {
						return m.keys()
					}
				case "get":
					return function (key: string) {
						return m.get(key)
					}
				default:
					return Reflect.get(target, prop)
			}
		},
	}) as unknown as IMap<T>
}

function collectScreens(variants: IMap<VariantItem>) {
	const result: Map<string, number> = new Map()
	variants.forEach(({ key, value }) => {
		for (const val of value) {
			const match = val.match(/@media\s+\(.*width:\s*(\d+)px/)
			if (match != null) {
				const [, px] = match
				result.set(key, Number(px))
				break
			}
		}
	})

	return createMap(result)
}

function collectColors(utilities: IMap<ClassNameItem>) {
	const colors: Map<string, ColorItem> = new Map()
	utilities.forEach(([label, info]) => {
		type D = [property: string, value: string]
		const decls: D[] = info.flatMap(v =>
			Object.keys(v.decls || {}).flatMap(key => v.decls![key].map<D>(v => [key, v])),
		)

		if (decls.length === 0) {
			return
		}

		for (let i = 0; i < decls.length; i++) {
			const prop = decls[i][0]
			const value = decls[i][1]
			if (!prop.includes("color") && !prop.includes("gradient") && prop !== "fill" && prop !== "stroke") {
				continue
			}

			if (!colors.has(label)) {
				colors.set(label, {})
			}

			const isFg = prop === "color"
			const isBg = prop.includes("background")
			const isBd = prop.includes("border") || prop.includes("divide")
			const isOther = !isFg && !isBg && !isBd

			if (label.includes("current")) {
				if (isFg) {
					colors.get(label)!.color = "currentColor"
				}
				if (isBd) {
					colors.get(label)!.borderColor = "currentColor"
				}
				if (isBg || isOther) {
					colors.get(label)!.backgroundColor = "currentColor"
				}
				continue
			}

			if (label.includes("transparent")) {
				if (isFg) {
					colors.get(label)!.color = "transparent"
				}
				if (isBd) {
					colors.get(label)!.borderColor = "transparent"
				}
				if (isBg || isOther) {
					colors.get(label)!.backgroundColor = "transparent"
				}
				continue
			}

			const reg =
				/^[a-z]+$|#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b|rgba?\(\s*(?<r>\d{1,3})\s*,\s*(?<g>\d{1,3})\s*,\s*(?<b>\d{1,3})/
			const m = value.replace(/,\s*var\(\s*[\w-]+\s*\)/g, ", 1").match(reg)
			if (m == null) {
				continue
			}

			let color: chroma.Color | undefined
			try {
				if (m.groups?.r) {
					const { r, g, b } = m.groups
					color = chroma(+r, +g, +b)
				} else {
					color = chroma(m[0])
				}
			} catch {}

			if (!color) continue

			const val = color.hex()

			if (isBd) {
				colors.get(label)!.borderColor = val
			}
			if (isFg) {
				colors.get(label)!.color = val
			}
			if (isBg || isOther) {
				colors.get(label)!.backgroundColor = val
			}
		}
	})

	return createMap(colors)
}
