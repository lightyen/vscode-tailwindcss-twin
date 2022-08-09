export interface Context {
	config: Tailwind.ResolvedConfigJS
}

export interface MatchPlugin {
	isMatch(value: string): boolean
	getName(): keyof Tailwind.CorePluginFeatures
}

export function hasDefault(obj: unknown): boolean {
	if (obj == undefined) return false
	return Object.prototype.hasOwnProperty.call(obj, "DEFAULT")
}

export function isCorePluginEnable(context: Context, key: keyof Tailwind.CorePluginFeatures): boolean {
	return context.config.corePlugins.some(c => c === key)
}

export function isField(context: unknown, value: string): boolean {
	if (!context) return false
	if (!value) return false
	if (typeof context === "object") return Object.prototype.hasOwnProperty.call(context, value)
	return context === value
}

export function getPalette(
	context: Context,
	key: ("colors" | "fill" | "stroke" | `${string}Color${string}`) & keyof Tailwind.CorePluginFeatures,
): string[] | null {
	if (!isCorePluginEnable(context, key)) return null
	const palette = context.config.theme[key]
	const colorNames = Object.keys(flattenColorPalette(palette))
	return colorNames
}

export function flattenColorPalette(colors: Tailwind.Palette | null | undefined): {
	[color: string]: Tailwind.Value | Tailwind.ColorValueFunc | undefined
} {
	return Object.assign(
		{},
		...Object.entries(colors ?? {}).flatMap(([color, values]) => {
			if (typeof values !== "object") {
				return [{ [`${color}`]: values }]
			}
			return Object.entries(flattenColorPalette(values)).map(([keyword, colorValue]) => {
				return {
					[color + (keyword === "DEFAULT" ? "" : `-${keyword}`)]: colorValue,
				}
			})
		}),
	)
}

export function getOpacity(
	context: Context,
	key: ("opacity" | `${string}Opacity`) & keyof Tailwind.CorePluginFeatures = "opacity",
): string[] | null {
	return context.config.corePlugins.some(c => c === key) ? Object.keys(context.config.theme[key]) : null
}
