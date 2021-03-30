import postcss from "postcss"
import tailwindcss from "tailwindcss"
import { Options, Twin, __INNER_TAILWIND_SEPARATOR__ } from "./twin"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const process = async (css: string, config: any) => {
	const processer = postcss([tailwindcss(config)])
	return processer.process(css, { from: undefined })
}

test("example", async () => {
	const config = {
		separator: __INNER_TAILWIND_SEPARATOR__,
		darkMode: "media",
		prefix: "",
		theme: {
			container: {
				margin: {
					DEFAULT: "1rem",
					sm: ["2rem", "3rem"],
					lg: ["4rem", "5rem"],
					xl: ["5rem", "6rem"],
				},
				padding: {
					DEFAULT: "1rem",
					sm: ["2rem", "3rem"],
					lg: ["4rem", "5rem"],
					xl: ["5rem", "6rem"],
				},
				center: true,
			},
		},
	}

	const results = await Promise.all([process(`@tailwind components;`, config)])

	const twin = new Twin(config as Options, { result: results[0], source: "components" })

	expect(twin.classnames.get("container")).toEqual([
		{
			name: "container",
			variants: [],
			pseudo: [],
			context: [],
			rest: "",
			source: "components",
			decls: {
				width: ["100%"],
				"margin-right": ["auto"],
				"margin-left": ["auto"],
				"padding-right": ["1rem"],
				"padding-left": ["1rem"],
			},
		},
		{
			name: "container",
			variants: [],
			pseudo: [],
			context: ["@media (min-width: 640px)"],
			rest: "",
			source: "components",
			decls: {
				"max-width": ["640px"],
				"padding-right": ["2rem", "3rem"],
				"padding-left": ["2rem", "3rem"],
			},
		},
		{
			name: "container",
			variants: [],
			pseudo: [],
			context: ["@media (min-width: 768px)"],
			rest: "",
			source: "components",
			decls: { "max-width": ["768px"] },
		},
		{
			name: "container",
			variants: [],
			pseudo: [],
			context: ["@media (min-width: 1024px)"],
			rest: "",
			source: "components",
			decls: {
				"max-width": ["1024px"],
				"padding-right": ["4rem", "5rem"],
				"padding-left": ["4rem", "5rem"],
			},
		},
		{
			name: "container",
			variants: [],
			pseudo: [],
			context: ["@media (min-width: 1280px)"],
			rest: "",
			source: "components",
			decls: {
				"max-width": ["1280px"],
				"padding-right": ["5rem", "6rem"],
				"padding-left": ["5rem", "6rem"],
			},
		},
		{
			name: "container",
			variants: [],
			pseudo: [],
			context: ["@media (min-width: 1536px)"],
			rest: "",
			source: "components",
			decls: { "max-width": ["1536px"] },
		},
	])
})
