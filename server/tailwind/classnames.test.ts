import postcss from "postcss"
import { parseResults } from "./classnames"

const process = async (css: string) => {
	const processer = postcss([{ postcssPlugin: "no-op" }])
	return processer.process(css, { from: undefined })
}

const __source = "test"

const processCss = async (css: string) => {
	return parseResults([{ source: __source, result: await process(css) }])
}

test("processes default container plugin", async () => {
	const result = await processCss(`
	  .container {
		width: 100%
	  }

	  @media (min-width: 640px) {
		.container {
		  max-width: 640px
		}
	  }

	  @media (min-width: 768px) {
		.container {
		  max-width: 768px
		}
	  }

	  @media (min-width: 1024px) {
		.container {
		  max-width: 1024px
		}
	  }

	  @media (min-width: 1280px) {
		.container {
		  max-width: 1280px
		}
	  }
	`)
	expect(result.variants).toEqual({})
	expect(result.dictionary).toEqual({
		container: [
			{
				__rule: true,
				decls: {
					width: ["100%"],
				},
				__source,
				__context: [],
				__pseudo: [],
			},
			{
				__rule: true,
				decls: {
					"max-width": ["640px"],
				},
				__source,
				__context: ["@media (min-width: 640px)"],
				__pseudo: [],
			},
			{
				__rule: true,
				decls: {
					"max-width": ["768px"],
				},
				__source,
				__context: ["@media (min-width: 768px)"],
				__pseudo: [],
			},
			{
				__rule: true,
				decls: {
					"max-width": ["1024px"],
				},
				__source,
				__context: ["@media (min-width: 1024px)"],
				__pseudo: [],
			},
			{
				__rule: true,
				decls: {
					"max-width": ["1280px"],
				},
				__source,
				__context: ["@media (min-width: 1280px)"],
				__pseudo: [],
			},
		],
	})
})

test("foo", async () => {
	const result = await processCss(`
	  @media (min-width: 640px) {
		.sm_twsp_bg-red {
		  background-color: red;
		}
		.sm_twsp_hover_twsp_bg-red:hover {
		  background-color: red;
		}
	  }
	  .hover_twsp_bg-red:hover {
		background-color: red;
	  }
	`)
	expect(result.variants).toEqual({
		sm: ["@media (min-width: 640px)"],
		hover: [":hover"],
	})
	expect(result.dictionary).toEqual({
		sm: {
			"bg-red": [
				{
					__rule: true,
					decls: {
						"background-color": ["red"],
					},
					__source,
					__context: ["@media (min-width: 640px)"],
					__pseudo: [],
				},
			],
			hover: {
				"bg-red": [
					{
						__rule: true,
						decls: {
							"background-color": ["red"],
						},
						__source,
						__context: ["@media (min-width: 640px)"],
						__pseudo: [":hover"],
					},
				],
			},
		},
		hover: {
			"bg-red": [
				{
					__rule: true,
					decls: {
						"background-color": ["red"],
					},
					__source,
					__context: [],
					__pseudo: [":hover"],
				},
			],
		},
	})
})

test("processes basic css", async () => {
	const result = await processCss(`
	  .bg-red {
		background-color: red;
	  }
	`)
	expect(result.variants).toEqual({})
	expect(result.dictionary).toEqual({
		"bg-red": [
			{
				__rule: true,
				decls: {
					"background-color": ["red"],
				},
				__source,
				__context: [],
				__pseudo: [],
			},
		],
	})
})

test("processes pseudo selectors", async () => {
	const result = await processCss(`
	  .bg-red:first-child::after {
		background-color: red;
	  }
	`)
	expect(result.variants).toEqual({})
	expect(result.dictionary).toEqual({
		"bg-red": [
			{
				__rule: true,
				decls: {
					"background-color": ["red"],
				},
				__source,
				__context: [],
				__pseudo: [":first-child", "::after"],
			},
		],
	})
})

