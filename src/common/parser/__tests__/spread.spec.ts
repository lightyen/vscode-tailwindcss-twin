import { NodeType } from ".."
import { spread } from "../spread"

it("parser util spread", () => {
	const result = spread({
		text: `bg-gray-500 padding[ 3rem ]!
		hover:(border-4 border-blue-500)
		[
			.group:hover,
			// .group:focus]
		]:!(text-red-700)// bg-primary
		/* text-error ()
		*/()
		custom/30 text-yellow-600/80 bg-gray-500/[.3]
		bg-[url(http://example)]
		text-[rgba(3 3 3 / .8)]/[.2] sm:hover: ( q-test`,
	})

	expect(result.items.map(i => i.target.type)).toEqual([
		NodeType.ClassName,
		NodeType.CssDeclaration,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ArbitraryClassname,
		NodeType.ArbitraryClassname,
		NodeType.ArbitraryClassname,
	])

	expect(result).toMatchSnapshot()
})
