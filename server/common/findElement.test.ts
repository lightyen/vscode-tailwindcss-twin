import { completeElement, hoverElement } from "./findElement"
import * as tw from "./twin"

test("hover", async () => {
	const input = `lg:var:class-name! lg:(var:(prop[value])!) !`
	for (let position = 0; position < input.length; position++) {
		const hover = hoverElement({ input, position })
		switch (position) {
			case 0:
				expect(hover).toEqual({
					token: { kind: tw.TokenKind.Variant, token: [0, 2, "lg"] },
					variants: [],
					important: false,
				})
				break
			case 1:
				expect(hover).toEqual({
					token: { kind: tw.TokenKind.Variant, token: [0, 2, "lg"] },
					variants: [],
					important: false,
				})
				break
			case 2:
				expect(hover).toEqual({ important: false, variants: [[0, 2, "lg"]] })
				break
			case 3:
				expect(hover).toEqual({
					token: { kind: tw.TokenKind.Variant, token: [3, 6, "var"] },
					variants: [[0, 2, "lg"]],
					important: false,
				})
				break
			case 4:
				expect(hover).toEqual({
					token: { kind: tw.TokenKind.Variant, token: [3, 6, "var"] },
					variants: [[0, 2, "lg"]],
					important: false,
				})
				break
			case 5:
				expect(hover).toEqual({
					token: { kind: tw.TokenKind.Variant, token: [3, 6, "var"] },
					variants: [[0, 2, "lg"]],
					important: false,
				})
				break
			case 6:
				expect(hover).toEqual({
					important: false,
					variants: [
						[0, 2, "lg"],
						[3, 6, "var"],
					],
				})
				break
			case 7:
				expect(hover).toEqual({
					token: { kind: tw.TokenKind.ClassName, token: [7, 17, "class-name"] },
					variants: [
						[0, 2, "lg"],
						[3, 6, "var"],
					],
					important: true,
				})
				break
			case 8:
				expect(hover).toEqual({
					token: { kind: tw.TokenKind.ClassName, token: [7, 17, "class-name"] },
					variants: [
						[0, 2, "lg"],
						[3, 6, "var"],
					],
					important: true,
				})
				break
			case 9:
				expect(hover).toEqual({
					token: { kind: tw.TokenKind.ClassName, token: [7, 17, "class-name"] },
					variants: [
						[0, 2, "lg"],
						[3, 6, "var"],
					],
					important: true,
				})
				break
			case 10:
				expect(hover).toEqual({
					token: { kind: tw.TokenKind.ClassName, token: [7, 17, "class-name"] },
					variants: [
						[0, 2, "lg"],
						[3, 6, "var"],
					],
					important: true,
				})
				break
			case 11:
				expect(hover).toEqual({
					token: { kind: tw.TokenKind.ClassName, token: [7, 17, "class-name"] },
					variants: [
						[0, 2, "lg"],
						[3, 6, "var"],
					],
					important: true,
				})
				break
			case 12:
				expect(hover).toEqual({
					token: { kind: tw.TokenKind.ClassName, token: [7, 17, "class-name"] },
					variants: [
						[0, 2, "lg"],
						[3, 6, "var"],
					],
					important: true,
				})
				break
			case 13:
				expect(hover).toEqual({
					token: { kind: tw.TokenKind.ClassName, token: [7, 17, "class-name"] },
					variants: [
						[0, 2, "lg"],
						[3, 6, "var"],
					],
					important: true,
				})
				break
			case 14:
				expect(hover).toEqual({
					token: { kind: tw.TokenKind.ClassName, token: [7, 17, "class-name"] },
					variants: [
						[0, 2, "lg"],
						[3, 6, "var"],
					],
					important: true,
				})
				break
			case 15:
				expect(hover).toEqual({
					token: { kind: tw.TokenKind.ClassName, token: [7, 17, "class-name"] },
					variants: [
						[0, 2, "lg"],
						[3, 6, "var"],
					],
					important: true,
				})
				break
			case 16:
				expect(hover).toEqual({
					token: { kind: tw.TokenKind.ClassName, token: [7, 17, "class-name"] },
					variants: [
						[0, 2, "lg"],
						[3, 6, "var"],
					],
					important: true,
				})
				break
			case 17:
				expect(hover).toEqual({ important: false, variants: [] })
				break
			case 19:
				expect(hover).toEqual({
					token: { kind: tw.TokenKind.Variant, token: [19, 21, "lg"] },
					variants: [],
					important: false,
				})
				break
			case 20:
				expect(hover).toEqual({
					token: { kind: tw.TokenKind.Variant, token: [19, 21, "lg"] },
					variants: [],
					important: false,
				})
				break
			case 21:
				expect(hover).toEqual({ important: false, variants: [[19, 21, "lg"]] })
				break
			case 22:
				expect(hover).toEqual({ important: false, variants: [[19, 21, "lg"]] })
				break
			case 23:
				expect(hover).toEqual({
					token: { kind: tw.TokenKind.Variant, token: [23, 26, "var"] },
					variants: [[19, 21, "lg"]],
					important: false,
				})
				break
			case 24:
				expect(hover).toEqual({
					token: { kind: tw.TokenKind.Variant, token: [23, 26, "var"] },
					variants: [[19, 21, "lg"]],
					important: false,
				})
				break
			case 25:
				expect(hover).toEqual({
					token: { kind: tw.TokenKind.Variant, token: [23, 26, "var"] },
					variants: [[19, 21, "lg"]],
					important: false,
				})
				break
			case 26:
				expect(hover).toEqual({
					important: false,
					variants: [
						[19, 21, "lg"],
						[23, 26, "var"],
					],
				})
				break
			case 27:
				expect(hover).toEqual({
					important: true,
					variants: [
						[19, 21, "lg"],
						[23, 26, "var"],
					],
				})
				break
			case 28:
				expect(hover).toEqual({
					token: {
						kind: tw.TokenKind.CssProperty,
						token: [28, 39, "prop[value]"],
						key: [28, 32, "prop"],
						value: [33, 38, "value"],
					},
					variants: [
						[19, 21, "lg"],
						[23, 26, "var"],
					],
					important: true,
				})
				break
			case 29:
				expect(hover).toEqual({
					token: {
						kind: tw.TokenKind.CssProperty,
						token: [28, 39, "prop[value]"],
						key: [28, 32, "prop"],
						value: [33, 38, "value"],
					},
					variants: [
						[19, 21, "lg"],
						[23, 26, "var"],
					],
					important: true,
				})
				break
			case 30:
				expect(hover).toEqual({
					token: {
						kind: tw.TokenKind.CssProperty,
						token: [28, 39, "prop[value]"],
						key: [28, 32, "prop"],
						value: [33, 38, "value"],
					},
					variants: [
						[19, 21, "lg"],
						[23, 26, "var"],
					],
					important: true,
				})
				break
			case 31:
				expect(hover).toEqual({
					token: {
						kind: tw.TokenKind.CssProperty,
						token: [28, 39, "prop[value]"],
						key: [28, 32, "prop"],
						value: [33, 38, "value"],
					},
					variants: [
						[19, 21, "lg"],
						[23, 26, "var"],
					],
					important: true,
				})
				break
			case 32:
				expect(hover).toEqual({
					token: {
						kind: tw.TokenKind.CssProperty,
						token: [28, 39, "prop[value]"],
						key: [28, 32, "prop"],
						value: [33, 38, "value"],
					},
					variants: [
						[19, 21, "lg"],
						[23, 26, "var"],
					],
					important: true,
				})
				break
			case 33:
				expect(hover).toEqual({
					token: {
						kind: tw.TokenKind.CssProperty,
						token: [28, 39, "prop[value]"],
						key: [28, 32, "prop"],
						value: [33, 38, "value"],
					},
					variants: [
						[19, 21, "lg"],
						[23, 26, "var"],
					],
					important: true,
				})
				break
			case 34:
				expect(hover).toEqual({
					token: {
						kind: tw.TokenKind.CssProperty,
						token: [28, 39, "prop[value]"],
						key: [28, 32, "prop"],
						value: [33, 38, "value"],
					},
					variants: [
						[19, 21, "lg"],
						[23, 26, "var"],
					],
					important: true,
				})
				break
			case 35:
				expect(hover).toEqual({
					token: {
						kind: tw.TokenKind.CssProperty,
						token: [28, 39, "prop[value]"],
						key: [28, 32, "prop"],
						value: [33, 38, "value"],
					},
					variants: [
						[19, 21, "lg"],
						[23, 26, "var"],
					],
					important: true,
				})
				break
			case 36:
				expect(hover).toEqual({
					token: {
						kind: tw.TokenKind.CssProperty,
						token: [28, 39, "prop[value]"],
						key: [28, 32, "prop"],
						value: [33, 38, "value"],
					},
					variants: [
						[19, 21, "lg"],
						[23, 26, "var"],
					],
					important: true,
				})
				break
			case 37:
				expect(hover).toEqual({
					token: {
						kind: tw.TokenKind.CssProperty,
						token: [28, 39, "prop[value]"],
						key: [28, 32, "prop"],
						value: [33, 38, "value"],
					},
					variants: [
						[19, 21, "lg"],
						[23, 26, "var"],
					],
					important: true,
				})
				break
			case 38:
				expect(hover).toEqual({
					token: {
						kind: tw.TokenKind.CssProperty,
						token: [28, 39, "prop[value]"],
						key: [28, 32, "prop"],
						value: [33, 38, "value"],
					},
					variants: [
						[19, 21, "lg"],
						[23, 26, "var"],
					],
					important: true,
				})
				break
			case 39:
				expect(hover).toEqual({
					important: true,
					variants: [
						[19, 21, "lg"],
						[23, 26, "var"],
					],
				})
				break
			case 40:
				expect(hover).toEqual({ important: false, variants: [[19, 21, "lg"]] })
				break
			case 41:
				expect(hover).toEqual({ important: false, variants: [[19, 21, "lg"]] })
				break
			case 43:
				expect(hover).toEqual({
					token: {
						kind: tw.TokenKind.Unknown,
						token: [43, 44, "!"],
					},
					important: false,
					variants: [],
				})
				break
			default:
				expect(hover).toEqual({ important: false, variants: [] })
		}
	}
})

