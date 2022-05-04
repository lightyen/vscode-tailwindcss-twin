import * as plugins from "./plugins"

interface TrimPrefix {
	(classname: string): string
}

function isExist<T>(value: T | null | undefined): value is T {
	return !!value
}

export function createGetPluginByName(config: Tailwind.ResolvedConfigJS) {
	const corePlugins = Object.values(plugins)
		.map(build => build({ config }))
		.filter(isExist)
	return (value: string, trimPrefix?: TrimPrefix) => {
		if (trimPrefix) value = trimPrefix(value)
		for (const plugin of corePlugins) {
			if (plugin.isMatch(value)) return plugin
		}
		return undefined
	}
}
