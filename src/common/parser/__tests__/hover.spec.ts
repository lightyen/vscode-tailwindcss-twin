import { NodeType } from ".."
import { hover } from "../hover"

it("parser util hover", () => {
	const code = `bg-gray-500 padding[ 3rem ]!
	hover:(border-4 border-blue-500)
	[
		.group:hover,
		// .group:focus]
	]:!(text-red-700)// bg-primary
	/* text-error ()
	*/()
	custom/30 text-yellow-600/80 bg-gray-500/[.3]
	bg-[url(http://example)]
	text-[rgba(3 3 3 / .8)]/[.2] sm:hover: ( q-test`

	expect(
		hover({
			text: code,
			position: 32,
		}),
	).toEqual({
		target: {
			type: NodeType.SimpleVariant,
			range: [30, 36],
			id: {
				type: NodeType.Identifier,
				value: "hover",
				range: [30, 35],
			},
		},
		important: false,
		variants: [],
		value: "hover",
	})

	expect(
		hover({
			text: code,
			position: 117,
		}),
	).toMatchSnapshot()
})
