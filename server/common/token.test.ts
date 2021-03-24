import * as tw from "./token"

test("Token trim", async () => {
	const token = tw.createToken(10, 20, "  abcdef  ")
	expect(token.trim()).toEqual([12, 18, "abcdef"])
})
