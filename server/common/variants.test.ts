import { spreadVariantGroups } from "./variants"

test("spreadVariantGroups 1", async () => {
	const input = `
	// comment
	flex
	/**
	 * block comment
	 * block comment
	 * block comment
	 */justify-center
	`
	expect(spreadVariantGroups(input)).toEqual(["flex", "justify-center"])
})

test("spreadVariantGroups 2", async () => {
	const input = `
	// comment
	flex
	md:( text-xl /* border-yellow-500 */ )
	2xl:( // #$%@#$ )
	color[red/* blue
					*/])
	justify-center
	`
	expect(spreadVariantGroups(input)).toEqual(["flex", "md:text-xl", "2xl:color[red]", "justify-center"])
})
