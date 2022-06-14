import type * as postcss from "postcss"
import type parser from "postcss-selector-parser"

export interface selectorParser {
	(): parser.Processor<never>
	<Transform>(processor: parser.AsyncProcessor<Transform>): parser.Processor<Transform, never>
	(processor: parser.AsyncProcessor<void>): parser.Processor<never, never>
	<Transform>(processor: parser.SyncProcessor<Transform>): parser.Processor<Transform>
	(processor: parser.SyncProcessor<void>): parser.Processor<never>
	<Transform>(
		processor?: parser.SyncProcessor<Transform> | parser.AsyncProcessor<Transform>,
	): parser.Processor<Transform>
	attribute: typeof parser.attribute
	pseudo: typeof parser.pseudo
}

export interface ContextModule extends Tailwind.pluginUtils {
	plugin: Tailwind.createPlugin
	postcss: postcss.Postcss
	prefixSelector: Tailwind.prefixSelector
}

export function twin(context: ContextModule): Tailwind.ConfigJS {
	const { plugin } = context
	return {
		plugins: [
			plugin(({ config, addVariant, addUtilities }) => {
				const darkMode = config("darkMode", "media")
				if (darkMode === "class") addVariant("light", ".light &")
				else if (darkMode === "media") addVariant("light", "@media (prefers-color-scheme: light)")
				else if (Array.isArray(darkMode) && darkMode[0] === "class" && typeof darkMode[1] === "string") {
					addVariant("light", `${darkMode[1].replace(/\bdark\b/, "light")} &`)
				}

				addUtilities({
					".content": {
						content: '""',
					},
				})

				addVariant("screen", "@media screen")
				addVariant("any-pointer-none", "@media (any-pointer: none)")
				addVariant("any-pointer-fine", "@media (any-pointer: fine)")
				addVariant("any-pointer-coarse", "@media (any-pointer: coarse)")
				addVariant("pointer-none", "@media (pointer: none)")
				addVariant("pointer-fine", "@media (pointer: fine)")
				addVariant("pointer-coarse", "@media (pointer: coarse)")
				addVariant("any-hover", "@media (any-hover: hover)")
				addVariant("any-hover-none", "@media (any-hover: none)")
				addVariant("can-hover", "@media (hover: hover)")
				addVariant("cant-hover", "@media (hover: none)")

				addVariant("not-first", "&:not(:first-child)")
				addVariant("not-last", "&:not(:last-child)")
				addVariant("not-only", "&:not(:only-child)")
				addVariant("not-first-of-type", "&:not(:first-of-type)")
				addVariant("not-last-of-type", "&:not(:last-of-type)")
				addVariant("not-only-of-type", "&:not(:only-of-type)")
				addVariant("not-checked", "&:not(:checked)")
				addVariant("not-disabled", "&:not(:disabled)")
				addVariant("even-of-type", "&:nth-of-type(even)")
				addVariant("odd-of-type", "&:nth-of-type(odd)")
				addVariant("link", "&:link")
				addVariant("read-write", "&:read-write")

				addVariant("all", "& *")
				addVariant("sibling", "& ~ *")
				addVariant("svg", "& svg")
				addVariant("all-child", "& > *")

				addVariant("hocus", "&:hover, &:focus")
				addVariant("group-hocus", ":merge(.group):hover &, :merge(.group):focus &")
				addVariant("peer-hocus", ":merge(.peer):hover ~ &, :merge(.peer):focus ~ &")
			}),
		],
	}
}
