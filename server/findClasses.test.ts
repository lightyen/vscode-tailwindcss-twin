import findClasses, { toClassNames } from "./findClasses"

test("seprate", async () => {
	const input = "  text-gray-100! md:dark:(hover:(text-gray-500 bg-white!)) lg:(light:bg-black) "
	const output = toClassNames(findClasses({ input }))
	expect(output).toEqual([
		"text-gray-100!",
		"md:dark:hover:text-gray-500",
		"md:dark:hover:bg-white!",
		"lg:light:bg-black",
	])
})

test("findClasses", async () => {
	const input = `text-gray-100! md:dark:(hover:(text-gray-500 bg-white)) lg:(light:bg-black) ((flex text-center)))))!`
	for (let position = 0; position < input.length; position += 1) {
		const result = findClasses({
			input,
			position,
		})
		expect(result.classList).toEqual([
			{
				token: [0, 13, "text-gray-100"],
				variants: [],
				important: true,
			},
			{
				token: [31, 44, "text-gray-500"],
				important: false,
				variants: [
					[15, 17, "md"],
					[18, 22, "dark"],
					[24, 29, "hover"],
				],
			},
			{
				token: [45, 53, "bg-white"],
				important: false,
				variants: [
					[15, 17, "md"],
					[18, 22, "dark"],
					[24, 29, "hover"],
				],
			},
			{
				token: [66, 74, "bg-black"],
				variants: [
					[56, 58, "lg"],
					[60, 65, "light"],
				],
				important: false,
			},
			{
				token: [78, 82, "flex"],
				variants: [],
				important: false,
			},
			{
				token: [83, 94, "text-center"],
				variants: [],
				important: false,
			},
			{
				token: [96, 100, ")))!"],
				variants: [],
				important: false,
			},
		])
	}
})

test("findClasses Selected", async () => {
	const input = `md:text-gray-100!  md:dark:(hover:(text-gray-500 bg-white)) lg:(light:bg-black) before:()`
	expect(
		findClasses({
			input,
			position: 35,
			greedy: false,
		}).selection,
	).toEqual({
		important: false,
		selected: [35, 48, "text-gray-500"],
		variants: [
			[19, 21, "md"],
			[22, 26, "dark"],
			[28, 33, "hover"],
		],
	})
	expect(
		findClasses({
			input,
			position: 88,
			greedy: false,
		}).selection,
	).toEqual({
		important: false,
		selected: null,
		variants: [[80, 86, "before"]],
	})
})

test("findClasses Empty", async () => {
	const input = `text-gray-100! lg:() md: md:dark:(hover:(text-gray-500 bg-white)) focus:( ) lg:(light:bg-black)`
	for (let position = 0; position < input.length; position += 1) {
		const result = findClasses({
			input,
			separator: ":",
			position,
		})
		expect(result.empty).toEqual([
			[18, 20, [[15, 17, "lg"]]],
			[24, 25, [[21, 23, "md"]]],
			[72, 75, [[66, 71, "focus"]]],
		])
	}

	const text2 = `bg-gradient-to-b before:content before:text-blue-50 md:  `
	for (let position = 0; position < text2.length; position += 1) {
		const result = findClasses({
			input: text2,
			separator: ":",
			position,
		})
		expect(result.empty).toEqual([[55, 56, [[52, 54, "md"]]]])
	}
})

test("findClasses Important", async () => {
	const input = `text-gray-100! md:dark:bg-black! lg:(bg-purple-500!) before:(content)`
	for (let index = 0; index < input.length; index += 1) {
		const result = findClasses({
			input,
			separator: ":",
			position: 37,
		})
		expect(result.selection).toEqual({
			selected: [37, 50, "bg-purple-500"],
			important: true,
			variants: [[33, 35, "lg"]],
		})
		expect(result.classList).toEqual([
			{
				token: [0, 13, "text-gray-100"],
				important: true,
				variants: [],
			},
			{
				token: [23, 31, "bg-black"],
				important: true,
				variants: [
					[15, 17, "md"],
					[18, 22, "dark"],
				],
			},
			{
				token: [37, 50, "bg-purple-500"],
				important: true,
				variants: [[33, 35, "lg"]],
			},
			{
				token: [61, 68, "content"],
				important: false,
				variants: [[53, 59, "before"]],
			},
		])
	}
})

test("find on invalid input", async () => {
	let input = "   dark    bg-black  "
	let position = 8
	let result = findClasses({
		input,
		position,
	})
	expect(result.selection.variants).toEqual([])
	expect(result.selection.selected).toEqual(null)

	position = 7
	result = findClasses({
		input,
		position,
	})
	expect(result.selection.variants).toEqual([])
	expect(result.selection.selected).toEqual([3, 7, "dark"])

	input = "   dark:    bg-black  "
	position = 7
	result = findClasses({
		input,
		position,
	})
	expect(result.selection.variants).toEqual([])
	expect(result.selection.selected).toEqual(null)

	position = 8
	result = findClasses({
		input,
		position,
	})
	expect(result.selection.variants).toEqual([[3, 7, "dark"]])
	expect(result.selection.selected).toEqual(null)
})
