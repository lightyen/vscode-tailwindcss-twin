import { findClasses } from "./find"

test("findClasses", async () => {
	const text = `text-gray-100! md:dark:(hover:(text-gray-500 bg-white)) lg:(light:bg-black)`
	for (let index = 0; index < text.length; index += 1) {
		const result = findClasses({
			classes: text,
			separator: ":",
			index,
			handleBrackets: true,
			handleImportant: true,
		})
		expect(result.classList).toEqual([
			{
				token: [0, 13, "text-gray-100"],
				variants: [],
				inGroup: false,
				important: true,
			},
			{
				token: [31, 44, "text-gray-500"],
				inGroup: true,
				important: false,
				variants: [
					[15, 17, "md"],
					[18, 22, "dark"],
					[24, 29, "hover"],
				],
			},
			{
				token: [45, 53, "bg-white"],
				inGroup: true,
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
				inGroup: true,
				important: false,
			},
		])
	}
})

test("findClasses Selected", async () => {
	const text = `text-gray-100!  md:dark:(hover:(text-gray-500 bg-white)) lg:(light:bg-black)`
	const result = findClasses({
		classes: text,
		separator: ":",
		index: 15,
		handleBrackets: true,
		handleImportant: true,
	})
	expect(result.selection).toEqual({
		important: false,
		inGroup: false,
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
			handleBrackets: true,
			handleImportant: true,
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
			handleBrackets: true,
			handleImportant: true,
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
			handleBrackets: true,
			handleImportant: true,
		})
		expect(result.selection).toEqual({
			selected: [37, 50, "bg-purple-500"],
			important: true,
			inGroup: true,
			variants: [[33, 35, "lg"]],
		})
		expect(result.classList).toEqual([
			{
				token: [0, 13, "text-gray-100"],
				important: true,
				inGroup: false,
				variants: [],
			},
			{
				token: [23, 31, "bg-black"],
				important: true,
				inGroup: false,
				variants: [
					[15, 17, "md"],
					[18, 22, "dark"],
				],
			},
			{
				token: [37, 50, "bg-purple-500"],
				important: true,
				inGroup: true,
				variants: [[33, 35, "lg"]],
			},
			{
				token: [61, 68, "content"],
				important: false,
				inGroup: true,
				variants: [[53, 59, "before"]],
			},
		])
	}
})
