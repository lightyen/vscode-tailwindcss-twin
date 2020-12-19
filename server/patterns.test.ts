import { canMatch, getPatterns } from "./patterns"

test("findClasses", async () => {
	const text = `aaa tw="    text-black     \t    "`
	const patterns = getPatterns("typescriptreact", true)
	let token = null
	for (const pattern of patterns) {
		const { type, lpat, rpat } = pattern
		const t = canMatch({ type, lpat, rpat, text, index: 10 })
		if (t) {
			token = t
		}
	}
	expect(token).toEqual([8, 32, "    text-black     \t    "])
})
