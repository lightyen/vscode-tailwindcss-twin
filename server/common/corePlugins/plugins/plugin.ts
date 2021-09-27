export interface Context {
	config: Tailwind.ConfigJS
	resolved: Tailwind.ResolvedConfigJS
}

export interface Plugin {
	isMatch(value: string): boolean
	get name(): keyof Tailwind.CorePluginFeatures
}

export interface PluginConstructor {
	canArbitraryValue: boolean
	(context: Context): Plugin
}

export const ErrorNotEnable = new Error("not an enabled plugin")
