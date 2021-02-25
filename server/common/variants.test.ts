import { spreadVariantGroups } from "./variants"

test("spreadVariantGroups", async () => {
	const input = `
	// comment
	flex

	/**
	 * multi comment
	 * multi comment
	 */justify-center
	`
	expect(spreadVariantGroups(input)).toEqual(["flex", "justify-center"])
})
