import { Context, hasDefault, isCorePluginEnable, isField, MatchPlugin } from "./_base"
import { isArbitraryValue } from "./_parse"

export function content(context: Context): MatchPlugin | null {
	if (!isCorePluginEnable(context, "content")) return null
	const _hasDefault = hasDefault(context.config.theme.content)
	return {
		getName() {
			return "content"
		},
		isMatch(value: string) {
			const match = /^content(?:-|\b)(.*)/s.exec(value)
			if (!match) return false
			const val = match[1]
			if (val === "") return _hasDefault
			if (isArbitraryValue(val)) return true
			return isField(context.config.theme.content, val)
		},
	}
}
