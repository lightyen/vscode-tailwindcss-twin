import { isColorFunction, isColorHexValue, isColorIdentifier, isColorTransparent, parse as parseColors } from "@/color"
import { createGetPluginByName } from "@/corePlugins"
import { dlv } from "@/get_set"
import { defaultLogger as console } from "@/logger"
import { importFrom } from "@/module"
import chroma from "chroma-js"
import type { AtRule, Postcss, Result, Rule } from "postcss"
import type { Attribute, Processor } from "postcss-selector-parser"
import { URI } from "vscode-uri"

const ColorProps_Foreground = new Set<string>(["color"])
const ColorProps_Border = new Set<string>([])
const ColorProps_Background = new Set<string>([
	"outline-color",
	"border-color",
	"border-top-color",
	"border-right-color",
	"border-bottom-color",
	"border-left-color",
	"background-color",
	"text-decoration-color",
	"accent-color",
	"caret-color",
	"fill",
	"stroke",
	"stop-color",
	"column-rule-color",
	"--tw-ring-color",
	"--tw-ring-offset-color",
	"--tw-gradient-from",
	"--tw-gradient-to",
	"--tw-gradient-stops",
	"--tw-shadow-color",
])

const ColorProps = new Set([...ColorProps_Foreground, ...ColorProps_Border, ...ColorProps_Background])

export type ColorDesc = {
	color?: string
	backgroundColor?: string
	borderColor?: string
}

type Awaited<T> = T extends PromiseLike<infer U> ? U : T
export type TwContext = Awaited<ReturnType<typeof createTwContext>>

