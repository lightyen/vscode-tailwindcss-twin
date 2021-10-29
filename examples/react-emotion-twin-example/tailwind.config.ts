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
		},
	},
	plugins: [],
} as Tailwind.ConfigJS
