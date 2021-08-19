import postcss from "postcss"
import tailwindcss from "tailwindcss"
import colors from "tailwindcss/colors"

delete colors["lightBlue"]

const config = {
	mode: "jit",
	prefix: "",
	purge: {
		content: [],
	},
	theme: {
		extend: {
			colors: {
				electric: ({ opacityVariable, opacityValue }) => {
					if (opacityValue !== undefined) {
						return `rgba(219, 0, 255, ${opacityValue})`
					}

					if (opacityVariable !== undefined) {
						return `rgba(219, 0, 255, var(${opacityVariable}, 1))`
					}

					return `rgb(219, 0, 255)`
				},
				...colors,
			},
		},
	},
}

async function jit(...classNames: string[]) {
	classNames = classNames.map(c => c.replace(/\s/g, ""))

	config.purge["safelist"] = classNames

	const processer = postcss([tailwindcss(config)])
	const results = await Promise.all([
		processer.process("@tailwind base;@tailwind components;", { from: undefined }),
		processer.process("@tailwind utilities;", { from: undefined }),
	])

	return results[1]
}

async function run() {
	const result = await jit("border-t-red-500/30")
	console.log(result.content)
}

run()
