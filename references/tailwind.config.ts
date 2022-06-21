import "tailwind-types"

export default {
	theme: {
		extend: {
			tabSize: {
				px: "1px",
			},
		},
	},
	experimental: { matchVariant: true },
	plugins: [
		function ({ matchUtilities, matchComponents, matchVariant, theme }) {
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
					if (value == undefined) return `& > *`
					return `&.${value ?? ""} > *`
				},
			})
		},
	],
} as Tailwind.ConfigJS
