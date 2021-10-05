import chroma from "chroma-js"
import Fuse from "fuse.js"
import type { Postcss } from "postcss"
import type { Attribute } from "postcss-selector-parser"
import { CompletionItemKind } from "vscode-languageserver"
import { URI } from "vscode-uri"
import { createGetPluginByName } from "~/common/corePlugins"
import { dlv } from "~/common/get_set"
import { importFrom } from "~/common/module"
import { SuggestionResult } from "~/common/twin-parser"
import { ICompletionItem } from "~/common/types"
import { colors as colorNames } from "~/common/vscode-css-languageservice"

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
		cache: true,
		base: extensionUri.fsPath,
	}).createContext
	const generateRules: Tailwind.generateRules = importFrom("tailwindcss/lib/lib/generateRules", {
		cache: true,
		base: extensionUri.fsPath,
	}).generateRules
	// const expandApplyAtRules: Tailwind.expandApplyAtRules = importFrom("tailwindcss/lib/lib/expandApplyAtRules", {
	// 	cache: true,
	// 	base: extensionUri.fsPath,
	// })
	const postcss = importFrom("postcss", { cache: true, base: extensionUri.fsPath }) as Postcss
	const parser = importFrom("postcss-selector-parser", { cache: true, base: extensionUri.fsPath })
	const context = createContext(config) as Tailwind.Context
	const getPlugin = createGetPluginByName(config)
	const screens = Object.keys(config.theme.screens).sort(screenSorter)
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
	const customVariablesSet = new Set<string>()
	const classnames = context.getClassList()
	const classnamesMap = new Set(classnames)

	for (const classname of classnames) {
		getColorDesc(classname)
	}

	const searchers = {
		variants: new Fuse(variants.flat(), { includeScore: true }),
		classnames: new Fuse(classnames, { includeScore: true }),
	}

	let utilitiesCompletionItems: ICompletionItem[] | undefined

	return {
		variants,
		renderVariant,
		renderClassname,
		renderCssProperty,
		escape,
		context,
		screens,
		isVariant,
		getPlugin,
		getDecls,
		getColorDecls,
		getColorDesc,
		getConfig,
		getTheme,
		searchers,
		colors, // remove?
		get customProperties() {
			return Array.from(customVariablesSet)
		},
		getUtilitiesCompletionItems(suggestion: SuggestionResult): ICompletionItem[] {
			if (utilitiesCompletionItems) {
				return utilitiesCompletionItems
			}

			utilitiesCompletionItems = classnames.map(value => {
				const item: ICompletionItem = {
					label: value,
					data: { type: "utility" },
					kind: CompletionItemKind.Constant,
					sortText: (value.startsWith("-") ? "~~" : "~") + formatLabel(value),
				}

				const colorDesc = getColorDesc(value)
				if (colorDesc) {
					item.kind = CompletionItemKind.Color
					item.data = { type: "color" }

					if (value.endsWith("-transparent")) {
						item.documentation = "rgba(0, 0, 0, 0.0)"
						item.data.type = "color"
						return item
					}
					item.documentation = colorDesc.backgroundColor || colorDesc.color || colorDesc.borderColor
				}

				return item
			})

			return utilitiesCompletionItems

			function formatLabel(label: string) {
				const reg = /((?:[\w-]+-)+)+([\d/.]+)/
				const m = label.match(reg)
				if (!m) {
					return label
				}
				try {
					const val = eval(m[2])
					if (typeof val !== "number") {
						return label
					}
					const prefix = m[1] + (/^[\d.]+$/.test(m[2]) ? "@" : "_")
					return prefix + val.toFixed(3).padStart(7, "0")
				} catch {
					return label
				}
			}
		},
	}

	function escape(className: string) {
		const node = parser.attribute() as Attribute
		node.value = className
		return node.raws.value
	}

	function renderVariant(variant: string): ScssText {
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

		return data.join(", ") + " {\n\t/* ... */\n}"
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
	}: {
		classname: string
		important?: boolean
		rootFontSize?: number
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
		// expandApplyAtRules(context)(root)

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
	}: {
		prop: string
		value: string
		important?: boolean
		rootFontSize?: number
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
				colors.set(key, value)
			}
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

		// #000|#000000|#00000090|rgb[a](a, b, c[, d])|rgb[a](a b c[ d])
		const re =
			/#[0-9A-F]{3}\b|#[0-9A-F]{6}\b|#[0-9A-F]{8}\b|rgba?\(\s*(?<r>\d{1,3})(?:\s*,|\s+)\s*(?<g>\d{1,3})(?:\s*,|\s+)\s*(?<b>\d{1,3})/i
		const normalize = (cssValue: string) => cssValue.replace(/(,|\/)\s*var\(\s*[\w-]*\s*\)/gi, "$1 1")

		for (const values of decls.values()) {
			for (const value of values) {
				const colorName = colorNames[value.trim()]

				let match: RegExpMatchArray | null = null
				if (!colorName) {
					match = normalize(value).match(re)
					if (match == null) {
						continue
					}
				}

				let color: chroma.Color | undefined

				if (colorName) {
					try {
						color = chroma(colorName)
					} catch {}
				} else if (match) {
					try {
						if (match.groups?.r) {
							const { r, g, b } = match.groups
							color = chroma(+r, +g, +b)
						} else {
							color = chroma(match[0])
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
		const decls = getDecls(classname)
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

	function getDecls(classname: string) {
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
			if (prop.startsWith("--")) {
				customVariablesSet.add(prop)
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
