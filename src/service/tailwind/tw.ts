import * as culori from "culori"
import type { AtRule, Rule } from "postcss"
import postcss from "postcss"
import expandApplyAtRules from "tailwindcss/lib/lib/expandApplyAtRules"
import { generateRules } from "tailwindcss/lib/lib/generateRules"
import { createContext } from "tailwindcss/lib/lib/setupContextUtils"
import escapeClassName from "tailwindcss/lib/util/escapeClassName"
import { escapeRegexp } from "~/common"
import {
	isColorFunction,
	isColorHexValue,
	isColorIdentifier,
	isColorTransparent,
	isColorUnknown,
	parse as parseColors,
} from "~/common/color"
import { defaultLogger as console } from "~/common/logger"
import * as parser from "~/common/parser"
import { createGetPluginByName } from "~/common/plugins"
import { ColorProps, ColorProps_Background, ColorProps_Border, ColorProps_Foreground } from "./data"

export type ColorDesc = {
	canRender?: boolean
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
		renderSimpleVariant,
		renderArbitraryVariant,
		renderArbitraryVariantScopes,
		renderClassname,
		renderDecls,
		escape,
		getPlugin(classname: string) {
			return _getPlugin(classname, trimPrefix)
		},
		getColorDesc,
		prefix: config.prefix,
		trimPrefix,
		arbitrary,
	} as const

	function trimPrefix(classname: string): string {
		if (typeof config.prefix === "function") {
			return classname
		}
		return classname.slice(config.prefix.length)
	}

	function escape(className: string) {
		return escapeClassName(className)
	}

	function comment(tabSize: number, node: Rule) {
		const raws = node.raws as { indent: string }
		raws.indent = "".padStart(tabSize)
		node.nodes = []
		node.append(postcss.comment({ text: "..." }))
	}

	function replaceSelectorAndComment(tabSize: number, node: AtRule | Rule, replace: (str: string) => string): void {
		if (node.type === "rule") {
			node.selector = replace(node.selector)
			comment(tabSize, node)
			return
		}
		node.each(node => {
			switch (node.type) {
				case "atrule":
					replaceSelectorAndComment(tabSize, node, replace)
					break
				case "rule":
					replaceSelectorAndComment(tabSize, node, replace)
					break
			}
		})
	}

	function renderSimpleVariant(variant: string, tabSize = 4): ScssText {
		const meta = context.variantMap.get(variant)
		if (!meta) {
			return ""
		}

		const re = new RegExp(
			("." + escape(variant + config.separator) + "☕").replace(/[/\\^$+?.()|[\]{}]/g, "\\$&"),
			"g",
		)
		const replace = (str: string) => str.replace(re, "&")
		const container = postcss.root().append(postcss.rule({ selector: ".☕" }))
		const rules: Array<AtRule | Rule> = []

		for (const [, fn] of meta) {
			let node: AtRule | Rule | undefined
			fn({
				container,
				separator: config.separator,
				wrap(atrule) {
					if (!node) node = postcss.rule({ selector: "&" })
					const at = atrule.clone()
					at.append(node)
					node = at
				},
				format(selector) {
					if (selector.match(/:merge\((.*?)\)/)) selector = selector.replace(/:merge\((.*?)\)/g, "$1")
					node = postcss.rule({ selector })
				},
			})
			if (node) {
				replaceSelectorAndComment(tabSize, node, replace)
				rules.push(node)
			}
		}

		if (rules.length === 0) {
			container.each(node => {
				switch (node.type) {
					case "atrule":
					case "rule":
						replaceSelectorAndComment(tabSize, node, replace)
						rules.push(node)
						break
				}
			})
		}

		return rules.map(r => r.toString()).join("\n")
	}

	function renderArbitraryVariant(variant: string, separator: string, tabSize: number): ScssText {
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
		if (items.length <= 0) return ""
		const root = postcss.root({ nodes: items.map(([, rule]) => rule) })
		const rules: Array<AtRule | Rule> = []
		const replace = (str: string) => {
			return str.replace(new RegExp(`[.]${escapeRegexp(escape(classname))}(?=[^\\w-]|$)`, "g"), "&")
		}

		root.each(node => {
			switch (node.type) {
				case "atrule":
				case "rule":
					replaceSelectorAndComment(tabSize, node, replace)
					rules.push(node)
					break
			}
		})

		return rules.map(r => r.toString()).join("\n")
	}

	function getScope(node: AtRule | Rule, replace: (str: string) => string): string {
		if (node.type === "rule") {
			return replace(node.selector)
		}
		let n = node
		let s = ""
		while (n.type === "atrule") {
			s += `@${node.name} ${node.params},`
			const next = n.nodes[0]
			if (next?.type !== "atrule") {
				break
			}
			n = next
		}
		const next = n.nodes[0]
		if (next?.type === "rule") {
			return s + replace(next.selector)
		}
		return s.slice(-1)
	}

	function renderArbitraryVariantScopes(variant: string, separator: string): string {
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
		if (items.length <= 0) return ""
		const root = postcss.root({ nodes: items.map(([, rule]) => rule) })
		const replace = (str: string) => {
			return str.replace(new RegExp(`[.]${escapeRegexp(escape(classname))}(?=[^\\w-]|$)`, "g"), "&")
		}
		const scopes: string[] = []
		root.each(node => {
			switch (node.type) {
				case "atrule":
				case "rule": {
					const scope = getScope(node, replace)
					if (scope) scopes.push(scope)
					break
				}
			}
		})
		return scopes.join(",")
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
			let colorVal: string | undefined
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
			ret += cssValue.slice(start, b)
			if (colorVal) ret += `/** ${colorVal} */`
			start = b
		}
		if (start < cssValue.length) {
			ret += cssValue.slice(start)
		}

		return ret

		function getValue(color: culori.Color | undefined) {
			if (!color) return undefined
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
	}: {
		classname: string
		important?: boolean
		rootFontSize?: number
		tabSize?: number
		colorHint?: "none" | "hex" | "rgb" | "hsl"
	}): ScssText {
		const root = render(classname, tabSize)
		if (important || rootFontSize) {
			root.walkDecls(decl => {
				decl.value = parser.resolveThemeFunc(config, decl.value)
				decl.important = important
				if (colorHint && colorHint !== "none") decl.value = extendColorValue(decl.value, colorHint)
				decl.value = toPixelUnit(decl.value, rootFontSize)
			})
		}
		const replace = (str: string) => {
			return str.replace(new RegExp(`[.]${escapeRegexp(escape(classname))}(?=[^\\w-]|$)`, "g"), "&")
		}
		root.walkRules(rule => {
			rule.selector = replace(rule.selector)
		})
		return root.toString()
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

		const desc = buildColorDesc(classname, decls)
		addCache(classname, desc)
		return desc

		function buildColorDesc(classname: string, decls: Map<string, string[]>): ColorDesc {
			const colorDecls = Array.from(decls).filter(([prop]) => {
				return ColorProps_Foreground.has(prop) || ColorProps_Border.has(prop) || ColorProps_Background.has(prop)
			})
			const desc: ColorDesc = {}
			for (const [prop, values] of colorDecls) {
				if (!desc.color && ColorProps_Foreground.has(prop)) {
					const { canRender, value } = getColorValue(classname, values)
					if (value) {
						desc.color = value
						desc.canRender = canRender
					}
				}
				if (!desc.borderColor && ColorProps_Border.has(prop)) {
					const { canRender, value } = getColorValue(classname, values)
					if (value) {
						desc.borderColor = value
						desc.canRender = canRender
					}
				}
				if (!desc.backgroundColor && ColorProps_Background.has(prop)) {
					const { canRender, value } = getColorValue(classname, values)
					if (value) {
						desc.backgroundColor = value
						desc.canRender = canRender
					}
				}
			}
			return desc
		}

		function getColorValue(classname: string, values: string[]): { canRender: boolean; value: string } {
			if (classname.endsWith("-current")) return { canRender: false, value: "currentColor" }
			else if (classname.endsWith("-inherit")) return { canRender: false, value: "inherit" }
			else if (classname.endsWith("-auto")) return { canRender: false, value: "auto" }
			else if (classname.endsWith("-transparent")) return { canRender: true, value: "transparent" }

			for (const value of values) {
				const colors = parseColors(value)
				if (colors.length <= 0) {
					continue
				}

				const firstColor = colors[0]

				let color = ""
				if (isColorUnknown(firstColor)) {
					return { canRender: false, value }
				} else if (isColorTransparent(firstColor)) {
					return { canRender: true, value: "transparent" }
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

				if (!color) {
					return { canRender: false, value }
				}

				return { canRender: true, value: color }
			}

			return { canRender: false, value: "" }
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
		return getWidth(renderSimpleVariant(a)) - getWidth(renderSimpleVariant(b))
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

		const replace = (str: string) => {
			return str.replace(new RegExp(`[.]${escapeRegexp(escape(classname))}(?=[^\\w-]|$)`, "g"), "&")
		}
		const scopes: string[] = []
		root.each(node => {
			switch (node.type) {
				case "atrule":
				case "rule": {
					const scope = getScope(node, replace)
					if (scope) scopes.push(scope)
					break
				}
			}
		})

		let rules = 0
		root.walkRules(_ => {
			rules++
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
}
