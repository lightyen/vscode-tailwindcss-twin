import { createGetPluginByName } from "@/corePlugins"
import * as extractColors from "@/extractColors"
import { dlv } from "@/get_set"
import { defaultLogger as console } from "@/logger"
import { importFrom } from "@/module"
import chroma from "chroma-js"
import type { Postcss } from "postcss"
import type { Attribute } from "postcss-selector-parser"
import { URI } from "vscode-uri"

const colorProps = [
	"background-color",
	"color",
	"border-color",
	"border-top-color",
	"border-right-color",
	"border-bottom-color",
	"border-left-color",
	"text-decoration-color",
	"accent-color",
	"caret-color",
	"fill",
	"stroke",
	"outline-color",
	"stop-color",
	"column-rule-color",
	"--tw-ring-color",
	"--tw-ring-offset-color",
	"--tw-gradient-from",
	"--tw-gradient-to",
	"--tw-gradient-stops",
]

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
	// const expandApplyAtRules: Tailwind.expandApplyAtRules = importFrom("tailwindcss/lib/lib/expandApplyAtRules", {
	// 	base: extensionUri.fsPath,
	// })
	const postcss = importFrom("postcss", { base: extensionUri.fsPath }) as Postcss
	const parser = importFrom("postcss-selector-parser", { base: extensionUri.fsPath })
	const context = createContext(config) as Tailwind.Context
	const _getPlugin = createGetPluginByName(config)
	const screens = Object.keys(config.theme.screens).sort(screenSorter)

	if (typeof config.prefix === "function") {
		console.info("function prefix is not supported.")
	}

	if (typeof config.prefix === "function") {
		const getPrefix = config.prefix
		config.prefix = function (classname: string) {
			const prefix = getPrefix(classname)
			fn(prefix, classname)
			return prefix
			function fn(prefix: string, classname: string) {
				//
			}
		}
	} else if (typeof config.prefix !== "string") {
		config.prefix = ""
	}

	const restVariants = Array.from(context.variantMap.keys()).filter(
		key => screens.indexOf(key) === -1 && key !== "dark" && key !== "light" && key !== "placeholder",
	)

	const colors: Map<string, ColorDesc> = new Map()
	// sorted variants
	const variants: [string[], string[], string[], string[]] = [
		screens,
		["dark", "light"],
		["placeholder"],
		restVariants,
	]
	const variables = new Set<string>()
	const classnames = context.getClassList()
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
		return node.raws.value
	}

	function indent(tabSize: number, value: string) {
		return value
			.split(/(\r\n|\n)/g)
			.map(line => line.replace(/^(\t| {4})+/g, match => "".padStart((match.length >> 2) * tabSize)))
			.join("")
	}

	function renderVariant(variant: string, tabSize = 4): ScssText {
		const data: string[] = []
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
		const re = new RegExp(
			("." + escape(variant + config.separator + "☕")).replace(/[/\\^$+?.()|[\]{}]/g, "\\$&"),
			"g",
		)
		for (const [, fn] of meta) {
			const container = fakeRoot.clone()
			fn({ container, separator: config.separator })
			container.walkDecls(decl => {
				decl.remove()
			})
			container.walk(node => {
				switch (node.type) {
					case "atrule":
						data.push(`@${node.name} ${node.params}`)
						return false
					case "rule":
						data.push(node.selector.replace(re, "&"))
				}
				return
			})
		}

		return indent(tabSize, data.join(", ") + " {\n    /* ... */\n}")
	}

	function renderArbitraryVariant(code: string, tabSize = 4) {
		code = code.trim().replace(/\s{2,}/g, " ")
		code = code + " {\n    /* ... */\n}"
		const root = postcss.parse(code)
		return indent(tabSize, root.toString())
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
	}: {
		classname: string
		important?: boolean
		rootFontSize?: number
		tabSize?: number
	}): CssText {
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
		root.walkAtRules("defaults", rule => {
			rule.remove()
		})

		if (important || rootFontSize) {
			root.walkDecls(decl => {
				decl.important = important
				decl.value = toPixelUnit(decl.value, rootFontSize)
			})
		}
		return indent(tabSize, root.toString())
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
		const decl = postcss.decl()
		decl.prop = prop
		decl.value = value
		if (important) decl.important = important
		if (rootFontSize) decl.value = toPixelUnit(decl.value, rootFontSize)
		const rule = postcss.rule()
		rule.selector = "&"
		rule.append(decl)
		const root = postcss.root({ nodes: [rule] })
		return indent(tabSize, root.toString())
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

		const desc: ColorDesc = {}
		const props = Array.from(decls.keys())
		const isForeground = props.some(prop => prop === "color")
		const isBackground = props.some(prop => prop.startsWith("background"))
		const isBorder = props.some(prop => prop.startsWith("border") || prop === "text-decoration-color")
		const isOther = !isForeground && !isBackground && !isBorder

		if (classname.endsWith("-current")) {
			if (isForeground) {
				desc.color = "currentColor"
			}
			if (isBorder) {
				desc.borderColor = "currentColor"
			}
			if (isBackground || isOther) {
				desc.backgroundColor = "currentColor"
			}
			addCache(classname, desc)
			return desc
		}

		if (classname.endsWith("-inherit")) {
			if (isForeground) {
				desc.color = "inherit"
			}
			if (isBorder) {
				desc.borderColor = "inherit"
			}
			if (isBackground || isOther) {
				desc.backgroundColor = "inherit"
			}
			addCache(classname, desc)
			return desc
		}

		if (classname.endsWith("-transparent")) {
			if (isForeground) {
				desc.color = "transparent"
			}
			if (isBorder) {
				desc.borderColor = "transparent"
			}
			if (isBackground || isOther) {
				desc.backgroundColor = "transparent"
			}
			addCache(classname, desc)
			return desc
		}

		for (const values of decls.values()) {
			for (const value of values) {
				const colors = extractColors.default(value)
				if (colors.length <= 0) {
					continue
				}

				const firstColor = colors[0]

				let color: chroma.Color | undefined

				if (extractColors.isColorIdentifier(firstColor) || extractColors.isColorHexValue(firstColor)) {
					if (firstColor.raw.value === "transparent") {
						if (isBorder) {
							desc.borderColor = "transparent"
						}
						if (isForeground) {
							desc.color = "transparent"
						}
						if (isBackground || isOther) {
							desc.backgroundColor = "transparent"
						}
						continue
					}
					try {
						color = chroma(firstColor.raw.value).alpha(1.0)
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

				const val = color.hex()

				if (isBorder) {
					desc.borderColor = val
				}
				if (isForeground) {
					desc.color = val
				}
				if (isBackground || isOther) {
					desc.backgroundColor = val
				}
			}
		}

		addCache(classname, desc)
		return desc
	}

	function getColorDecls(classname: string): Map<string, string[]> | undefined {
		const decls = renderDecls(classname)
		for (const [prop] of decls) {
			if (colorProps.indexOf(prop) !== -1) {
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

	function renderDecls(classname: string) {
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

		return decls
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
