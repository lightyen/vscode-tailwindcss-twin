import chroma from "chroma-js"
import Fuse from "fuse.js"
import type { Node, Result, Rule } from "postcss"
import parser from "postcss-selector-parser"
import __baseVariants from "./baseVariants.json"
import { dlv, dset, intersection } from "./common"
import twinVariants from "./twinVariants.json"

export const __INNER_TAILWIND_SEPARATOR__ = "_twsp_"

const selectorProcessor = parser()

const TWIN_CONTENT = [{ __source: "utilities", __pseudo: [], __context: [], decls: { content: ['""'] } }]

interface ClassName {
	scope?: string
	name: string
	rule: boolean
	pseudo: string[]
}

export interface CSSRuleItem {
	__scope?: string
	decls: Record<string, string[]>
	__source?: string
	__context: string[]
	__pseudo: string[]
}

export function createSelectorFromNodes(nodes: parser.Selector[]): string | undefined {
	if (nodes.length === 0) return undefined
	const selector = parser.selector({ value: "" })
	for (let i = 0; i < nodes.length; i++) {
		selector.append(nodes[i])
	}
	return String(selector).trim()
}

export function getClassNames(rule: Rule, notRules: Record<string, Set<string>>) {
	const classNames: ClassName[] = []
	const { nodes: selectors } = selectorProcessor.astSync(rule.selector)
	for (let i = 0; i < selectors.length; i++) {
		const scopes: parser.Node[] = []
		for (let j = 0; j < selectors[i].nodes.length; j++) {
			const node = selectors[i].nodes[j]
			const pseudos: parser.Pseudo[] = []
			if (node.type === "class") {
				for (let next: parser.Node; (next = selectors[i].nodes[j + 1]), next?.type === "pseudo"; j++) {
					pseudos.push(next)
				}
				const name = node.value.trim()
				const rule = j === selectors[i].nodes.length - 1
				const pseudo = pseudos.map(String)
				const className: ClassName = { name, rule, pseudo }
				// exception
				if (name.includes("divide-") || name.includes("space-")) {
					className.rule = true
				}
				if (scopes.length > 0) {
					className.scope = createSelectorFromNodes(scopes as parser.Selector[])
				}
				classNames.push(className)
				if (!className.rule) {
					if (!notRules[name]) {
						notRules[name] = new Set<string>()
					}
					for (const p of pseudo) notRules[name].add(p)
				}
			}
			scopes.push(node, ...pseudos)
		}
	}
	return classNames
}

export function extractClassNames(
	[_base, components, utilities]: [Result, Result, Result],
	darkMode: false | "media" | "class",
	prefix: string,
) {
	return parseResults(
		[
			// { source: "base", result: base },
			{ source: "components", result: components },
			{ source: "utilities", result: utilities },
		],
		darkMode,
		prefix,
	)
}

