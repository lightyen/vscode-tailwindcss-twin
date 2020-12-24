import postcss from "postcss"
import { getClassNames, parseResults } from "./classnames"

const process = async (css: string) => {
	const processer = postcss([{ postcssPlugin: "no-op" }])
	return processer.process(css, { from: undefined })
}

const __source = "test"

const processCss = async (css: string) => {
	return parseResults([{ source: __source, result: await process(css) }])
}

test("B", async () => {
	const text = `
	  .divide-black > :not([hidden]) ~ :not([hidden]) {
		--tw-divide-opacity: 1;
		border-color: rgba(0, 0, 0, var(--tw-divide-opacity));
	  }
	  .2xl_twsp_divide-black > :not([hidden]) ~ :not([hidden]) {
		--tw-divide-opacity: 1;
		border-color: rgba(0, 0, 0, var(--tw-divide-opacity));
	  }
	  .bg-red-500 {
		--tw-bg-opacity: 1;
		background-color: rgba(239, 68, 68, var(--tw-bg-opacity))
	  }
	  .group:hover .group-hover_twsp_bg-red-500 {
		--tw-bg-opacity: 1;
		background-color: rgba(239, 68, 68, var(--tw-bg-opacity));
	  }
	  .sm_twsp_ring-0 {
		--tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
		--tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color);
		box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
	  }
	  .dark .dark_twsp_divide-gray-500 > :not([hidden]) ~ :not([hidden]) {
		--tw-divide-opacity: 1;
		border-color: rgba(107, 114, 128, var(--tw-divide-opacity))
	  }
	  .dark .sm_twsp_dark_twsp_divide-gray-500 > :not([hidden]) ~ :not([hidden]) {
		--tw-divide-opacity: 1;
		border-color: rgba(107, 114, 128, var(--tw-divide-opacity));
	  }
	  .dark .sm_twsp_dark_twsp_focus-within_twsp_ring-offset-red-200:focus-within {
		--tw-ring-offset-color: #fecaca;
	  }
	  `
	const ans = await process(text)
	const classNames = []
	const table: Record<string, Set<string>> = {}
	ans.root.walkRules(rule => {
		classNames.push(...getClassNames(rule, table))
	})

	expect(classNames).toEqual([
		{
			rule: true,
			name: "divide-black",
			pseudo: [],
		},
		{
			rule: true,
			name: "2xl_twsp_divide-black",
			pseudo: [],
		},
		{
			rule: true,
			name: "bg-red-500",
			pseudo: [],
		},
		{
			rule: false,
			name: "group",
			pseudo: [":hover"],
		},
		{
			scope: ".group:hover",
			rule: true,
			name: "group-hover_twsp_bg-red-500",
			pseudo: [],
		},
		{
			rule: true,
			name: "sm_twsp_ring-0",
			pseudo: [],
		},
		{
			rule: false,
			name: "dark",
			pseudo: [],
		},
		{
			scope: ".dark",
			rule: true,
			name: "dark_twsp_divide-gray-500",
			pseudo: [],
		},
		{
			rule: false,
			name: "dark",
			pseudo: [],
		},
		{
			scope: ".dark",
			rule: true,
			name: "sm_twsp_dark_twsp_divide-gray-500",
			pseudo: [],
		},
		{
			rule: false,
			name: "dark",
			pseudo: [],
		},
		{
			scope: ".dark",
			rule: true,
			name: "sm_twsp_dark_twsp_focus-within_twsp_ring-offset-red-200",
			pseudo: [":focus-within"],
		},
	])

	const result = await processCss(text)
	expect(result.variants).toEqual({
		dark: [".dark"],
		"2xl": [],
		"focus-within": [":focus-within"],
		"group-hover": [".group:hover"],
		sm: [],
	})
	expect(result.dictionary).toEqual({
		"2xl": {
			"divide-black": [
				{
					decls: {
						"--tw-divide-opacity": ["1"],
						"border-color": ["rgba(0, 0, 0, var(--tw-divide-opacity))"],
					},
					__source,
					__context: [],
					__pseudo: [],
				},
			],
		},
		"bg-red-500": [
			{
				decls: {
					"--tw-bg-opacity": ["1"],
					"background-color": ["rgba(239, 68, 68, var(--tw-bg-opacity))"],
				},
				__source,
				__context: [],
				__pseudo: [],
			},
		],
		dark: {
			"divide-gray-500": [
				{
					__scope: ".dark",
					decls: {
						"--tw-divide-opacity": ["1"],
						"border-color": ["rgba(107, 114, 128, var(--tw-divide-opacity))"],
					},
					__context: [],
					__pseudo: [],
					__source,
				},
			],
		},
		group: {
			__pseudo: [":hover"],
			__context: [],
			__source,
		},
		"divide-black": [
			{
				decls: {
					"--tw-divide-opacity": ["1"],
					"border-color": ["rgba(0, 0, 0, var(--tw-divide-opacity))"],
				},
				__source,
				__context: [],
				__pseudo: [],
			},
		],
		"group-hover": {
			"bg-red-500": [
				{
					__scope: ".group:hover",
					decls: {
						"--tw-bg-opacity": ["1"],
						"background-color": ["rgba(239, 68, 68, var(--tw-bg-opacity))"],
					},
					__source,
					__context: [],
					__pseudo: [],
				},
			],
		},
		sm: {
			dark: {
				"focus-within": {
					"ring-offset-red-200": [
						{
							__scope: ".dark",
							decls: {
								"--tw-ring-offset-color": ["#fecaca"],
							},
							__source,
							__context: [],
							__pseudo: [":focus-within"],
						},
					],
				},
				"divide-gray-500": [
					{
						__scope: ".dark",
						decls: {
							"--tw-divide-opacity": ["1"],
							"border-color": ["rgba(107, 114, 128, var(--tw-divide-opacity))"],
						},
						__context: [],
						__pseudo: [],
						__source,
					},
				],
			},
			"ring-0": [
				{
					decls: {
						"--tw-ring-offset-shadow": [
							"var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color)",
						],
						"--tw-ring-shadow": [
							"var(--tw-ring-inset) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color)",
						],
						"box-shadow": [
							"var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000)",
						],
					},
					__source,
					__context: [],
					__pseudo: [],
				},
			],
		},
	})
})

test("C", async () => {
	const result = await processCss(`
	  .group:hover .group-hover_twsp_bg-transparent {
		background-color: transparent
	  } .group:hover .group-hover_twsp_bg-current {
		background-color: currentColor
	  }
	`)
	expect(result.variants).toEqual({
		"group-hover": [".group:hover"],
	})
	expect(result.dictionary).toEqual({
		group: {
			__pseudo: [":hover"],
			__context: [],
			__source,
		},
		"group-hover": {
			"bg-transparent": [
				{
					__scope: ".group:hover",
					decls: {
						"background-color": ["transparent"],
					},
					__source,
					__context: [],
					__pseudo: [],
				},
			],
			"bg-current": [
				{
					__scope: ".group:hover",
					decls: {
						"background-color": ["currentColor"],
					},
					__source,
					__context: [],
					__pseudo: [],
				},
			],
		},
	})
})