export async function createTwContext(config: Tailwind.ResolvedConfigJS, extensionUri: URI) {
	const parser = importFrom("postcss-selector-parser", {
		base: extensionUri.fsPath,
	})
	const postcss: Postcss = importFrom("postcss", {
		base: extensionUri.fsPath,
	})
	const tailwindcss: Tailwind.tailwindcss = importFrom("tailwindcss", {
		base: extensionUri.fsPath,
	})
	const createContext: Tailwind.createContext = importFrom("tailwindcss/lib/jit/lib/setupContextUtils", {
		base: extensionUri.fsPath,
	}).createContext
	const generateRules: Tailwind.generateRules = importFrom("tailwindcss/lib/jit/lib/generateRules", {
		base: extensionUri.fsPath,
	}).generateRules
	const expandApplyAtRules: Tailwind.expandApplyAtRules = importFrom("tailwindcss/lib/jit/lib/expandApplyAtRules", {
		base: extensionUri.fsPath,
	})
	const variables = new Set<string>()
	const classnames = new Set<string>()
	const _colors = new Map<string, Map<string, string[]>>()
	const colors = new Map<string, ColorDesc>()
	const declsCache: Map<string, ReturnType<typeof renderDecls>> = new Map()
	const __config = { ...config }
	const re = new RegExp(`^([\\w-]+${__config.separator})+`, "g")

	if (typeof __config.prefix === "function") {
		console.info("function prefix is not supported.")
	}

	if (typeof __config.prefix === "function") {
		const getPrefix = __config.prefix
		__config.prefix = function (classname: string) {
			const prefix = getPrefix(classname)
			fn(prefix, classname)
			return prefix
			function fn(prefix: string, classname: string) {
				//
			}
		}
	} else if (typeof __config.prefix !== "string") {
		__config.prefix = ""
	}

	__config.mode = "aot"
	const selectorProcessor: Processor = parser()
	let result = await postcss([tailwindcss(__config)]).process("@base;@tailwind components;@tailwind utilities;", {
		from: undefined,
	})
	process(result)

	__config.mode = "jit"
	const extended = ["transform-cpu"].concat(
		Array.from(["border-t", "border-b", "border-l", "border-r"])
			.map(b => getColorNames(config).map(c => `${config.prefix}${b}-${c}`))
			.flat(),
	)
	__config.purge = { content: [], safelist: extended }
	result = await postcss([tailwindcss(__config)]).process("@base;@tailwind components;@tailwind utilities;", {
		from: undefined,
	})
	process(result)

	__config.mode = "jit"
	const context = createContext(__config)
	const _getPlugin = createGetPluginByName(__config)

	const screens = Object.keys(__config.theme.screens).sort(screenSorter)
	const restVariants = Array.from(context.variantMap.keys()).filter(
		key => screens.indexOf(key) === -1 && key !== "dark" && key !== "light" && key !== "placeholder",
	)

	const variants: [string[], string[], string[], string[]] = [
		screens,
		["dark", "light"],
		["placeholder"],
		restVariants,
	]

	return {
		variants,
		classnames,
		variables,
		context,
		screens,
		colors,
		isVariant,
		renderVariant,
		renderClassname,
		renderCssProperty,
		renderDecls,
		escape,
		getPlugin(classname: string) {
			return _getPlugin(classname, trimPrefix)
		},
		getColorDesc,
		getTheme,
		getConfig,
		trimPrefix,
	}

	function trimPrefix(classname: string): string {
		if (typeof __config.prefix === "function") {
			return classname
		}
		return classname.slice(__config.prefix.length)
	}

	function process(result: Result) {
		result.root.walkRules(rule => {
			const { nodes } = selectorProcessor.astSync(rule)
			for (let i = 0; i < nodes.length; i++) {
				for (let j = 0; j < nodes[i].nodes.length; j++) {
					const node = nodes[i].nodes[j]
					if (node.type === "class") {
						const classname = node.value.replace(re, "")
						classnames.add(classname)
						if (!colors.has(classname)) {
							const decls = _getDecls(rule)
							if (isColorDecls(decls)) {
								_colors.set(classname, decls)
								const desc = getColorDesc(classname)
								if (desc) colors.set(classname, desc)
							}
						}
					}
				}
			}
		})
	}

	function getColorNames(resloved: Tailwind.ResolvedConfigJS): string[] {
		const colors = resloved.theme.colors
		const names: string[] = []
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		function pr(c: any, prefix = "") {
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
					pr(c[key], key + "-")
				}
			}
		}
		pr(colors)
		return names
	}

	function _getDecls(rule: Rule) {
		const decls = new Map<string, string[]>()
		rule.walkDecls(({ prop, value, variable, important }) => {
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
		return decls
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

	function getDecls(classname: string) {
		const root = render(classname)
		const decls = new Map<string, string[]>()
		root.walkDecls(({ prop, value, variable, important }) => {
			const values = decls.get(prop)
			if (values) {
				values.push(value)
			} else {
				decls.set(prop, [value])
			}
		})

		return decls
	}

	function isColorDecls(decls: Map<string, string[]>) {
		for (const [prop] of decls) {
			if (ColorProps.has(prop)) {
				return true
			}
		}
		return false
	}

	function getColorDecls(classname: string) {
		const decls = _colors.get(classname)
		if (decls) return decls
		return getDecls(classname)
	}

	function getColorDesc(classname: string) {
		if (!classnames.has(classname)) {
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
				colors.set(key, value)
			}
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

				let color: chroma.Color | undefined

				if (isColorTransparent(firstColor)) {
					return "transparent"
				} else if (isColorIdentifier(firstColor) || isColorHexValue(firstColor)) {
					try {
						color = chroma(value.slice(firstColor.range[0], firstColor.range[1])).alpha(1.0)
					} catch {}
				} else {
					try {
						if (firstColor.fnName.startsWith("rgb")) {
							color = chroma(+firstColor.args[0], +firstColor.args[1], +firstColor.args[2])
						} else {
							color = chroma(`hsl(${firstColor.args.slice(0, 3).join()})`)
						}
					} catch {}
				}

				if (!color) continue

				return color.hex()
			}

			return ""
		}
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

	function escape(classname: string): string {
		const node = parser.attribute() as Attribute
		node.value = classname
		return node.raws.value || node.value
	}

	function renderVariant(variant: string, tabSize = 4) {
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
		const re = new RegExp(
			("." + escape(variant + __config.separator + "☕")).replace(/[/\\^$+?.()|[\]{}]/g, "\\$&"),
			"g",
		)
		for (const [, fn] of meta) {
			if (typeof fn !== "function") continue
			const container = fakeRoot.clone()
			let wrapper: AtRule[] = []
			let selector: string | undefined

			fn({
				container,
				separator: __config.separator,
			})
			container.walkDecls(decl => {
				decl.remove()
			})
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

			const rule: AtRule | Rule = postcss.rule({ selector, nodes: [postcss.comment({ text: "..." })] })
			const raws = rule.raws as { indent: string }
			raws.indent = "".padStart(tabSize)
			rules.push(wrapper.reduce<AtRule | Rule>((rule, wrapper) => renderWrapper(wrapper, rule), rule))
		}

		return rules.map(r => r.toString()).join("\n")

		function renderWrapper(wrapper: AtRule, rule: AtRule | Rule) {
			const raws = wrapper.raws as { indent: string }
			raws.indent = "".padStart(tabSize)
			wrapper.append(rule)
			return wrapper
		}
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
						if (c.fnName === "rgb") {
							colorVal = getValue(chroma(c.args.slice(0, 3).map(Number)))
						} else if (c.fnName === "rgba") {
							const args = c.args.map(Number)
							if (args[3] >= 0 && args[3] <= 1) colorVal = getValue(chroma(args))
							else colorVal = getValue(chroma(args.slice(0, 3)))
						} else if (c.fnName === "hsl") {
							colorVal = getValue(chroma(`hsl(${c.args.slice(0, 3).join()})`))
						} else if (c.fnName === "hsla") {
							if (c.args.length > 3 && !Number.isNaN(Number(c.args[3][0]))) {
								colorVal = getValue(chroma(`hsla(${c.args.join()})`))
							} else {
								colorVal = getValue(chroma(`hsl(${c.args.slice(0, 3).join()})`))
							}
						}
					}
				} else if (isColorHexValue(c) && colorHint !== "hex") {
					colorVal = getValue(chroma(val))
				} else if (isColorIdentifier(c)) {
					colorVal = getValue(chroma(val))
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

		function getValue(color: chroma.Color) {
			switch (colorHint) {
				case "hex":
					return color.hex()
				case "rgb": {
					const r = color.get("rgb.r")
					const g = color.get("rgb.g")
					const b = color.get("rgb.b")
					return color.alpha() < 1 ? `rgba(${r} ${g} ${b} / ${color.alpha()})` : `rgb(${r} ${g} ${b})`
				}
				case "hsl": {
					const h = Math.round(color.get("hsl.h"))
					const s = Math.round(color.get("hsl.s") * 100)
					const l = Math.round(color.get("hsl.l") * 100)
					return color.alpha() < 1 ? `hsla(${h} ${s}% ${l}% / ${color.alpha()})` : `hsl(${h} ${s}% ${l}%)`
				}
			}
		}
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
	}) {
		const root = render(classname, tabSize)
		if (important || rootFontSize) {
			root.walkDecls(decl => {
				decl.important = important
				if (colorHint && colorHint !== "none") decl.value = extendColorValue(decl.value, colorHint)
				decl.value = toPixelUnit(decl.value, rootFontSize)
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
	}) {
		const decl = postcss.decl({ prop, value, important })
		if (colorHint && colorHint !== "none") decl.value = extendColorValue(decl.value, colorHint)
		if (rootFontSize) decl.value = toPixelUnit(decl.value, rootFontSize)
		const rule = postcss.rule({ selector: "&", nodes: [decl], raws: { semicolon: true } })
		const raws = rule.raws as { indent: string }
		raws.indent = "".padStart(tabSize)
		return rule.toString()
	}

	function renderDecls(classname: string): {
		decls: Map<string, string[]>
		scopes: string[]
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

		// TODO: use more common method to get the scope
		const scopes: string[] = []
		const selector = "." + escape(classname)
		root.walkRules(rule => {
			// const scope = rule.selector.replaceAll(selector, "") // https://github.com/swc-project/swc/issues/2607
			const scope = rule.selector.split(selector).join("")
			if (scope) scopes.push(scope)
		})

		const ret = { decls, scopes }
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
	function getTheme(keys: string[], useDefault = false) {
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
