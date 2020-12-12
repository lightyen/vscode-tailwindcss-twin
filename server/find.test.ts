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
	const text = `text-gray-100! md:dark:(hover:(text-gray-500 bg-white)) focus:() lg:(light:bg-black)`
	for (let index = 0; index < text.length; index += 1) {
		const result = findClasses({
			classes: text,
			separator: ":",
			index,
			handleBrackets: true,
			handleImportant: true,
		})
		expect(result.empty).toEqual([[62, 64, [[56, 61, "focus"]]]])
	}
})
