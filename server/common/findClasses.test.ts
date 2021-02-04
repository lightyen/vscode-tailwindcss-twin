import * as tw from "./types"
import findClasses from "./findClasses"

test("completion", async () => {
	const input = `lg:before:(content)  hover:(before:)`
	expect(
		findClasses({
			input,
			position: 18,
			completion: true,
		}),
	).toEqual({
		important: false,
		variants: [
			[0, 2, "lg"],
			[3, 9, "before"],
		],
		token: {
			kind: tw.TokenKind.ClassName,
			token: [11, 18, "content"],
		},
	})
	expect(
		findClasses({
			input,
			position: 20,
			completion: true,
		}),
	).toEqual({
		important: false,
		variants: [],
		token: undefined,
	})
	expect(
		findClasses({
			input,
			position: 35,
			completion: true,
		}),
	).toEqual({
		important: false,
		variants: [
			[21, 26, "hover"],
			[28, 34, "before"],
		],
		token: undefined,
	})
})

test("hover", async () => {
	const input = `md:text-gray-100!  md:dark:(hover:(text-gray-500 bg-white)!) lg:(light:bg-black) before:()!`
	expect(
		findClasses({
			input,
			position: 35,
		}),
	).toEqual({
		important: true,
		variants: [
			[19, 21, "md"],
			[22, 26, "dark"],
			[28, 33, "hover"],
		],
		token: {
			kind: tw.TokenKind.ClassName,
			token: [35, 48, "text-gray-500"],
		},
	})
	expect(
		findClasses({
			input,
			position: 89,
		}),
	).toEqual({
		token: undefined,
		important: false,
		variants: [],
	})
})

test("findClasses Important", async () => {
	const input = `text-gray-100! md:dark:bg-black! lg:(bg-purple-500!) before:(content)`
	for (let index = 0; index < input.length; index += 1) {
		const result = findClasses({
			input,
			position: 37,
		})
		expect(result).toEqual({
			token: {
				token: [37, 50, "bg-purple-500"],
				kind: tw.TokenKind.ClassName,
			},
			important: true,
			variants: [[33, 35, "lg"]],
		})
	}
})

test("completion on invalid input", async () => {
	let input = "   dark    bg-black  "
	let position = 8
	const completion = true
	let result = findClasses({
		input,
		position,
		completion,
	})
	expect(result.variants).toEqual([])
	expect(result.token).toEqual(undefined)

	position = 7
	result = findClasses({
		input,
		position,
		completion,
	})
	expect(result.variants).toEqual([])
	expect(result.token).toEqual({
		token: [3, 7, "dark"],
		kind: tw.TokenKind.ClassName,
	})

	input = "   dark:    bg-black  "
	position = 7
	result = findClasses({
		input,
		position,
		completion,
	})
	expect(result.variants).toEqual([])
	expect(result.token).toEqual(undefined)

	position = 8
	result = findClasses({
		input,
		position,
		completion,
	})
	expect(result.variants).toEqual([[3, 7, "dark"]])
	expect(result.token).toEqual(undefined)
})
