import { isColorFunction, isColorHexValue, isColorIdentifier, isColorTransparent, parse as parseColors } from "@/color"
import { dlv } from "@/get_set"
import { defaultLogger as console } from "@/logger"
import * as parser from "@/parser"
import { createGetPluginByName } from "@/plugins"
import * as culori from "culori"
import type { AtRule, Rule } from "postcss"
import postcss from "postcss"
import expandApplyAtRules from "tailwindcss/lib/lib/expandApplyAtRules"
import { generateRules } from "tailwindcss/lib/lib/generateRules"
import { createContext } from "tailwindcss/lib/lib/setupContextUtils"
import escapeClassName from "tailwindcss/lib/util/escapeClassName"
import { ColorProps, ColorProps_Background, ColorProps_Border, ColorProps_Foreground } from "./data"

export type ColorDesc = {
	color?: string
	backgroundColor?: string
	borderColor?: string
}

export type TwContext = ReturnType<typeof createTwContext>

export type CssText = string
export type ScssText = string

function isArbitraryRule([context, payload]: Tailwind.CandidateRule) {
	return typeof payload === "function"
}

function guessValue(typ: Tailwind.ValueType) {
	switch (typ) {
		case "number":
			return "1"
		case "percentage":
			return "1%"
		case "position":
			return "top"
		case "length":
			return "1px"
		case "color":
			return "red"
		case "line-width":
			return "thin"
		case "shadow":
			return "2px 0px 5px 6px red"
		case "url":
			return "url()"
		case "image":
			return "image()"
		case "absolute-size":
			return "small"
		case "relative-size":
			return "larger"
		case "generic-name":
			return "serif"
		default:
			return "var()"
	}
}

