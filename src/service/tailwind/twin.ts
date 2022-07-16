export const twinConfig: Tailwind.ConfigJS = {
	plugins: [
		// light mode
		function ({ config, addVariant }) {
			const mode = config("lightMode", "media")
			if (mode === "media") {
				addVariant("light", "@media (prefers-color-scheme: light)")
			} else if (mode === "class") {
				addVariant("light", ".light &")
			} else if (Array.isArray(mode) && mode[0] === "class" && typeof mode[1] === "string") {
				addVariant("light", `${mode[1]} &`)
			}
		},
		// media query
		function ({ addVariant }) {
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
		},
		// custom
		function ({ addVariant }) {
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
		},
		// not
		function ({ addVariant }) {
			const data: Array<[string, string | string[]]> = [
				["first", "&:first-child"],
				["last", "&:last-child"],
				["only", "&:only-child"],
				["first-of-type", "&:first-of-type"],
				["last-of-type", "&:last-of-type"],
				["only-of-type", "&:only-of-type"],
				["checked", "&:checked"],
				["disabled", "&:disabled"],
			]
			data.forEach(([key, value]) => {
				if (typeof value === "string") value = [value]
				addVariant(
					`not-${key}`,
					value.map(val => `&:not(${val.replaceAll(/&/g, "")})`),
				)
			})
		},
	],
}
