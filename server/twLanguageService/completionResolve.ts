import { IPropertyData } from "vscode-css-languageservice"
import * as lsp from "vscode-languageserver"
import { getEntryDescription } from "~/common/vscode-css-languageservice"
import type { TailwindLoader } from "~/tailwind"
import { getDescription, getName, getReferenceLinks } from "./referenceLink"
import type { ServiceOptions } from "./service"

export type CompletionItemPayloadType = "theme" | "screen" | "color" | "utility" | "variant" | "cssProp" | "cssValue"

export type CompletionItemPayload = {
	type: CompletionItemPayloadType
	entry?: IPropertyData
}

export default function completionResolve(
	item: lsp.CompletionItem,
	state: TailwindLoader,
	options: ServiceOptions,
): lsp.CompletionItem {
	const payload = item.data as CompletionItemPayload | undefined
	if (!payload) {
		return item
	}

	if (payload.type === "theme") {
		return item
	}

	let keyword = item.label.slice(state.config.prefix.length)
	const plugin = state.tw.getPlugin(keyword)
	if (plugin) {
		keyword = plugin.name
	}

	item = resolve(item, keyword, state, options, payload)

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
	payload: CompletionItemPayload,
): lsp.CompletionItem {
	const { type, entry } = payload
	if (type === "cssProp" || type === "cssValue") {
		if (type === "cssProp") {
			if (entry) {
				item.documentation = getEntryDescription(entry, true)
			}
		}
		return item
	}

	if (options.references) {
		item.detail = getName(keyword)
		if (!item.detail) {
			if (type === "utility") {
				// item.detail = "custom"
			} else if (type === "variant") {
				// item.detail = "custom variant"
			} else if (type === "screen") {
				item.detail = getName("screens")
			} else if (type === "color") {
				item.detail = getName("colors")
			}
		}
	}

	if (type === "variant" || type === "screen") {
		item.documentation = {
			kind: lsp.MarkupKind.Markdown,
			value: "",
		}
		const key = item.label.replace(new RegExp(`${state.separator}$`), "")
		const scssText = state.tw.renderVariant(key)

		if (scssText) {
			item.documentation.value = ["```scss", scssText, "```", "\n"].join("\n")
		}

		if (options.references) {
			const desc = getDescription(item.label)
			if (desc) {
				item.documentation.value = desc + "\n" + item.documentation.value
			}
		}

		return item
	}

	const cssText = state.tw.renderClassname({ classname: item.label, rootFontSize: options.rootFontSize })
	if (!cssText) {
		return item
	}

	if (type === "color") {
		return item
	}

	if (type === "utility") {
		item.documentation = {
			kind: lsp.MarkupKind.Markdown,
			value: "",
		}
		item.documentation.value = ["```css", cssText, "```", "\n"].join("\n")
	}

	if (options.references) {
		const postfix = getRemUnit(item.label, options.rootFontSize, state)
		if (postfix) {
			if ((item.detail?.length ?? 0) <= 20) {
				item.detail = item.detail + postfix
			} else {
				item.detail = postfix
			}
		}
	}

	return item
}

function getRemUnit(classname: string, rootFontSize: number, state: TailwindLoader) {
	if (rootFontSize <= 0) {
		return ""
	}

	const decls = state.tw.getDecls(classname)
	const reg = /(-?\d[.\d+e]*)rem/

	for (const [, values] of decls) {
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

	return ""
}
