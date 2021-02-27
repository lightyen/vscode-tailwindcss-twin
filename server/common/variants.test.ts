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
		w-1/5// test
		text-3xl/*comm*/
	)
	justify-center
	`
	expect(spreadVariantGroups(input)).toEqual(["flex", "md:text-xl", "lg:w-1/5", "lg:text-3xl", "justify-center"])
})

test("spreadVariantGroups 3", async () => {
	const input = `
	// comment
	flex
	md:( text-xl /* border-yellow-500 */ )
	2xl:( // #$%@#$ )
	color[/**/red/*dsd*/] )
	// comment
	flex
	md:( text-xl)
	lg:(
			flex
		text-5xl
			border-yellow-500
	)text-2xl/*sdf
	justify-center*/clear-left`
	expect(spreadVariantGroups(input)).toEqual([
		"flex",
		"md:text-xl",
		"2xl:color[red]",
		"flex",
		"md:text-xl",
		"lg:flex",
		"lg:text-5xl",
		"lg:border-yellow-500",
		"text-2xl",
		"clear-left",
	])
})
