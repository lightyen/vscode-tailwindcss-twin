import { IPropertyData } from "vscode-css-languageservice"
import * as lsp from "vscode-languageserver"
import type { TailwindLoader } from "~/tailwind"
import { getEntryDescription } from "./cssData"
import * as md from "./markdown"
import { getDescription, getName, getReferenceLinks } from "./referenceLink"
import type { ServiceOptions } from "./service"

export default function completionResolve(
	item: lsp.CompletionItem,
	state: TailwindLoader,
	options: ServiceOptions,
): lsp.CompletionItem {
	if (item.data.type == undefined || item.data.type === "theme") {
		return item
	}

	let keyword = item.label.slice(state.config.prefix.length)
	const plugin = state.twin.getPluginByName(keyword)
	if (plugin) {
		keyword = plugin.name
	}

	item = resolve(item, keyword, state, options)

	if (options.references && item.documentation) {
		if (typeof item.documentation === "object") {
			const refs = getReferenceLinks(keyword)
			if (refs.length == 1) {
				item.documentation.value += "\n" + `[Reference](${refs[0].url})`
			} else if (refs.length > 0) {
				item.documentation.value += "\n" + refs.map((ref, i) => `[Reference${i}](${ref.url}) `).join("\n")
			}
		}
	}
	return item
}

function resolve(
	item: lsp.CompletionItem,
	keyword: string,
	state: TailwindLoader,
	options: ServiceOptions,
): lsp.CompletionItem {
	const { type, entry } = item.data as {
		type: string
		entry: IPropertyData
	}

	if (type === "cssPropertyName" || type === "cssPropertyValue") {
		if (type === "cssPropertyName") {
			if (entry) {
				item.documentation = getEntryDescription(entry, true)
			}
		}
		return item
	}

	if (options.references) {
		item.detail = getName(keyword)
		if (!item.detail) {
			if (type === "components") {
				item.detail = "custom component"
			} else if (type === "utilities") {
				item.detail = "custom utility"
			} else if (type === "variant") {
				item.detail = "custom variant"
			} else if (type === "screen") {
				item.detail = getName("screens")
			} else if (type === "color") {
				item.detail = getName("colors")
			}
		}
	}

	if (type === "color") {
		const data = state.twin.classnames.get(item.label)
		if (!(data instanceof Array)) {
			return item
		}

		const result: Record<string, string> = {}
		for (const d of data) {
			for (const k in d.decls) {
				for (const v of d.decls[k]) {
					result[k] = v
				}
			}
		}
		item.detail = Object.entries(result)
			.map(([prop, value]) => `${prop}: ${value};`)
			.join("\n")
		return item
	}

	if (type === "variant" || type === "screen") {
		const key = item.label.replace(new RegExp(`${state.separator}$`), "")
		const data = state.twin.variants.get(key)
		if (!(data instanceof Array)) {
			return item
		}

		const desc = getDescription(item.label)

		if (data instanceof Array) {
			const text: string[] = []
			if (data.length === 0) {
				text.push(item.label)
			} else {
				text.push(`${data.join(", ")}`)
			}
			item.documentation = {
				kind: lsp.MarkupKind.Markdown,
				value: "",
			}
			const content = md.renderVariant({ state, key })
			if (content) {
				item.documentation.value = content
			}
			if (desc) {
				item.documentation.value = desc + "\n" + item.documentation.value
			}
		}
		return item
	}

	if (type === "utilities") {
		const postfix = getRemUnit(item.label, options.rootFontSize, state)
		if (postfix) {
			if ((item.detail?.length ?? 0) <= 20) {
				item.detail = item.detail + postfix
			} else {
				item.detail = postfix
			}
		}
		item.documentation = {
			kind: lsp.MarkupKind.Markdown,
			value: md.renderClassname({ key: item.label, state, options }) ?? "",
		}

		return item
	}

	if (type === "components") {
		item.documentation = {
			kind: lsp.MarkupKind.Markdown,
			value: md.renderClassname({ key: item.label, state, options }) ?? "",
		}

		// special
		if (item.label === state.config.prefix + "container") {
			item.documentation.value = getDescription("container") + "\n" + item.documentation.value
		}
	}
	return item
}

function getRemUnit(key: string, rootFontSize: number, state: TailwindLoader) {
	if (rootFontSize <= 0) {
		return ""
	}

	const rules = state.twin.classnames.get(key)
	if (!rules) return ""

	const reg = /(-?\d[.\d+e]*)rem/

	for (const rule of rules) {
		for (const k in rule.decls) {
			const values = rule.decls[k]
			for (let i = 0; i < values.length; i++) {
				const match = reg.exec(values[i])
				if (!match) {
					continue
				}
				const [text, n] = match
				const val = parseFloat(n)
				if (Number.isNaN(val)) {
					continue
				}
				return ` (${text} = ${rootFontSize * val}px)`
			}
		}
	}

	return ""
}
