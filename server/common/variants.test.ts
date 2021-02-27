import { spreadVariantGroups } from "./variants"

test("spreadVariantGroups 0", async () => {
	const input = "sm:(inline-grid) flex flex-col justify-center space-y-5 group-active:bg-auto hover:(bg-black)"
	expect(spreadVariantGroups(input)).toEqual([
		"sm:inline-grid",
		"flex",
		"flex-col",
		"justify-center",
		"space-y-5",
		"group-active:bg-auto",
		"hover:bg-black",
	])
})
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
	lg:(
		// test
		w-1/5
	)
	justify-center
	`
	expect(spreadVariantGroups(input)).toEqual(["flex", "md:text-xl", "lg:w-1/5", "justify-center"])
})

test("spreadVariantGroups 3", async () => {
	const input = `
	// comment
	flex
	md:( text-xl /* border-yellow-500 */ )
	2xl:( // #$%@#$ )
	color[/**/red/*dsd*/] )
	justify-center`
	expect(spreadVariantGroups(input)).toEqual(["flex", "md:text-xl", "2xl:color[red]", "justify-center"])
})
