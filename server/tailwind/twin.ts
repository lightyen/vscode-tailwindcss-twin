/* eslint-disable @typescript-eslint/no-non-null-assertion */
import chroma from "chroma-js"
import Fuse from "fuse.js"
import type { AtRule, Node, Result, Rule } from "postcss"
import parser from "postcss-selector-parser"
import { createGetPluginByName } from "~/common/corePlugins"

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

	// direction
	["ltr", ["[dir='ltr']"]],
	["rtl", ["[dir='rtl']"]],

	// selector
	["all", ["*"]],
	["svg", ["svg"]],
	["sibling", ["~ *"]],
	["all-child", ["> *"]],

	// not
	["not-first", [":not(:first-child)"]],
	["not-last", [":not(:last-child)"]],
	["not-only", [":not(:only-child)"]],
	["not-first-of-type", [":not(:first-of-type)"]],
	["not-last-of-type", [":not(:last-of-type)"]],
	["not-only-of-type", [":not(:only-of-type)"]],
	["not-checked", [":not(:checked)"]],
	["not-disabled", [":not(:disabled)"]],

	// Basic pseudo variants
	["first", [":first-child"]],
	["last", [":last-child"]],
	["only", [":only-child"]],
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
	["group-first", [".group:first-child"]],
	["group-last", [".group:last-child"]],
	["group-only", [".group:only-child"]],
	["group-even", [".group:nth-child(even)"]],
	["group-odd", [".group:nth-child(odd)"]],
	["group-first-of-type", [".group:first-of-type"]],
	["group-last-of-type", [".group:last-of-type"]],
	["group-only-of-type", [".group:only-of-type"]],
	["group-hover", [".group:hover"]],
	["group-focus", [".group:focus"]],
	["group-disabled", [".group:disabled"]],
	["group-active", [".group:active"]],
	["group-target", [".group:target"]],
	["group-visited", [".group:visited"]],
	["group-default", [".group:default"]],
	["group-checked", [".group:checked"]],
	["group-indeterminate", [".group:indeterminate"]],
	["group-placeholder-shown", [".group:placeholder-shown"]],
	["group-autofill", [".group:autofill"]],
	["group-focus-within", [".group:focus-within"]],
	["group-focus-visible", [".group:focus-visible"]],
	["group-required", [".group:required"]],
	["group-valid", [".group:valid"]],
	["group-invalid", [".group:invalid"]],
	["group-in-range", [".group:in-range"]],
	["group-out-of-range", [".group:out-of-range"]],
	["group-read-only", [".group:read-only"]],
	["group-empty", [".group:empty"]],

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
	["group-hocus", [".group:hover", ".group:focus"]],
	["peer-hocus", [".peer:hover ~", ".peer:focus ~"]], // NOTE: maybe not supported
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

export interface IMap<T> extends Omit<Array<KeyValuePair<T>>, "keys" | "get"> {
	[Symbol.iterator](): IterableIterator<KeyValuePair<T>>
	keys(): IterableIterator<string>
	get(key: string): T | undefined
}

const selectorProcessor = parser()

export type Twin = ReturnType<typeof createTwin>

