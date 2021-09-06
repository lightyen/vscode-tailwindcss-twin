export interface Context {
	config: Tailwind.ConfigJS
	resolved: Tailwind.ResolvedConfigJS
}

export interface Plugin {
	name: keyof Tailwind.CorePluginFeatures
	isMatch(value: string): boolean
}

export interface PluginConstructor {
	canArbitraryValue: boolean
	new (context: Context): Plugin
	readonly prototype: Plugin
}

export const ErrorNotEnable = new Error("not an enabled plugin")
