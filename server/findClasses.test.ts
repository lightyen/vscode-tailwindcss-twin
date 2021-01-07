import findClasses from "./findClasses"

test("findClasses", async () => {
	const text = `text-gray-100! md:dark:(hover:(text-gray-500 bg-white)) lg:(light:bg-black)`
	for (let index = 0; index < text.length; index += 1) {
		const result = findClasses({
			classes: text,
			index,
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
		])
	}
})

test("findClasses Selected", async () => {
	const text = `md:text-gray-100!  md:dark:(hover:(text-gray-500 bg-white)) lg:(light:bg-black)`
	const result = findClasses({
		classes: text,
		separator: ":",
		index: 18,
	})
	expect(result.selection).toEqual({
		important: false,
		selected: null,
		variants: [],
	})
})

test("findClasses Empty", async () => {
	const text = `text-gray-100! lg:() md: md:dark:(hover:(text-gray-500 bg-white)) focus:( ) lg:(light:bg-black)`
	for (let index = 0; index < text.length; index += 1) {
		const result = findClasses({
			classes: text,
			separator: ":",
			index,
		})
		expect(result.empty).toEqual([
			[18, 20, [[15, 17, "lg"]]],
			[24, 25, [[21, 23, "md"]]],
			[72, 75, [[66, 71, "focus"]]],
		])
	}

	const text2 = `bg-gradient-to-b before:content before:text-blue-50 md:  `
	for (let index = 0; index < text2.length; index += 1) {
		const result = findClasses({
			classes: text2,
			separator: ":",
			index,
		})
		expect(result.empty).toEqual([[55, 56, [[52, 54, "md"]]]])
	}
})

test("findClasses Important", async () => {
	const text = `text-gray-100! md:dark:bg-black! lg:(bg-purple-500!) before:(content)`
	for (let index = 0; index < text.length; index += 1) {
		const result = findClasses({
			classes: text,
			separator: ":",
			index: 37,
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
	let classes = "   dark    bg-black  "
	let index = 8
	let result = findClasses({
		classes,
		index,
		separator: ":",
	})
	expect(result.selection.variants).toEqual([])
	expect(result.selection.selected).toEqual(null)

	index = 7
	result = findClasses({
		classes,
		index,
		separator: ":",
	})
	expect(result.selection.variants).toEqual([])
	expect(result.selection.selected).toEqual([3, 7, "dark"])

	classes = "   dark:    bg-black  "
	index = 7
	result = findClasses({
		classes,
		index,
		separator: ":",
	})
	expect(result.selection.variants).toEqual([])
	expect(result.selection.selected).toEqual(null)

	index = 8
	result = findClasses({
		classes,
		index,
		separator: ":",
	})
	expect(result.selection.variants).toEqual([[3, 7, "dark"]])
	expect(result.selection.selected).toEqual(null)
})
