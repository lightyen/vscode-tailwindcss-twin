import isArbitraryValue from "./common/isArbitraryValue"
import { Context, ErrorNotEnable, Plugin, PluginConstructor } from "./plugin"

function getDefault(obj: Record<string, unknown>): [boolean, string[]] {
	const hasDefault = Object.prototype.hasOwnProperty.call(obj, "DEFAULT")
	const values = Object.keys(obj).filter(v => v !== "DEFAULT")
	return [hasDefault, values]
}

export const content: PluginConstructor = class implements Plugin {
	static canArbitraryValue = true
	name: keyof Tailwind.CorePluginFeatures
	values: string[]
	hasDefault: boolean
	constructor(private context: Context) {
		this.name = "content"
		if (!this.context.resolved.corePlugins.some(c => c === "content")) {
			throw ErrorNotEnable
		}
		;[this.hasDefault, this.values] = getDefault(this.context.resolved.theme.content)
	}
	isMatch(value: string) {
		const match = /^content(?:-|\b)(.*)/.exec(value)
		if (!match) {
			return false
		}

		const val = match[1]

		if (this.hasDefault && val === "") {
			return true
		}

		if (isArbitraryValue(val)) {
			return true
		}

		return this.values.some(c => c === val)
	}
}
