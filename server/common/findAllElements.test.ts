import findAllElements from "./findAllElements"
import * as tw from "./twin"

test("findAllElements", async () => {
	const input = `text-gray-100! md:dark:(hover:(text-gray-500 bg-white)) lg:(light:bg-black) ((flex text-center)))))! hover:(maxWidth[100%]!)`
	const result = findAllElements({ input })
	expect(result.elementList).toEqual([
		{
			token: [0, 13, "text-gray-100"],
			variants: [],
			important: true,
			kind: tw.TokenKind.ClassName,
		},
		{
			token: [31, 44, "text-gray-500"],
			important: false,
			variants: [
				[15, 17, "md"],
				[18, 22, "dark"],
				[24, 29, "hover"],
			],
			kind: tw.TokenKind.ClassName,
		},
		{
			token: [45, 53, "bg-white"],
			important: false,
			variants: [
				[15, 17, "md"],
				[18, 22, "dark"],
				[24, 29, "hover"],
			],
			kind: tw.TokenKind.ClassName,
		},
		{
			token: [66, 74, "bg-black"],
			variants: [
				[56, 58, "lg"],
				[60, 65, "light"],
			],
			important: false,
			kind: tw.TokenKind.ClassName,
		},
		{
			token: [78, 82, "flex"],
			variants: [],
			important: false,
			kind: tw.TokenKind.ClassName,
		},
		{
			token: [83, 94, "text-center"],
			variants: [],
			important: false,
			kind: tw.TokenKind.ClassName,
		},
		{
			token: [96, 100, ")))!"],
			variants: [],
			important: false,
			kind: tw.TokenKind.Unknown,
		},
		{
			token: [108, 122, "maxWidth[100%]"],
			variants: [[101, 106, "hover"]],
			prop: [108, 116, "maxWidth"],
			value: [117, 121, "100%"],
			important: true,
			kind: tw.TokenKind.CssProperty,
		},
	])
})

test("findAllElements EmptyList", async () => {
	const input = `text-gray-100! lg:() md: md:dark:(hover:(text-gray-500 bg-white)) focus:( )! lg:(light:bg-black)`
	expect(findAllElements({ input }).emptyList).toEqual([
		{
			kind: tw.EmptyKind.Group,
			start: 18,
			end: 20,
			variants: [[15, 17, "lg"]],
			important: false,
		},
		{
			kind: tw.EmptyKind.Classname,
			start: 24,
			variants: [[21, 23, "md"]],
		},
		{
			kind: tw.EmptyKind.Group,
			start: 72,
			end: 75,
			variants: [[66, 71, "focus"]],
			important: true,
		},
	])

	const text2 = `bg-gradient-to-b before:content before:text-blue-50 md:`
	expect(findAllElements({ input: text2 }).emptyList).toEqual([
		{
			kind: tw.EmptyKind.Classname,
			start: 55,
			variants: [[52, 54, "md"]],
		},
	])
})

test("findAllElements Important", async () => {
	const input = `text-gray-100! md:dark:bg-black! lg:(bg-purple-500!) before:(content)`
	const result = findAllElements({ input })
	expect(result.elementList).toEqual([
		{
			token: [0, 13, "text-gray-100"],
			important: true,
			variants: [],
			kind: tw.TokenKind.ClassName,
		},
		{
			token: [23, 31, "bg-black"],
			important: true,
			variants: [
				[15, 17, "md"],
				[18, 22, "dark"],
			],
			kind: tw.TokenKind.ClassName,
		},
		{
			token: [37, 50, "bg-purple-500"],
			important: true,
			variants: [[33, 35, "lg"]],
			kind: tw.TokenKind.ClassName,
		},
		{
			token: [61, 68, "content"],
			important: false,
			variants: [[53, 59, "before"]],
			kind: tw.TokenKind.ClassName,
		},
	])
})

test("spread", async () => {
	const input = "  text-gray-100! md:dark:(hover:(text-gray-500 bg-white!)) lg:(light:bg-black) "
	const output = findAllElements({ input }).elementList.texts
	expect(output).toEqual([
		"text-gray-100!",
		"md:dark:hover:text-gray-500",
		"md:dark:hover:bg-white!",
		"lg:light:bg-black",
	])
})

test("texts", async () => {
	const input = `bg-gradient-to-b from-electric to-ribbon (
		scale-0
		bg-blue-300  color[red] clip-path[ ] lg:()`
	const output = findAllElements({ input })
	expect(output.elementList.texts).toEqual([
		"bg-gradient-to-b",
		"from-electric",
		"to-ribbon",
		"scale-0",
		"bg-blue-300",
		"color[red]",
		"clip-path[ ]",
	])
	expect(output.emptyList.texts).toEqual(["clip-path[]", "lg:()"])
})
