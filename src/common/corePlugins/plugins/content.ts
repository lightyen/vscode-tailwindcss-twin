import { isArbitraryValue } from "../util"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

function getDefault(obj: Record<string, unknown>): [boolean, string[]] {
	const hasDefault = Object.prototype.hasOwnProperty.call(obj, "DEFAULT")
	const values = Object.keys(obj).filter(v => v !== "DEFAULT")
	return [hasDefault, values]
}

export const content: PluginConstructor = (context: Context): Plugin => {
	if (!context.config.corePlugins.some(c => c === "content")) throw ErrorNotEnable
	const [hasDefault, values] = getDefault(context.config.theme.content)

	return {
		isMatch,
		get name(): keyof Tailwind.CorePluginFeatures {
			return "content"
		},
	}

	function isMatch(value: string) {
		const match = /^content(?:-|\b)(.*)/s.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		if (hasDefault && (val === "" || val === "DEFAULT")) {
			return true
		}

		if (isArbitraryValue(val)) {
			return true
		}

		return values.some(c => c === val)
	}
}
content.canArbitraryValue = true