export function parseResults(
	groups: Array<{ source: string; result: Result }>,
	darkMode: false | "media" | "class" = false,
	prefix: string,
	twin = true,
) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const tree: Record<string, any> = {}
	const variants: Record<string, string[]> = {}

	for (const { source, result } of groups) {
		const notRules: Record<string, Set<string>> = {}
		result.root.walkRules(rule => {
			const classNames = getClassNames(rule, notRules)
			const decls: Record<string, string[]> = {}
			rule.walkDecls(decl => {
				const d = decls[decl.prop]
				if (d) {
					decls[decl.prop] = [...(d instanceof Array ? d : [d]), decl.value]
				} else {
					decls[decl.prop] = [decl.value]
				}
			})

			let p = rule as Node | undefined
			const keys: string[] = []
			while (p?.parent?.type !== "root") {
				p = p?.parent
				if (p?.type === "atrule") {
					keys.push(`@${p["name"]} ${p["params"]}`)
				}
			}

			for (let i = 0; i < classNames.length; i++) {
				const context = keys.slice()
				const baseKeys = classNames[i].name.split(__INNER_TAILWIND_SEPARATOR__)
				const variantKeys = baseKeys.slice(0, baseKeys.length - 1)
				let index: number[] = []

				const info = dlv(tree, [...baseKeys])
				if (info instanceof Array) {
					index = [info.length]
				} else if (classNames[i].rule) {
					index = [0]
					dset(tree, [...baseKeys], [])
				}
				if (classNames[i].scope) {
					dset(tree, [...baseKeys, ...index, "__scope"], classNames[i].scope)
				}
				if (classNames[i].rule) {
					for (const key in decls) {
						dset(tree, [...baseKeys, ...index, "decls", key], decls[key])
					}
					dset(tree, [...baseKeys, ...index, "__source"], source)
					dset(tree, [...baseKeys, ...index, "__pseudo"], classNames[i].pseudo)
					dset(tree, [...baseKeys, ...index, "__context"], context.slice().reverse())
				}

				// common context
				context.push(...classNames[i].pseudo)
				for (let i = 0; i < variantKeys.length; i++) {
					if (!variants[variantKeys[i]]) {
						variants[variantKeys[i]] = context
					} else {
						variants[variantKeys[i]] = intersection(variants[variantKeys[i]], context)
					}
				}
				if (classNames[i].scope === ".dark") {
					for (const p of classNames[i].pseudo) notRules["dark"].add(p)
				}
			}
		})

		for (const [name, pesudos] of Object.entries(notRules)) {
			if (name === "dark") {
				variants["dark"] = [".dark"]
				continue
			}
			dset(tree, [name, "__source"], source)
			dset(tree, [name, "__pseudo"], Array.from(pesudos))
			dset(tree, [name, "__context"], [])
		}
	}

	for (const k in variants) {
		if (__baseVariants[k]) {
			variants[k] = __baseVariants[k]
		}
	}
	const baseVariants = { ...variants }
	if (twin) {
		for (const k in twinVariants) {
			variants[k] = twinVariants[k]
		}
		// for light
		if (darkMode === "media") {
			variants["light"] = ["@media (prefers-color-scheme: light)"]
		} else if (darkMode === "class") {
			variants["light"] = [".light"]
		}
	}

	dset(tree, [prefix + "content"], TWIN_CONTENT)

	function collectBreakingPoints(variants: Record<string, string[]>) {
		const reg = /@media\s\(.*width:\s*(\d+)px/
		const result: Record<string, number> = {}
		for (const label in variants) {
			for (const value of variants[label]) {
				const match = value.match(reg)
				if (match) {
					const [, v] = match
					result[label] = Number(v)
					break
				}
			}
		}
		return result
	}

	type ColorInfo = {
		color?: string
		backgroundColor?: string
		borderColor?: string
	}

	function collectColors(tree: Record<string, CSSRuleItem | CSSRuleItem[]>) {
		const colors: Record<string, ColorInfo> = {}
		Object.entries(tree).forEach(([label, info]) => {
			if (!(info instanceof Array)) {
				return
			}

			type D = [property: string, value: string]
			const decls: D[] = info.flatMap(v =>
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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

				if (!colors[label]) {
					colors[label] = {}
				}

				const isFg = prop === "color"
				const isBg = prop.includes("background")
				const isBd = prop.includes("border") || prop.includes("divide")
				const isOther = !isFg && !isBg && !isBd

				if (label.includes("current")) {
					if (isFg) {
						colors[label].color = "currentColor"
					}
					if (isBd) {
						colors[label].borderColor = "currentColor"
					}
					if (isBg || isOther) {
						colors[label].backgroundColor = "currentColor"
					}
					continue
				}

				if (label.includes("transparent")) {
					if (isFg) {
						colors[label].color = "transparent"
					}
					if (isBd) {
						colors[label].borderColor = "transparent"
					}
					if (isBg || isOther) {
						colors[label].backgroundColor = "transparent"
					}
					continue
				}

				const reg = /^[a-z]+$|#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b|rgba\(\s*(?<r>\d{1,3})\s*,\s*(?<g>\d{1,3})\s*,\s*(?<b>\d{1,3})\s*,\s*(?<a>\d{1,3})\s*\)/
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
					colors[label].borderColor = val
				}
				if (isFg) {
					colors[label].color = val
				}
				if (isBg || isOther) {
					colors[label].backgroundColor = val
				}
			}
		})
		return colors
	}

	enum Flag {
		None = 0,
		Responsive = 1 << 0,
		DarkLightMode = 1 << 1,
		MotionControl = 1 << 2,
		CommonVariant = 1 << 3,
	}

	let searchers: { variants: Fuse<string>; classnames: Fuse<string> } | undefined = undefined

	return {
		/**
		 * class rules
		 */
		dictionary: tree,
		/**
		 * official variants table
		 */
		baseVariants,
		/**
		 * twin variants table
		 */
		twinVariants,
		/**
		 * current variants table
		 */
		variants,
		/**
		 * short color table
		 */
		colors: collectColors(tree),
		/**
		 * short breaking points table
		 */
		breakingPoints: collectBreakingPoints(variants),
		isDarkLightMode(label: string) {
			return label === "dark" || label === "light"
		},
		getBreakingPoint(label: string) {
			return this.breakingPoints[label]
		},
		isResponsive(label: string) {
			return !!this.getBreakingPoint(label)
		},
		/**
		 * Test the variant whether it is a valid variant
		 * @param label input
		 * @param twinPattern is current pattern twin?
		 */
		isVariant(label: string) {
			return this.getVariants()[label] != undefined
		},
		hasDarkLightMode(labels: string[]) {
			return labels.some(v => this.isDarkLightMode(v))
		},
		hasBreakingPoint(labels: string[]) {
			return labels.some(v => this.isResponsive(v))
		},
		isMotionControl(label: string) {
			return label === "motion-reduce" || label === "motion-safe"
		},
		getVariants() {
			return this.variants
		},
		/**
		 * Test the variant whether it is a valid common variant.(not breaking point, not dark mode)
		 * @param label input
		 */
		isCommonVariant(label: string) {
			if (this.isResponsive(label)) {
				return false
			}
			if (this.isDarkLightMode(label)) {
				return false
			}
			return this.isVariant(label)
		},
		/**
		 * Test the label whether it is valid utility.
		 * @param label input
		 */
		isClassName(variants: string[], label: string) {
			const obj = this.getClassNames()
			if (!(obj?.[label] instanceof Array)) {
				return false
			}
			if (!this.getClassNameFilter(variants)([label, obj[label]])) {
				return false
			}
			return true
		},
		/**
		 * Get all classNames information.
		 * @param variants input variant space
		 */
		getClassNames(): Record<string, CSSRuleItem | CSSRuleItem[]> {
			return this.dictionary
		},
		getClassNameRule(label: string): CSSRuleItem | CSSRuleItem[] {
			return this.getClassNames()[label]
		},
		/**
		 * for providing proper variant list
		 * @param variants input variant space
		 */
		getVariantFilter(variants: string[]): (label: string) => boolean {
			const flags: Flag =
				(this.hasBreakingPoint(variants) ? Flag.Responsive : Flag.None) |
				(this.hasDarkLightMode(variants) ? Flag.DarkLightMode : Flag.None) |
				(variants.some(v => this.isCommonVariant(v)) ? Flag.CommonVariant : Flag.None)
			return label => {
				if (variants.some(v => v === label)) {
					return false
				}
				if (flags & Flag.Responsive) {
					if (this.isResponsive(label)) {
						return false
					}
				}
				if (flags & Flag.DarkLightMode) {
					if (this.isDarkLightMode(label)) {
						return false
					}
				}
				return true
			}
		},
		getVariantList(variants: string[]) {
			return Object.keys(this.getVariants()).filter(this.getVariantFilter(variants))
		},
		/**
		 * for providing proper className list
		 * @param variants input variant space
		 */
		getClassNameFilter(variants: string[]): (v: [string, CSSRuleItem | CSSRuleItem[]]) => boolean {
			return ([label, info]) => {
				switch (label) {
					case prefix + "container":
						return variants?.length === 0
				}
				if (!(info instanceof Array)) {
					return false
				}
				return true
			}
		},
		getClassNameList(variants: string[]) {
			const classes = Object.entries(this.getClassNames())
				.filter(this.getClassNameFilter(variants))
				.map(([label]) => label)
			return classes
		},
		/**
		 * get approximate string matching searcher
		 */
		getSearcher(): { variants: Fuse<string>; classnames: Fuse<string> } {
			if (searchers) {
				return searchers
			}
			const vs = this.getVariantList([])
			searchers = {
				variants: new Fuse(vs, { includeScore: true }),
				classnames: new Fuse(this.getClassNameList([]), { includeScore: true }),
			}
			return searchers
		},
		getColorInfo(label: string) {
			const info = dlv(this.dictionary, [label]) as CSSRuleItem | CSSRuleItem[]
			if (!(info instanceof Array)) {
				return undefined
			}

			const colorInfo: ColorInfo = {}

			for (let i = 0; i < info.length; i++) {
				const pseudo = info[i].__pseudo
				if (pseudo.length > 0) continue
				const decls = info[i].decls
				if (!decls) continue
				for (const [prop, values] of Object.entries(decls)) {
					const value = values[values.length - 1]
					if (!prop.includes("color") && !prop.includes("gradient") && prop !== "fill" && prop !== "stroke") {
						continue
					}

					const isFg = prop === "color"
					const isBg = prop.includes("background")
					const isBd = prop.includes("border") || prop.includes("divide")
					const isOther = !isFg && !isBg && !isBd

					if (label.includes("current")) {
						if (isFg) {
							colorInfo.color = "currentColor"
						}
						if (isBd) {
							colorInfo.borderColor = "currentColor"
						}
						if (isBg || isOther) {
							colorInfo.backgroundColor = "currentColor"
						}
						continue
					}

					if (label.includes("transparent")) {
						if (isFg) {
							colorInfo.color = "transparent"
						}
						if (isBd) {
							colorInfo.borderColor = "transparent"
						}
						if (isBg || isOther) {
							colorInfo.backgroundColor = "transparent"
						}
						continue
					}

					const reg = /^[a-z]+$|#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b|rgba\(\s*(?<r>\d{1,3})\s*,\s*(?<g>\d{1,3})\s*,\s*(?<b>\d{1,3})\s*,\s*(?<a>\d{1,3})\s*\)/
					const m = value.replace(/,\s*var\(\s*[\w-]+\s*\)/g, ", 1").match(reg)
					if (m == null) {
						continue
					}

					let color: chroma.Color
					try {
						if (m.groups?.r) {
							const { r, g, b } = m.groups
							color = chroma(+r, +g, +b)
						} else {
							color = chroma(m[0])
						}
					} catch {
						return undefined
					}

					const val = color.hex()

					if (isBd) {
						colorInfo.borderColor = val
					}
					if (isFg) {
						colorInfo.color = val
					}
					if (isBg || isOther) {
						colorInfo.backgroundColor = val
					}
				}
			}
			return colorInfo
		},
	}
}
