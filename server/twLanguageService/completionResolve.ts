import * as lsp from "vscode-languageserver"
import type { CSSRuleItem } from "~/tailwind/classnames"
import { Tailwind } from "~/tailwind"
import { PatternKind } from "~/common/ast"
import type { ServiceOptions } from "~/twLanguageService"
import { getReferenceLinks, getName, getDescription } from "./referenceLink"
import { IPropertyData } from "vscode-css-languageservice"
import { getEntryDescription } from "./cssData"

export default function completionResolve(
	item: lsp.CompletionItem,
	state: Tailwind,
	options: ServiceOptions,
): lsp.CompletionItem {
	item = resolve(item, state, options)
	if (options.references && typeof item.documentation === "object") {
		const refs = getReferenceLinks(item.label)
		if (refs.length == 1) {
			item.documentation.value += "\n" + `[Reference](${refs[0].url})`
		} else if (refs.length > 0) {
			item.documentation.value += "\n" + refs.map((ref, i) => `[Reference${i}](${ref.url}) `).join("\n")
		}
	}
	return item
}

function resolve(item: lsp.CompletionItem, state: Tailwind, options: ServiceOptions): lsp.CompletionItem {
	const { type, variants, kind, entry } = item.data as {
		type: string
		variants: string[]
		kind: PatternKind
		entry?: IPropertyData
	}

	if (kind === PatternKind.TwinTheme) {
		return item
	}

	if (type === "cssPropertyName" || type === "cssPropertyValue") {
		if (type === "cssPropertyName") {
			item.documentation = getEntryDescription(entry, true)
		}
		return item
	}

	item.detail = getName(item.label)
	if (kind === PatternKind.Twin) {
		switch (item.label) {
			case "content":
				item.documentation = {
					kind: lsp.MarkupKind.Markdown,
					value: ["```scss", ".content {", '\tcontent: "";', "}", "```"].join("\n"),
				}
				return item
			case "container":
				item.documentation = {
					kind: lsp.MarkupKind.Markdown,
					value: getDescription("container"),
				}
				return item
		}
	}

	let data = item.data.data as CSSRuleItem | CSSRuleItem[]
	if (!data) {
		return item
	}

	if (!(data instanceof Array)) {
		if (data.__pseudo) {
			item.documentation = {
				kind: lsp.MarkupKind.Markdown,
				value: ["```scss", data.__pseudo.map(v => `.${item.label}${v}`).join("\n"), "```"].join("\n"),
			}
		}
		return item
	}

	if (variants.length > 0 && !item.label.endsWith(":")) {
		const __variants = state.classnames.getVariants(kind === PatternKind.Twin)
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

	if (type === "utilities" || type === "color") {
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
			kind: lsp.MarkupKind.Markdown,
			value: [
				"```scss",
				`.${item.label} {\n${Object.entries(result)
					.map(([prop, value]) => `\t${prop}: ${value};`)
					.join("\n")}\n}`,
				"```",
			].join("\n"),
		}
	} else if (type === "variant" || type === "screen") {
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
	} else if (type === "components") {
		const blocks: Map<string, string[]> = new Map()
		data.map(rule => {
			const selector = item.label + rule.__pseudo.join("")
			const decls = Object.entries(rule.decls).flatMap(([prop, values]) =>
				values.map<[string, string]>(v => [prop, v]),
			)
			return { scope: rule.__scope ? rule.__scope + " " : "", selector, decls }
		}).forEach(c => {
			const selector = `${c.scope}.${c.selector.replace(/\//g, "\\/")}`
			if (!blocks.has(selector)) {
				blocks.set(selector, [])
			}
			blocks.get(selector).push(...c.decls.map(([prop, value]) => `${prop}: ${value};`))
		})

		item.documentation = {
			kind: lsp.MarkupKind.Markdown,
			value: [
				"```scss",
				...Array.from(blocks).map(([selector, contents]) => {
					return `${selector} {\n${contents.map(c => `  ${c}`).join("\n")}\n}`
				}),
				"```",
			].join("\n"),
		}
	}
	return item
}