test("completion", async () => {
	const input = `lg:var:class-name! lg:(var:(prop[value])!) ! (t)`
	for (let position = 0; position <= input.length; position++) {
		const completion = completeElement({ input, position })
		switch (position) {
			case 0:
				expect(completion).toEqual({
					token: { kind: tw.TokenKind.Variant, token: [0, 3, "lg:"] },
					variants: [],
					important: false,
				})
				break
			case 1:
				expect(completion).toEqual({
					token: { kind: tw.TokenKind.Variant, token: [0, 3, "lg:"] },
					variants: [],
					important: false,
				})
				break
			case 2:
				expect(completion).toEqual({
					token: { kind: tw.TokenKind.Variant, token: [0, 3, "lg:"] },
					important: false,
					variants: [],
				})
				break
			case 3:
				expect(completion).toEqual({
					token: { kind: tw.TokenKind.Variant, token: [0, 3, "lg:"] },
					variants: [[0, 2, "lg"]],
					important: false,
				})
				break
			case 4:
				expect(completion).toEqual({
					token: { kind: tw.TokenKind.Variant, token: [3, 7, "var:"] },
					variants: [[0, 2, "lg"]],
					important: false,
				})
				break
			case 5:
				expect(completion).toEqual({
					token: { kind: tw.TokenKind.Variant, token: [3, 7, "var:"] },
					variants: [[0, 2, "lg"]],
					important: false,
				})
				break
			case 6:
				expect(completion).toEqual({
					token: { kind: tw.TokenKind.Variant, token: [3, 7, "var:"] },
					important: false,
					variants: [[0, 2, "lg"]],
				})
				break
			case 7:
				expect(completion).toEqual({
					token: { kind: tw.TokenKind.Variant, token: [3, 7, "var:"] },
					variants: [
						[0, 2, "lg"],
						[3, 6, "var"],
					],
					important: false,
				})
				break
			case 8:
				expect(completion).toEqual({
					token: { kind: tw.TokenKind.ClassName, token: [7, 17, "class-name"] },
					variants: [
						[0, 2, "lg"],
						[3, 6, "var"],
					],
					important: true,
				})
				break
			case 9:
				expect(completion).toEqual({
					token: { kind: tw.TokenKind.ClassName, token: [7, 17, "class-name"] },
					variants: [
						[0, 2, "lg"],
						[3, 6, "var"],
					],
					important: true,
				})
				break
			case 10:
				expect(completion).toEqual({
					token: { kind: tw.TokenKind.ClassName, token: [7, 17, "class-name"] },
					variants: [
						[0, 2, "lg"],
						[3, 6, "var"],
					],
					important: true,
				})
				break
			case 11:
				expect(completion).toEqual({
					token: { kind: tw.TokenKind.ClassName, token: [7, 17, "class-name"] },
					variants: [
						[0, 2, "lg"],
						[3, 6, "var"],
					],
					important: true,
				})
				break
			case 12:
				expect(completion).toEqual({
					token: { kind: tw.TokenKind.ClassName, token: [7, 17, "class-name"] },
					variants: [
						[0, 2, "lg"],
						[3, 6, "var"],
					],
					important: true,
				})
				break
			case 13:
				expect(completion).toEqual({
					token: { kind: tw.TokenKind.ClassName, token: [7, 17, "class-name"] },
					variants: [
						[0, 2, "lg"],
						[3, 6, "var"],
					],
					important: true,
				})
				break
			case 14:
				expect(completion).toEqual({
					token: { kind: tw.TokenKind.ClassName, token: [7, 17, "class-name"] },
					variants: [
						[0, 2, "lg"],
						[3, 6, "var"],
					],
					important: true,
				})
				break
			case 15:
				expect(completion).toEqual({
					token: { kind: tw.TokenKind.ClassName, token: [7, 17, "class-name"] },
					variants: [
						[0, 2, "lg"],
						[3, 6, "var"],
					],
					important: true,
				})
				break
			case 16:
				expect(completion).toEqual({
					token: { kind: tw.TokenKind.ClassName, token: [7, 17, "class-name"] },
					variants: [
						[0, 2, "lg"],
						[3, 6, "var"],
					],
					important: true,
				})
				break
			case 17:
				expect(completion).toEqual({
					token: { kind: tw.TokenKind.ClassName, token: [7, 17, "class-name"] },
					variants: [
						[0, 2, "lg"],
						[3, 6, "var"],
					],
					important: true,
				})
				break
			case 18:
				expect(completion).toEqual({ important: false, variants: [] })
				break
			case 19:
				expect(completion).toEqual({
					token: { kind: tw.TokenKind.Variant, token: [19, 22, "lg:"] },
					variants: [],
					important: false,
				})
				break
			case 20:
				expect(completion).toEqual({
					token: { kind: tw.TokenKind.Variant, token: [19, 22, "lg:"] },
					variants: [],
					important: false,
				})
				break
			case 21:
				expect(completion).toEqual({
					token: { kind: tw.TokenKind.Variant, token: [19, 22, "lg:"] },
					important: false,
					variants: [],
				})
				break
			case 22:
				expect(completion).toEqual({
					token: { kind: tw.TokenKind.Variant, token: [19, 22, "lg:"] },
					important: false,
					variants: [[19, 21, "lg"]],
				})
				break
			case 23:
				expect(completion).toEqual({
					token: { kind: tw.TokenKind.Variant, token: [23, 27, "var:"] },
					variants: [[19, 21, "lg"]],
					important: false,
				})
				break
			case 24:
				expect(completion).toEqual({
					token: { kind: tw.TokenKind.Variant, token: [23, 27, "var:"] },
					variants: [[19, 21, "lg"]],
					important: false,
				})
				break
			case 25:
				expect(completion).toEqual({
					token: { kind: tw.TokenKind.Variant, token: [23, 27, "var:"] },
					variants: [[19, 21, "lg"]],
					important: false,
				})
				break
			case 26:
				expect(completion).toEqual({
					token: { kind: tw.TokenKind.Variant, token: [23, 27, "var:"] },
					important: false,
					variants: [[19, 21, "lg"]],
				})
				break
			case 27:
				expect(completion).toEqual({
					token: { kind: tw.TokenKind.Variant, token: [23, 27, "var:"] },
					important: false,
					variants: [
						[19, 21, "lg"],
						[23, 26, "var"],
					],
				})
				break
			case 28:
				expect(completion).toEqual({
					token: {
						kind: tw.TokenKind.CssProperty,
						token: [28, 39, "prop[value]"],
						key: [28, 32, "prop"],
						value: [33, 38, "value"],
					},
					variants: [
						[19, 21, "lg"],
						[23, 26, "var"],
					],
					important: true,
				})
				break
			case 29:
				expect(completion).toEqual({
					token: {
						kind: tw.TokenKind.CssProperty,
						token: [28, 39, "prop[value]"],
						key: [28, 32, "prop"],
						value: [33, 38, "value"],
					},
					variants: [
						[19, 21, "lg"],
						[23, 26, "var"],
					],
					important: true,
				})
				break
			case 30:
				expect(completion).toEqual({
					token: {
						kind: tw.TokenKind.CssProperty,
						token: [28, 39, "prop[value]"],
						key: [28, 32, "prop"],
						value: [33, 38, "value"],
					},
					variants: [
						[19, 21, "lg"],
						[23, 26, "var"],
					],
					important: true,
				})
				break
			case 31:
				expect(completion).toEqual({
					token: {
						kind: tw.TokenKind.CssProperty,
						token: [28, 39, "prop[value]"],
						key: [28, 32, "prop"],
						value: [33, 38, "value"],
					},
					variants: [
						[19, 21, "lg"],
						[23, 26, "var"],
					],
					important: true,
				})
				break
			case 32:
				expect(completion).toEqual({
					token: {
						kind: tw.TokenKind.CssProperty,
						token: [28, 39, "prop[value]"],
						key: [28, 32, "prop"],
						value: [33, 38, "value"],
					},
					variants: [
						[19, 21, "lg"],
						[23, 26, "var"],
					],
					important: true,
				})
				break
			case 33:
				expect(completion).toEqual({
					token: {
						kind: tw.TokenKind.CssProperty,
						token: [28, 39, "prop[value]"],
						key: [28, 32, "prop"],
						value: [33, 38, "value"],
					},
					variants: [
						[19, 21, "lg"],
						[23, 26, "var"],
					],
					important: true,
				})
				break
			case 34:
				expect(completion).toEqual({
					token: {
						kind: tw.TokenKind.CssProperty,
						token: [28, 39, "prop[value]"],
						key: [28, 32, "prop"],
						value: [33, 38, "value"],
					},
					variants: [
						[19, 21, "lg"],
						[23, 26, "var"],
					],
					important: true,
				})
				break
			case 35:
				expect(completion).toEqual({
					token: {
						kind: tw.TokenKind.CssProperty,
						token: [28, 39, "prop[value]"],
						key: [28, 32, "prop"],
						value: [33, 38, "value"],
					},
					variants: [
						[19, 21, "lg"],
						[23, 26, "var"],
					],
					important: true,
				})
				break
			case 36:
				expect(completion).toEqual({
					token: {
						kind: tw.TokenKind.CssProperty,
						token: [28, 39, "prop[value]"],
						key: [28, 32, "prop"],
						value: [33, 38, "value"],
					},
					variants: [
						[19, 21, "lg"],
						[23, 26, "var"],
					],
					important: true,
				})
				break
			case 37:
				expect(completion).toEqual({
					token: {
						kind: tw.TokenKind.CssProperty,
						token: [28, 39, "prop[value]"],
						key: [28, 32, "prop"],
						value: [33, 38, "value"],
					},
					variants: [
						[19, 21, "lg"],
						[23, 26, "var"],
					],
					important: true,
				})
				break
			case 38:
				expect(completion).toEqual({
					token: {
						kind: tw.TokenKind.CssProperty,
						token: [28, 39, "prop[value]"],
						key: [28, 32, "prop"],
						value: [33, 38, "value"],
					},
					variants: [
						[19, 21, "lg"],
						[23, 26, "var"],
					],
					important: true,
				})
				break
			case 39:
				expect(completion).toEqual({
					token: {
						kind: tw.TokenKind.CssProperty,
						token: [28, 39, "prop[value]"],
						key: [28, 32, "prop"],
						value: [33, 38, "value"],
					},
					important: true,
					variants: [
						[19, 21, "lg"],
						[23, 26, "var"],
					],
				})
				break
			case 40:
				expect(completion).toEqual({ important: false, variants: [[19, 21, "lg"]] })
				break
			case 41:
				expect(completion).toEqual({ important: false, variants: [[19, 21, "lg"]] })
				break
			case 43:
				expect(completion).toEqual({
					token: { token: [43, 44, "!"], kind: tw.TokenKind.Unknown },
					important: false,
					variants: [],
				})
				break
			case 44:
				expect(completion).toEqual({
					token: { token: [43, 44, "!"], kind: tw.TokenKind.Unknown },
					important: false,
					variants: [],
				})
				break
			case 45:
				expect(completion).toEqual({
					token: { token: [45, 48, "(t)"], kind: tw.TokenKind.VariantsGroup },
					important: false,
					variants: [],
				})
				break
			case 46:
				expect(completion).toEqual({
					token: { token: [46, 47, "t"], kind: tw.TokenKind.ClassName },
					important: false,
					variants: [],
				})
				break
			case 47:
				expect(completion).toEqual({
					token: { token: [46, 47, "t"], kind: tw.TokenKind.ClassName },
					important: false,
					variants: [],
				})
				break
			default:
				expect(completion).toEqual({ important: false, variants: [] })
				break
		}
	}
})

