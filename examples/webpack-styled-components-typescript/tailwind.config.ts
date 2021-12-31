import colors from "tailwindcss/colors"

delete colors.lightBlue

export default {
	theme: {
		extend: {
			colors: {
				...colors,
				electric: "#db00ff",
				ribbon: "#0047ff",
			},
			fontFamily: {
				sans: [
					"Cascadia Code",
					"-apple-system",
					"BlinkMacSystemFont",
					"Segoe UI",
					"Roboto",
					"Helvetica Neue",
					"Arial",
					"Taipei Sans TC Beta",
					"Noto Sans",
					"sans-serif",
					"Apple Color Emoji",
					"Segoe UI Emoji",
					"Segoe UI Symbol",
					"Noto Color Emoji",
				],
			},
		},
	},
	plugins: [],
} as Tailwind.ConfigJS
