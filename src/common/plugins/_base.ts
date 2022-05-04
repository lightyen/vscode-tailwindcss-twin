export interface Context {
	config: Tailwind.ResolvedConfigJS
}

export interface MatchPlugin {
	isMatch(value: string): boolean
	getName(): keyof Tailwind.CorePluginFeatures
}

export function hasDefault(obj: unknown): boolean {
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
	const names: string[] = []
	for (const prop in palette) {
		const c = palette[prop]
		if (typeof c === "object") {
			for (const k in c) {
				if (k === "DEFAULT") {
					names.push(prop)
					continue
				}
				names.push(`${prop}-${k}`)
			}
		} else if (typeof c === "string" || typeof c === "number") {
			if (prop !== "DEFAULT") {
				names.push(`${prop}`)
			}
		} else if (typeof c === "function") {
			const a = c({ opacityValue: "1", opacityVariable: "" })
			if (typeof a === "object") {
				for (const k in a) {
					if (k === "DEFAULT") {
						names.push(prop)
						continue
					}
					names.push(`${prop}-${k}`)
				}
			} else if (typeof a === "string" || typeof a === "number") {
				names.push(`${prop}`)
			}
		}
	}
	return names
}

export function getOpacity(
	context: Context,
	key: ("opacity" | `${string}Opacity`) & keyof Tailwind.CorePluginFeatures = "opacity",
): string[] | null {
	return context.config.corePlugins.some(c => c === key) ? Object.keys(context.config.theme[key]) : null
}
