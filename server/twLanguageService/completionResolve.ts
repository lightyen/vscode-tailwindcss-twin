import { IPropertyData } from "vscode-css-languageservice"
import * as lsp from "vscode-languageserver"
import { Tailwind } from "~/tailwind"
import type { ServiceOptions } from "~/twLanguageService"
import { getEntryDescription } from "./cssData"
import * as md from "./markdown"
import { getName, getReferenceLinks } from "./referenceLink"

export default function completionResolve(
	item: lsp.CompletionItem,
	state: Tailwind,
	options: ServiceOptions,
): lsp.CompletionItem {
	if (item.data.type === "theme") {
		return item
	}

	const keyword = item.label.slice(state.config.prefix.length)
	// if (item.kind === lsp.CompletionItemKind.Constant && keyword === "container") {
	// 	resolveContainer(item, state, options)
	// 	return item
	// }

	item = resolve(item, state, options)

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

function resolve(item: lsp.CompletionItem, state: Tailwind, options: ServiceOptions): lsp.CompletionItem {
	const { type, entry } = item.data as {
		type: string
		entry: IPropertyData
	}

	if (type === "cssPropertyName" || type === "cssPropertyValue") {
		if (type === "cssPropertyName") {
			item.documentation = getEntryDescription(entry, true)
		}
		return item
	}

	if (options.references) {
		item.detail = getName(item.label.slice(state.config.prefix.length))
		if (!item.detail) {
			if (type === "components") {
				item.detail = "custom component"
			} else if (type === "utilities") {
				item.detail = "custom utility"
			} else if (type === "variant") {
				item.detail = "custom variant"
			} else if (type === "screen") {
				item.detail = "custom screen"
			} else if (type === "color") {
				item.detail = "custom color"
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
		const data = state.twin.variants.get(item.label.replace(new RegExp(`${state.separator}$`), ""))
		if (!(data instanceof Array)) {
			return item
		}

		if (data instanceof Array) {
			const text: string[] = []
			if (data.length === 0) {
				text.push(item.label)
			} else {
				text.push(`${data.join(", ")}`)
			}
			item.documentation = {
				kind: lsp.MarkupKind.Markdown,
				value: ["```scss", ...text, "```"].join("\n"),
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
	}
	return item
}

function getRemUnit(key: string, rootFontSize: boolean | number, state: Tailwind) {
	if (rootFontSize === false) {
		return ""
	}

	const rules = state.twin.classnames.get(key)
	if (!rules) return ""

	if (rootFontSize === true) {
		rootFontSize = 16
	}

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
