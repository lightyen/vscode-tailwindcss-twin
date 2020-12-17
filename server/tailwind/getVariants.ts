import { Postcss } from "postcss"
import semver from "semver"

interface Options {
	config: { plugins: unknown[] }
	version: string
	postcss: Postcss
}

// FIXME: unused
export default function getVariants({ config, version, postcss }: Options) {
	const variants = ["responsive", "hover"]
	semver.gte(version, "0.3.0") && variants.push("focus", "group-hover")
	semver.gte(version, "0.5.0") && variants.push("active")
	semver.gte(version, "0.7.0") && variants.push("focus-within")
	semver.gte(version, "1.0.0-beta.1") && variants.push("default")
	semver.gte(version, "1.1.0") && variants.push("first", "last", "odd", "even", "disabled", "visited")
	semver.gte(version, "1.3.0") && variants.push("group-focus")

	// const plugins = config.plugins instanceof Array ? config.plugins : []

	// plugins.forEach(plugin => {
	// 	runPlugin(plugin, {
	// 		postcss,
	// 		// browserslist,
	// 		config,
	// 		addVariant: name => {
	// 			variants.push(name)
	// 		},
	// 	})
	// })

	return variants
}
