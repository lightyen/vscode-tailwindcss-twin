import resolveConfig from "tailwindcss/resolveConfig"
import plugins from "./plugins"

export function createGetPluginByName(config: Tailwind.ConfigJS) {
	const resolved = resolveConfig(config)
	const corePlugins = Object.values(plugins).map(Plugin => {
		try {
			const p = new Plugin({ config, resolved })
			return p
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