test("hover Important", async () => {
	const input = `text-gray-100! md:dark:bg-black! lg:(bg-purple-500!) before:(content)`
	for (let index = 0; index < input.length; index += 1) {
		const result = hoverElement({
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
	let result = completeElement({
		input,
		position,
	})
	expect(result.variants).toEqual([])
	expect(result.token).toEqual(undefined)

	position = 7
	result = completeElement({
		input,
		position,
	})
	expect(result.variants).toEqual([])
	expect(result.token).toEqual({
		token: [3, 7, "dark"],
		kind: tw.TokenKind.ClassName,
	})

	input = "   dark:    bg-black  "
	position = 7
	result = completeElement({
		input,
		position,
	})
	expect(result.variants).toEqual([])
	expect(result.token).toEqual({
		kind: tw.TokenKind.Variant,
		token: [3, 8, "dark:"],
	})

	position = 8
	result = completeElement({
		input,
		position,
	})
	expect(result.variants).toEqual([[3, 7, "dark"]])
	expect(result.token).toEqual({
		kind: tw.TokenKind.Variant,
		token: [3, 8, "dark:"],
	})
})

test("completion2", async () => {
	expect(completeElement({ input: `lg:var:`, position: 7 })).toEqual({
		variants: [
			[0, 2, "lg"],
			[3, 6, "var"],
		],
		important: false,
		token: {
			kind: tw.TokenKind.Variant,
			token: [3, 7, "var:"],
		},
	})
	expect(completeElement({ input: `(var:)`, position: 5 })).toEqual({
		variants: [[1, 4, "var"]],
		important: false,
		token: {
			kind: tw.TokenKind.Variant,
			token: [1, 5, "var:"],
		},
	})
})
