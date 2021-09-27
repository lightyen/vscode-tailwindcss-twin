import resolveConfig from "tailwindcss/resolveConfig"
import plugins from "./plugins"

export function createGetPluginByName(config: Tailwind.ResolvedConfigJS) {
	const resolved = resolveConfig(config)
	const corePlugins = Object.values(plugins).map(newPlugin => {
		try {
			return newPlugin({ config, resolved })
		} catch {
			return undefined
		}
	})

	return (value: string) => {
		for (const plugin of corePlugins) {
			if (plugin?.isMatch(value)) {
				return plugin
			}
		}
		return undefined
	}
}
