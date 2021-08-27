/** @typedef {import("../server/typings/tailwindcss")} */

const postcss = require("postcss")
const tailwindcss = require("tailwindcss")
const resolveConfig = require("tailwindcss/resolveConfig")
const colors = require("tailwindcss/colors")
const plugin = require("tailwindcss/plugin")

delete colors.lightBlue

/** @type {Tailwind.ConfigJS} */
const config = {
	theme: {
		extend: {
			colors: {
				...colors,
				electric: ({ opacityValue }) => {
					return `rgba(219, 0, 255, ${opacityValue})`
				},
			},
		},
	},
}

/**
 * @param {string[]} classNames
 * @return {import("postcss").Result}
 */
async function jit(...classNames) {
	classNames = classNames.map(c => c.replace(/\s/g, ""))
	config.mode = "jit"
	config.purge = { enabled: false, content: [] }
	config.purge.safelist = classNames
	const processer = postcss([tailwindcss(config)])
	return processer.process("@tailwind components;@tailwind utilities;", { from: undefined })
}

async function run() {
	const result = await jit("border-t-red-500/30")
	console.log(result.content)
}

run()
