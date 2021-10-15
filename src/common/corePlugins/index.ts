import plugins from "./plugins"

interface TrimPrefix {
	(classname: string): string
}

export function createGetPluginByName(config: Tailwind.ResolvedConfigJS) {
	const corePlugins = Object.values(plugins).map(newPlugin => {
		try {
			return newPlugin({ config })
		} catch {
			return undefined
		}
	})

	return (value: string, trimPrefix?: TrimPrefix) => {
		if (trimPrefix) value = trimPrefix(value)
		for (const plugin of corePlugins) {
			if (plugin?.isMatch(value)) {
				return plugin
			}
		}
		return undefined
	}
}