export function createTwContext(config: Tailwind.ResolvedConfigJS) {
	const context = createContext(config) as Tailwind.Context
	const _getPlugin = createGetPluginByName(config)
	const screens = Object.keys(config.theme.screens).sort(screenSorter)

	if (typeof config.prefix === "function") {
		console.info("function prefix is not supported.")
	}

	if (typeof config.prefix !== "string") {
		config.prefix = ""
	}

	const restVariants = Array.from(context.variantMap.keys()).filter(
		key => screens.indexOf(key) === -1 && key !== "dark" && key !== "light" && key !== "placeholder",
	)

	const colors: Map<string, ColorDesc> = new Map()
	const declsCache: Map<string, ReturnType<typeof renderDecls>> = new Map()
	// sorted variants
	const variants: [string[], string[], string[], string[]] = [
		screens,
		["dark", "light"],
		["placeholder"],
		restVariants,
	]
	const variables = new Set<string>()
	const classnames = context.getClassList()
	// Exclude the '*' classname
	const index = classnames.findIndex(v => v.match(/^\*$/))
	if (index !== -1) classnames.splice(index, 1)
	const classnamesMap = new Set(classnames)

	const arbitrary: Record<string, string[]> = {}
	for (const value of Array.from(context.candidateRuleMap)) {
		const [key, rules] = value
		const prefix = trimPrefix(key + "-")
		if (rules.some(rule => isArbitraryRule(rule))) {
			if (!arbitrary[prefix]) {
				const props = new Set<string>()
				for (const typ of new Set(rules.flatMap(a => a[0].options?.type ?? []))) {
					const { decls } = renderDecls(`${config.prefix}${key}-[${guessValue(typ)}]`)
					for (const key of decls.keys()) {
						props.add(key)
					}
				}
				if (props.size === 0) {
					const { decls } = renderDecls(`${config.prefix}${prefix}[]`)
					for (const key of decls.keys()) {
						props.add(key)
					}
				}
				arbitrary[prefix] = Array.from(props)
			}
		}
	}

	return {
		variants,
		classnames,
		variables,
		context,
		screens,
		isVariant,
		renderVariant,
		renderArbitraryVariant,
		renderClassname,
		renderCssProperty,
		renderDecls,
		escape,
		getPlugin(classname: string) {
			return _getPlugin(classname, trimPrefix)
		},
		getColorDesc,
		getConfig,
		getTheme,
		prefix: config.prefix,
		trimPrefix,
		arbitrary,
	}

	function trimPrefix(classname: string): string {
		if (typeof config.prefix === "function") {
			return classname
		}
		return classname.slice(config.prefix.length)
	}

	function escape(className: string) {
		return escapeClassName(className)
	}

	function renderVariant(variant: string, tabSize = 4): ScssText {
		const meta = context.variantMap.get(variant)
		if (!meta) {
			return ""
		}
		const fakeRoot = postcss.root({
			nodes: [
				postcss.rule({
					selector: ".☕",
				}),
			],
		})

		const rules: Array<AtRule | Rule> = []

		for (const [, fn] of meta) {
			const container = fakeRoot.clone()
			let wrapper: AtRule[] = []
			let selector = ""

			const returnValue = fn({
				container,
				separator: config.separator,
				wrap(node) {
					wrapper.push(node)
				},
				format(selectorFormat) {
					selector = selectorFormat
				},
			})
			if (selector.match(/:merge\((.*?)\)/)) selector = selector.replace(/:merge\((.*?)\)/g, "$1")
			if (!selector && returnValue) selector = returnValue.replace(/:merge\((.*?)\)/g, "$1")
			if (!selector && wrapper.length > 0) {
				selector = `@${wrapper[0].name} ${wrapper[0].params}`
				wrapper = wrapper.slice(1)
			}
			if (!selector) {
				const re = new RegExp(
					("." + escape(variant + config.separator + "☕")).replace(/[/\\^$+?.()|[\]{}]/g, "\\$&"),
					"g",
				)
				container.walk(node => {
					switch (node.type) {
						case "atrule":
							wrapper.push(node)
							return false
						case "rule":
							selector = node.selector.replace(re, "&")
							return false
					}
					return
				})
				if (!selector && wrapper.length > 0) {
					selector = `@${wrapper[0].name} ${wrapper[0].params}`
					wrapper = wrapper.slice(1)
				}
			}
			if (!selector) continue

			const rule: AtRule | Rule = postcss.rule({ selector, nodes: [postcss.comment({ text: "..." })] })
			const raws = rule.raws as { indent: string }
			raws.indent = "".padStart(tabSize)
			const result = wrapper.reduce<AtRule | Rule>((rule, wrapper) => renderWrapper(wrapper, rule), rule)
			rules.push(result)
		}

		return rules.map(r => r.toString()).join("\n")

		function renderWrapper(wrapper: AtRule, rule: AtRule | Rule) {
			const raws = wrapper.raws as { indent: string }
			raws.indent = "".padStart(tabSize)
			wrapper.append(rule)
			return wrapper
		}
	}

	function renderArbitraryVariant(variant: string, separator: string) {
		const classname = variant + separator + "[color:red]"
		const items = generateRules([classname], context).sort(([a], [b]) => {
			if (a < b) {
				return -1
			} else if (a > b) {
				return 1
			} else {
				return 0
			}
		})
		if (items.length <= 0) return []
		const root = postcss.root({ nodes: items.map(([, rule]) => rule) })
		const scopes: string[] = []
		root.walkRules(rule => {
			const scope = rule.selector.replaceAll("." + escape(classname), "&")
			if (scope) scopes.push(scope)
		})
		return scopes.sort()
	}

	function toPixelUnit(cssValue: string, rootFontSize: number) {
		if (rootFontSize <= 0) {
			return cssValue
		}
		const reg = /(-?\d[.\d+e]*)rem/
		const match = reg.exec(cssValue)
		if (!match) {
			return cssValue
		}
		const [text, n] = match
		const val = parseFloat(n)
		if (Number.isNaN(val)) {
			return cssValue
		}

		return cssValue.replace(reg, text + `/** ${(rootFontSize * val).toFixed(0)}px */`)
	}

	function extendColorValue(cssValue: string, colorHint: "hex" | "rgb" | "hsl") {
		let ret = ""
		let start = 0
		for (const c of parseColors(cssValue)) {
			const [a, b] = c.range
			const val = cssValue.slice(a, b)
			let colorVal = ""
			try {
				if (isColorFunction(c)) {
					if (!c.fnName.startsWith(colorHint)) {
						if (c.fnName.startsWith("rgb")) {
							colorVal = getValue({
								mode: "rgb",
								r: +c.args[0] / 255,
								g: +c.args[1] / 255,
								b: +c.args[2] / 255,
								alpha: 1,
							})
						} else if (c.fnName.startsWith("hsl")) {
							colorVal = getValue(culori.parse(`hsl(${c.args.slice(0, 3).join(" ")})`))
						}
					}
				} else if (isColorHexValue(c) && colorHint !== "hex") {
					colorVal = getValue(culori.parse(val))
				} else if (isColorIdentifier(c)) {
					colorVal = getValue(culori.parse(val))
				}
			} catch {}
			ret += cssValue.slice(start, b)
			if (colorVal) ret += `/** ${colorVal} */`
			start = b
		}
		if (start < cssValue.length) {
			ret += cssValue.slice(start)
		}

		return ret

		function getValue(color: culori.Color) {
			switch (colorHint) {
				case "hex":
					return culori.formatHex(color)
				case "rgb":
					return culori.formatRgb(color)
				case "hsl":
					return culori.formatHsl(color)
			}
		}
	}

	function render(classname: string, tabSize = 4) {
		const items = generateRules([classname], context).sort(([a], [b]) => {
			if (a < b) {
				return -1
			} else if (a > b) {
				return 1
			} else {
				return 0
			}
		})

		const root = postcss.root({ nodes: items.map(([, rule]) => rule) })
		const raws = root.raws as { indent: string }
		raws.indent = "".padStart(tabSize)
		expandApplyAtRules(context)(root)

		root.walkAtRules("defaults", rule => {
			rule.remove()
		})
		root.walkRules(rule => {
			rule.raws.semicolon = true
		})

		return root
	}

	function renderClassname({
		classname,
		important = false,
		rootFontSize = 0,
		tabSize = 4,
		colorHint = "none",
		arbitraryProperty = false,
	}: {
		classname: string
		important?: boolean
		rootFontSize?: number
		tabSize?: number
		colorHint?: "none" | "hex" | "rgb" | "hsl"
		arbitraryProperty?: boolean
	}): CssText {
		if (arbitraryProperty) {
			classname = classname.replace(/ /g, "_")
		}
		const root = render(classname, tabSize)
		if (important || rootFontSize) {
			root.walkDecls(decl => {
				decl.value = parser.resolveTheme(config, decl.value)
				decl.important = important
				if (colorHint && colorHint !== "none") decl.value = extendColorValue(decl.value, colorHint)
				decl.value = toPixelUnit(decl.value, rootFontSize)
			})
		}
		if (arbitraryProperty) {
			root.walkRules(rule => {
				rule.selector = "&"
			})
		}
		return root.toString()
	}

	function renderCssProperty({
		prop,
		value,
		important,
		rootFontSize,
		tabSize = 4,
		colorHint = "none",
	}: {
		prop: string
		value: string
		important?: boolean
		rootFontSize?: number
		tabSize?: number
		colorHint?: "none" | "hex" | "rgb" | "hsl"
	}): ScssText {
		const decl = postcss.decl({ prop, value, important })
		if (colorHint && colorHint !== "none") decl.value = extendColorValue(decl.value, colorHint)
		if (rootFontSize) decl.value = toPixelUnit(decl.value, rootFontSize)
		const rule = postcss.rule({ selector: "&", nodes: [decl], raws: { semicolon: true } })
		const raws = rule.raws as { indent: string }
		raws.indent = "".padStart(tabSize)
		return rule.toString()
	}

	function getColorDesc(classname: string): ColorDesc | undefined {
		if (!classnamesMap.has(classname)) {
			return undefined
		}
		const cached = colors.get(classname)
		if (cached) {
			colors.delete(classname)
			colors.set(classname, cached)
			return cached
		}

		function addCache(key: string, value: ColorDesc) {
			if (colors.size >= 16000) {
				const first = colors.keys().next().value
				colors.delete(first)
			}
			colors.set(key, value)
		}

		const decls = getColorDecls(classname)
		if (!decls) return undefined

		const desc = buildDesc(classname, decls)
		addCache(classname, desc)
		return desc

		function buildDesc(classname: string, decls: Map<string, string[]>): ColorDesc {
			const desc: ColorDesc = {}
			for (const [prop, values] of decls) {
				if (!desc.color && ColorProps_Foreground.has(prop)) {
					const val = getColorValue(classname, values)
					if (val) desc.color = val
				}
				if (!desc.borderColor && ColorProps_Border.has(prop)) {
					const val = getColorValue(classname, values)
					if (val) desc.borderColor = val
				}
				if (!desc.backgroundColor && ColorProps_Background.has(prop)) {
					const val = getColorValue(classname, values)
					if (val) desc.backgroundColor = val
				}
			}
			return desc
		}

		function getColorValue(classname: string, values: string[]) {
			if (classname.endsWith("-current")) return "currentColor"
			else if (classname.endsWith("-inherit")) return "inherit"
			else if (classname.endsWith("-transparent")) return "transparent"

			for (const value of values) {
				const colors = parseColors(value)
				if (colors.length <= 0) {
					continue
				}

				const firstColor = colors[0]

				let color = ""

				if (isColorTransparent(firstColor)) {
					return "transparent"
				} else if (isColorIdentifier(firstColor) || isColorHexValue(firstColor)) {
					try {
						color = culori.formatHex(value.slice(firstColor.range[0], firstColor.range[1]))
					} catch {}
				} else {
					try {
						if (firstColor.fnName.startsWith("rgb")) {
							color = culori.formatHex(`rgb(${firstColor.args.slice(0, 3).join(" ")})`)
						} else {
							color = culori.formatHex(`hsl(${firstColor.args.slice(0, 3).join(" ")})`)
						}
					} catch {}
				}

				if (!color) continue

				return color
			}

			return ""
		}
	}

	function getColorDecls(classname: string): Map<string, string[]> | undefined {
		const { decls, rules } = renderDecls(classname)
		if (rules > 1) return undefined
		for (const [prop] of decls) {
			if (ColorProps.has(prop)) {
				return decls
			}
		}
		return undefined
	}

	function screenSorter(a: string, b: string) {
		function getWidth(value: string) {
			const match = value.match(/@media\s+\(.*width:\s*(\d+)px/)
			if (match != null) {
				const [, px] = match
				return Number(px)
			}
			return 0
		}
		return getWidth(renderVariant(a)) - getWidth(renderVariant(b))
	}

	function renderDecls(classname: string): {
		decls: Map<string, string[]>
		scopes: string[]
		rules: number
	} {
		const cached = declsCache.get(classname)
		if (cached) {
			declsCache.delete(classname)
			declsCache.set(classname, cached)
			return cached
		}

		const root = render(classname)
		const decls: Map<string, string[]> = new Map()

		root.walkDecls(({ prop, value, variable, important }) => {
			const values = decls.get(prop)
			if (values) {
				values.push(value)
			} else {
				decls.set(prop, [value])
			}
			if (variable) {
				variables.add(prop)
			}
		})

		// NOTE: handle special selector like: `.divide-red-500 > :not([hidden]) ~ :not([hidden])`
		// kind: animate, space, divide, placeholder
		const scopes: string[] = []
		let rules = 0
		root.walkRules(rule => {
			rules++
			const scope = rule.selector.replaceAll("." + escape(classname), "")
			if (scope) scopes.push(scope)
		})

		const ret = { decls, scopes, rules }
		addCache(classname, ret)
		return ret

		function addCache(key: string, value: ReturnType<typeof renderDecls>) {
			if (declsCache.size >= 16000) {
				const first = colors.keys().next().value
				declsCache.delete(first)
			}
			declsCache.set(key, value)
		}
	}

	function isVariant(value: string) {
		return context.variantMap.has(value)
	}

	/**
	 * get theme value.
	 *
	 * example: ```getTheme(["colors", "blue", "500"])```
	 * @param keys
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function getTheme(keys: string[], useDefault = false): any {
		if (!config) {
			return undefined
		}
		let value = dlv(config.theme, keys)
		if (useDefault && value?.["DEFAULT"] != undefined) {
			value = value["DEFAULT"]
		}
		return value
	}

	function getConfig(keys: string[]) {
		if (!config) {
			return undefined
		}
		return dlv(config, keys)
	}
}