export function createTwin(config: Tailwind.ResolvedConfigJS, ...results: Array<{ result: Result; source?: string }>) {
	const { theme } = config
	const separator = config.separator || ":"
	const prefix = config.prefix || ""
	const darkMode = config.darkMode || "media"

	const themeColors = getColorNames(theme.colors)
	const opacity = Object.keys(theme.opacity)

	const escapeRegexp = (value: string) => value.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")
	const regexp_isColorShorthandOpacity = new RegExp(
		`^(${escapeRegexp(prefix)}.*(?:${themeColors.join("|")}))\\/(?:${opacity.join("|")})$`,
	)
	const regexp_isColorArbitraryOpacity = new RegExp(`^(${escapeRegexp(prefix)}.*(?:${themeColors.join("|")}))\\/\\[`)

	const variantsMap: Map<string, string[]> = new Map()
	const classnamesMap: Map<string, ClassNameItem> = new Map()
	const customPropertiesSet: Set<string> = new Set()

	results.forEach(a => parseResult(a))

	// post processing
	for (let i = 0; i < twinVariants.length; i++) {
		const [key, value] = twinVariants[i]
		variantsMap.set(key, value)
	}
	if (darkMode === "class") {
		classnamesMap.delete(prefix + "dark")
		variantsMap.set("dark", ["." + "dark"])
		variantsMap.set("light", ["." + "light"])
	}
	classnamesMap.delete(prefix + "group")

	// collection
	const variants = createMap(variantsMap)
	const classnames = createMap(classnamesMap)
	const customProperties = Array.from(customPropertiesSet)

	const colors = collectColors(classnames)
	const screens = collectScreens(variants)

	const searchers = {
		variants: new Fuse(
			variants.map(v => v[0]),
			{ includeScore: true },
		),
		classnames: new Fuse(
			classnames.map(v => v[0]),
			{ includeScore: true },
		),
	}

	const getPluginByName = createGetPluginByName(config)

	return {
		get colors() {
			return colors
		},
		get screens() {
			return screens
		},
		get variants() {
			return variants
		},
		get classnames() {
			return classnames
		},
		get customProperties() {
			return customProperties
		},
		get searchers() {
			return searchers
		},
		getPluginByName,
		isColorShorthandOpacity,
		isColorArbitraryOpacity,
		isDarkLightMode,
		isResponsive,
		isVariant,
		hasDarkLightMode,
		hasScreen,
		isCommonVariant,
		isClassName,
		isSuggestedClassName,
		getSuggestedClassNameFilter,
		getSuggestedVariantFilter,
		isArbitraryColor,
	}

	function isColorShorthandOpacity(value: string): [boolean, string] {
		const match = regexp_isColorShorthandOpacity.exec(value)
		if (!match) {
			return [false, ""]
		}
		return [match[1] !== value, match[1]]
	}

	function isColorArbitraryOpacity(value: string): [boolean, string] {
		const match = regexp_isColorArbitraryOpacity.exec(value)
		if (!match) {
			return [false, ""]
		}
		return [match[1] !== value, match[1]]
	}

	function getColorNames(colors: Tailwind.ResolvedConfigJS["theme"]["colors"]) {
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

	function getRuleMetaItem(rule: Rule, separator: string): RuleMetaItem {
		const classname: ClassNameMetaItem[] = []
		const { nodes } = selectorProcessor.astSync(rule.selector)

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
					customPropertiesSet.add(decl.prop)
				}
			}
		})

		return {
			classname,
			decls,
		}
	}

	function parseResult({ result, source = "" }: { result: Result; source?: string }) {
		result.root.walkRules(rule => {
			const item = getRuleMetaItem(rule, separator)
			if (item) {
				const { classname, decls } = item
				for (const c of classname) {
					if (c.variants.length > 0) {
						const [key] = c.variants
						if (!variantsMap.has(key)) {
							if (c.context.length > 0) {
								variantsMap.set(key, c.context)
							} else if (c.pseudo.length > 0) {
								variantsMap.set(key, c.pseudo)
							} else {
								variantsMap.set(key, [])
							}
						}
						continue
					}

					let items = classnamesMap.get(c.name)
					if (!(items instanceof Array)) {
						classnamesMap.set(c.name, [])
					}
					items = classnamesMap.get(c.name)!
					items.push({ ...c, source, decls })
				}
			}
		})
	}

	function isDarkLightMode(key: string) {
		return key === "dark" || key === "light"
	}

	function isResponsive(key: string) {
		return screens.get(key) != undefined
	}

	function isVariant(key: string) {
		return variantsMap.get(key) != undefined
	}

	function hasDarkLightMode(keys: string[]) {
		return keys.some(v => isDarkLightMode(v))
	}

	function hasScreen(keys: string[]) {
		return keys.some(v => screens.get(v) != undefined)
	}

	function isCommonVariant(key: string) {
		if (isResponsive(key)) {
			return false
		}
		if (isDarkLightMode(key)) {
			return false
		}
		return isVariant(key)
	}

	function isClassName(key: string) {
		return classnamesMap.has(key)
	}

	function isSuggestedClassName(variants: string[], key: string) {
		if (getSuggestedClassNameFilter(variants)(key)) {
			return isClassName(key)
		}
		return false
	}

	function getSuggestedClassNameFilter(variants: string[]): (key: string) => boolean {
		return key => {
			switch (key) {
				case prefix + "container":
					return variants.length === 0
			}
			return true
		}
	}

	function getSuggestedVariantFilter(variants: string[]): (key: string) => boolean {
		const flags: Flag =
			(hasScreen(variants) ? Flag.Responsive : Flag.None) |
			(hasDarkLightMode(variants) ? Flag.DarkLightMode : Flag.None) |
			(variants.some(v => isCommonVariant(v)) ? Flag.CommonVariant : Flag.None)
		return key => {
			if (variants.some(v => v === key)) {
				return false
			}
			if (flags & Flag.Responsive) {
				if (isResponsive(key)) {
					return false
				}
			}
			if (flags & Flag.DarkLightMode) {
				if (isDarkLightMode(key)) {
					return false
				}
			}
			return true
		}
	}

	function isArbitraryColor(classname: string): boolean {
		if (classname.startsWith(prefix)) {
			classname = classname.slice(prefix.length)
		}

		const plugin = getPluginByName(classname)

		if (!plugin) {
			return false
		}

		return /Color$/i.test(plugin.name)
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
	let array: Array<[string, number]> = []
	variants.forEach(({ key, value }) => {
		for (const val of value) {
			const match = val.match(/@media\s+\(.*width:\s*(\d+)px/)
			if (match != null) {
				const [, px] = match
				array.push([key, Number(px)])
				break
			}
		}
	})
	array = array.sort(([, a], [, b]) => {
		return a - b
	})
	for (let i = 0; i < array.length; i++) {
		result.set(array[i][0], i)
	}
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
