import { bar, qoo } from "./colors"
import utopia, { fontSize } from "./utopia"

export default {
	lightMode: "media",
	theme: {
		extend: {
			tabSize: {
				px: "1px",
			},
			colors: {
				bar,
				qoo,
				"foo-5": "#056660",
				"foo-5/10": "#051060",
				"foo-5/10/10%": "#651025",
				space: {
					"1/1": "#051025",
				},
			},
		},
	},
	experimental: { matchVariant: true },
	plugins: [
		utopia(fontSize()),
		function ({ addVariant }) {
			addVariant("foo", ({ container }) => {
				container.walkRules(rule => {
					rule.selector = `.foo\\:${rule.selector.slice(1)}`
					rule.walkDecls(decl => {
						decl.important = true
					})
				})
			})
		},
		function ({ addVariant, postcss }) {
			addVariant("mdx", [
				({ container }) => {
					const mediaRule1 = postcss.atRule({
						name: "media",
						params: "(min-width: 1200px)",
					})
					mediaRule1.append(container.nodes)
					container.push(mediaRule1)
					mediaRule1.walkRules(rule => {
						rule.selector = `.mdx\\:${rule.selector.slice(1)}`
					})
				},
				({ container }) => {
					const mediaRule2 = postcss.atRule({
						name: "media",
						params: "(min-width: 1040px)",
					})
					mediaRule2.append(container.nodes)
					container.push(mediaRule2)
					mediaRule2.walkRules(rule => {
						rule.selector = `.collapsed .mdx\\:${rule.selector.slice(1)}`
					})
				},
			])
		},
		function ({ matchUtilities, matchComponents, matchVariant, theme, e }) {
			matchUtilities({
				tab(value) {
					return {
						tabSize: value,
					}
				},
			})
			matchComponents(
				{
					test(value) {
						return {
							"&.test": {
								backgroundColor: value,
							},
						}
					},
				},
				{ values: theme("colors.cyan") },
			)
			matchVariant({
				tab(value) {
					if (value == null) return "& > *"
					return `&.${e(value ?? "")} > *`
				},
			})
			matchVariant({
				screen(value) {
					return `@media (min-width: ${value ?? "0px"})`
				},
			})
		},
	],
} as Tailwind.ConfigJS
