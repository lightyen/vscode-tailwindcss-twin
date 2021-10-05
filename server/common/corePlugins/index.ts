import plugins from "./plugins"

export function createGetPluginByName(config: Tailwind.ResolvedConfigJS) {
	const corePlugins = Object.values(plugins).map(newPlugin => {
		try {
			return newPlugin({ config })
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
