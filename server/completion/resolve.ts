import { Connection, MarkupKind } from "vscode-languageserver"
import { getVariants } from "~/common"
import { PatternKind } from "~/patterns"

import { state, CSSRuleItem } from "~/tailwind"

export const completionResolve: Parameters<Connection["onCompletionResolve"]>[0] = async item => {
	if (!state) {
		return item
	}

	const { type, variants, kind } = item.data as {
		type: string
		value: string
		variants: string[]
		kind: PatternKind
	}

	if (kind === "twinTheme") {
		return item
	}

	if (kind === "twin") {
		switch (item.label) {
			case "content":
				item.detail = "content"
				item.documentation = {
					kind: MarkupKind.Markdown,
					value: ["```scss", ".content {", '\tcontent:"";', "}", "```"].join("\n"),
				}
				return item
			case "container":
				item.detail = "container"
				item.documentation = {
					kind: MarkupKind.Markdown,
					value: "https://github.com/ben-rogerson/twin.macro/blob/master/docs/container.md",
				}
				return item
		}
	}

	let data = item.data.data as CSSRuleItem | CSSRuleItem[]
	if (variants.length > 0 && !item.label.endsWith(":")) {
		if (!data) {
			return item
		}
		const __variants = getVariants(kind === "twin")
		if (data instanceof Array) {
			data = data.filter(d => {
				for (const context of d.__context) {
					for (const k in __variants) {
						if (!__variants[k].includes(context)) {
							// not found, ignore
							continue
						}
						if (!variants.includes(k)) {
							return false
						}
					}
				}
				return true
			})
		}
	}

	if (type === "class" || type === "color") {
		if (data instanceof Array) {
			const result: Record<string, string> = {}
			for (const d of data) {
				for (const k in d.decls) {
					for (const v of d.decls[k]) {
						result[k] = v
					}
				}
			}
			if (type === "color") {
				item.detail = Object.entries(result)
					.map(([prop, value]) => `${prop}: ${value};`)
					.join("\n")
				return item
			}
			// class
			item.documentation = {
				kind: MarkupKind.Markdown,
				value: [
					"```scss",
					`.${item.label} {\n${Object.entries(result)
						.map(([prop, value]) => `\t${prop}: ${value};`)
						.join("\n")}\n}`,
					"```",
				].join("\n"),
			}
		} else {
			item.detail = item.label
			if (data.__pseudo) {
				item.documentation = {
					kind: MarkupKind.Markdown,
					value: ["```scss", data.__pseudo.map(v => `.${item.label}${v}`).join("\n"), "```"].join("\n"),
				}
			}
		}
	} else if (type === "variant" || type === "screen") {
		if (data instanceof Array) {
			item.detail = type === "screen" ? "responsive design" : "variant"
			const text: string[] = []
			if (data.length === 0) {
				text.push(item.label)
			} else {
				text.push(`${data.join(", ")}`)
			}
			item.documentation = {
				kind: MarkupKind.Markdown,
				value: ["```scss", ...text, "```"].join("\n"),
			}
		}
	}

	return item
}

export default completionResolve
