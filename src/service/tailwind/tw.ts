import { createGetPluginByName } from "@/corePlugins"
import * as extractColors from "@/extractColors"
import { dlv } from "@/get_set"
import { defaultLogger as console } from "@/logger"
import { importFrom } from "@/module"
import chroma from "chroma-js"
import type { AtRule, Postcss, Rule } from "postcss"
import type { Attribute } from "postcss-selector-parser"
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

export type TwContext = ReturnType<typeof createTwContext>

export type CssText = string
export type ScssText = string

export function createTwContext(config: Tailwind.ResolvedConfigJS, extensionUri: URI) {
	const createContext: Tailwind.createContext = importFrom("tailwindcss/lib/lib/setupContextUtils", {
		base: extensionUri.fsPath,
	}).createContext
	const generateRules: Tailwind.generateRules = importFrom("tailwindcss/lib/lib/generateRules", {
		base: extensionUri.fsPath,
	}).generateRules
	const expandApplyAtRules: Tailwind.expandApplyAtRules = importFrom("tailwindcss/lib/lib/expandApplyAtRules", {
		base: extensionUri.fsPath,
	})
	const postcss = importFrom("postcss", { base: extensionUri.fsPath }) as Postcss
	const parser = importFrom("postcss-selector-parser", { base: extensionUri.fsPath })
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
	// XXX: Handle tailwindcss bug: exclude the '*' classname
	if (classnames.indexOf("*") !== -1) classnames.splice(classnames.indexOf("*"), 1)
	const classnamesMap = new Set(classnames)

	for (const classname of classnames) {
		getColorDesc(classname)
	}

	return {
		variants,
		classnames,
		variables,
		context,
		screens,
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
		getConfig,
		getTheme,
		trimPrefix,
	}

	function trimPrefix(classname: string): string {
		if (typeof config.prefix === "function") {
			return classname
		}
		return classname.slice(config.prefix.length)
	}

	function escape(className: string) {
		const node = parser.attribute() as Attribute
		node.value = className
		return node.raws.value || node.value
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
			let selector: string | undefined

			const returnValue = fn({
				container,
				separator: config.separator,
				wrap(node) {
					wrapper.push(node)
				},
				format(selectorFormat) {
					selector = selectorFormat.replace(/:merge\((.*?)\)/g, "$1")
				},
			})

			if (!selector && returnValue) selector = returnValue
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
				console.debug("fallback", container)
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
	}: {
		classname: string
		important?: boolean
		rootFontSize?: number
		tabSize?: number
	}): CssText {
		const root = render(classname, tabSize)
		if (important || rootFontSize) {
			root.walkDecls(decl => {
				decl.important = important
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
	}: {
		prop: string
		value: string
		important?: boolean
		rootFontSize?: number
		tabSize?: number
	}): ScssText {
		const decl = postcss.decl({ prop, value, important })
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
				const colors = extractColors.default(value)
				if (colors.length <= 0) {
					continue
				}

				const firstColor = colors[0]

				let color: chroma.Color | undefined

				if (extractColors.isColorIdentifier(firstColor) || extractColors.isColorHexValue(firstColor)) {
					if (value.slice(firstColor.range[0], firstColor.range[1]) === "transparent") {
						return "transparent"
					}
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

	function getColorDecls(classname: string): Map<string, string[]> | undefined {
		const { decls } = renderDecls(classname)
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
		// TODO: use more common method to get the scope
		const scopes: string[] = []
		const selector = "." + escape(classname)
		root.walkRules(rule => {
			if (rule.selector.startsWith(selector)) {
				// const scope = rule.selector.replaceAll("." + escape(classname), "") // https://github.com/swc-project/swc/issues/2607
				const scope = rule.selector.split("." + escape(classname)).join("")
				if (scope) scopes.push(scope)
			}
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
