import "tailwind-types"

export default {
	theme: {
		extend: {
			tabSize: {
				px: "1px",
			},
		},
	},
	plugins: [
		function ({ matchUtilities, matchComponents, theme }) {
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
		},
	],
} as Tailwind.ConfigJS
