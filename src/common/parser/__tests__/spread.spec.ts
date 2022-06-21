import { NodeType } from ".."
import { spread } from "../spread"

it("parser util spread", () => {
	const result = spread(`bg-gray-500 padding[ 3rem ]!
		hover:(border-4 border-blue-500)
		[
			.group:hover,
			// .group:focus]
		]:!(text-red-700)// bg-primary
		/* text-error ()
		*/()
		custom/30 text-yellow-600/80 bg-gray-500/[.3]
		bg-[url(http://example)]
		text-[rgba(3 3 3 / .8)]/[.2] sm:hover: ( q-test`)
	expect(result.items.map(i => i.target.type)).toEqual([
		NodeType.ClassName,
		NodeType.ShortCss,
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

it("spread all types", () => {
	const text = `
		class-value
		(class-value)
		hover:class-value
		hover:(class-value)
		[]:class-value
		hover:[]:class-value
		any-[]:class-value
		hover:any-[]:class-value
		class-[value]
		class-value/opacity
		class-[value]/[opacity]
		class-[value]/opacity
		class-value/[opacity]
		[prop: value]
		prop[value]

		// important prefix
		!class-value
		!(class-value)
		hover:!class-value
		hover:!(class-value)
		[]:!class-value
		hover:[]:!class-value
		any-[]:!class-value
		hover:any-[]:!class-value
		!class-[value]
		!class-value/opacity
		!class-[value]/[opacity]
		!class-[value]/opacity
		!class-value/[opacity]
		![prop: value]
		!prop[value]

		// important after
		class-value!
		(class-value)!
		hover:class-value!
		hover:(class-value)!
		[]:class-value!
		hover:[]:class-value!
		any-[]:class-value!
		hover:any-[]:class-value!
		class-[value]!
		class-value/opacity!
		class-[value]/[opacity]!
		class-[value]/opacity!
		class-value/[opacity]!
		[prop: value]!
		prop[value]!
	`
	expect(spread(text).items.map(i => i.target.type)).toEqual([
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ArbitraryClassname,
		NodeType.ClassName,
		NodeType.ArbitraryClassname,
		NodeType.ArbitraryClassname,
		NodeType.ArbitraryClassname,
		NodeType.ArbitraryProperty,
		NodeType.ShortCss,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ArbitraryClassname,
		NodeType.ClassName,
		NodeType.ArbitraryClassname,
		NodeType.ArbitraryClassname,
		NodeType.ArbitraryClassname,
		NodeType.ArbitraryProperty,
		NodeType.ShortCss,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ArbitraryClassname,
		NodeType.ClassName,
		NodeType.ArbitraryClassname,
		NodeType.ArbitraryClassname,
		NodeType.ArbitraryClassname,
		NodeType.ArbitraryProperty,
		NodeType.ShortCss,
	])

	expect(spread(text).items.map(i => i.important)).toEqual([
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
	])

	expect(spread(text).items.map(i => i.target.important)).toEqual([
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		true,
		false,
		true,
		false,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		false,
		true,
		false,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
	])
})

it("parser arbitrary variant", () => {
	const result = spread(`tab-[]:black`)
	expect(result).toMatchSnapshot()
})