test("processes pseudo selectors in scope", async () => {
	const result = await processCss(`
	  .scope:hover .bg-red {
		background-color: red;
	  }
	`)
	expect(result.variants).toEqual({})
	expect(result.dictionary).toEqual({
		scope: {
			__context: [],
			__pseudo: [":hover"],
			__source,
		},
		"bg-red": [
			{
				__scope: ".scope:hover",
				__rule: true,
				decls: {
					"background-color": ["red"],
				},
				__source,
				__context: [],
				__pseudo: [],
			},
		],
	})
})

test("processes multiple class names in the same rule", async () => {
	const result = await processCss(`
	  .bg-red,
	  .bg-red-again {
		background-color: red;
	  }
	`)
	expect(result.variants).toEqual({})
	expect(result.dictionary).toEqual({
		"bg-red": [
			{
				__rule: true,
				decls: {
					"background-color": ["red"],
				},
				__source,
				__context: [],
				__pseudo: [],
			},
		],
		"bg-red-again": [
			{
				__rule: true,
				decls: {
					"background-color": ["red"],
				},
				__source,
				__context: [],
				__pseudo: [],
			},
		],
	})
})

test("processes media queries", async () => {
	const result = await processCss(`
	  @media (min-width: 768px) {
		.bg-red {
		  background-color: red;
		}
	  }
	`)
	expect(result.variants).toEqual({})
	expect(result.dictionary).toEqual({
		"bg-red": [
			{
				__rule: true,
				decls: {
					"background-color": ["red"],
				},
				__source,
				__context: ["@media (min-width: 768px)"],
				__pseudo: [],
			},
		],
	})
})

test("processes nested at-rules", async () => {
	const result = await processCss(`
	  @supports (display: grid) {
		@media (min-width: 768px) {
		  .bg-red {
			background-color: red;
		  }
		}
	  }
	`)
	expect(result.variants).toEqual({})
	expect(result.dictionary).toEqual({
		"bg-red": [
			{
				__rule: true,
				decls: {
					"background-color": ["red"],
				},
				__source,
				__context: ["@supports (display: grid)", "@media (min-width: 768px)"],
				__pseudo: [],
			},
		],
	})
})

test("merges declarations", async () => {
	const result = await processCss(`
	  .bg-red {
		background-color: red;
	  }
	  .bg-red {
		color: white;
	  }
	`)
	expect(result.variants).toEqual({})
	expect(result.dictionary).toEqual({
		"bg-red": [
			{
				__rule: true,
				decls: {
					"background-color": ["red"],
				},
				__source,
				__context: [],
				__pseudo: [],
			},
			{
				__rule: true,
				decls: {
					color: ["white"],
				},
				__source,
				__context: [],
				__pseudo: [],
			},
		],
	})
})

test("processes multiple scopes for the same class name", async () => {
	const result = await processCss(`
	  .scope1 .bg-red {
		background-color: red;
	  }
	  .scope2 + .bg-red {
		background-color: red;
	  }
	  .scope3 > .bg-red {
		background-color: red;
	  }
	`)
	expect(result.variants).toEqual({})
	expect(result.dictionary).toEqual({
		scope1: { __context: [], __pseudo: [], __source },
		scope2: { __context: [], __pseudo: [], __source },
		scope3: { __context: [], __pseudo: [], __source },
		"bg-red": [
			{
				__scope: ".scope1",
				__rule: true,
				decls: {
					"background-color": ["red"],
				},
				__source,
				__context: [],
				__pseudo: [],
			},
			{
				__scope: ".scope2 +",
				__rule: true,
				decls: {
					"background-color": ["red"],
				},
				__source,
				__context: [],
				__pseudo: [],
			},
			{
				__scope: ".scope3 >",
				__rule: true,
				decls: {
					"background-color": ["red"],
				},
				__source,
				__context: [],
				__pseudo: [],
			},
		],
	})
})

test("processes multiple properties of the same name", async () => {
	const result = await processCss(`
	  .bg-red {
		background-color: blue;
		background-color: red;
	  }
	`)
	expect(result.variants).toEqual({})
	expect(result.dictionary).toEqual({
		"bg-red": [
			{
				__rule: true,
				decls: {
					"background-color": ["blue", "red"],
				},
				__source,
				__context: [],
				__pseudo: [],
			},
		],
	})
})
