import { defaultLogger as console } from "@/logger"
import { CodeKind, createFencedCodeBlock } from "@/markdown"
import { transformSourceMap } from "@/sourcemap"
import { getEntryDescription } from "@/vscode-css-languageservice"
import vscode from "vscode"
import { ICompletionItem } from "~/typings/completion"
import type { ServiceOptions } from "."
import { getName, getReferenceLinks } from "./referenceLink"
import type { TailwindLoader } from "./tailwind"

export default function completionResolve(
	item: ICompletionItem,
	state: TailwindLoader,
	options: ServiceOptions,
): ICompletionItem {
	try {
		const payload = item.data
		if (!payload) return item
		if (payload.type === "theme") return item

		const plugin = state.tw.getPlugin(item.label)
		let keyword = state.tw.trimPrefix(item.label)
		if (plugin) keyword = plugin.name
		item = resolve(item, keyword, state, options, payload)

		if (options.references && item.documentation) {
			if (typeof item.documentation === "object") {
				const links = getReferenceLinks(keyword)
				if (links.length > 0) {
					item.documentation.value += "\n"
					item.documentation.value += links.map((ref, i) => `[Reference](${ref.url}) `).join("\n")
				}
			}
		}
		return item
	} catch (error) {
		const err = error as Error
		if (err.stack) err.stack = transformSourceMap(options.serverSourceMapUri.fsPath, err.stack)
		console.error(err)
		return item
	}
}

function resolve(
	item: ICompletionItem,
	keyword: string,
	state: TailwindLoader,
	options: ServiceOptions,
	payload: ICompletionItem["data"],
): ICompletionItem {
	const { type, entry } = payload
	if (type === "cssValue") return item
	if (type === "cssProp") {
		if (entry) {
			const markdown = new vscode.MarkdownString()
			const desc = getEntryDescription(entry, true)
			if (desc) {
				markdown.appendMarkdown(desc.value)
				item.documentation = markdown
			}
		}
		return item
	}

	if (options.references) {
		item.detail = getName(keyword)
		if (!item.detail) {
			if (type === "screen") {
				item.detail = getName("screens")
			} else if (type === "color") {
				item.detail = getName("colors")
			}
		}
	}

	if (type === "variant" || type === "screen") {
		const key = item.label.replace(new RegExp(`${state.separator}$`), "")
		const code = state.tw.renderVariant(key)
		if (!code) return item

		const fencedCodeBlock = createFencedCodeBlock(code, CodeKind.SCSS)
		// if (options.references) {
		// 	const desc = getDescription(item.label)
		// 	if (desc) values.unshift(desc + "\n")
		// }

		const markdown = new vscode.MarkdownString()
		markdown.appendMarkdown(fencedCodeBlock)
		item.documentation = markdown

		return item
	}

	if (type === "color") return item

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

	const code = state.tw.renderClassname({ classname: item.label, rootFontSize: options.rootFontSize })
	if (!code) return item

	const fencedCodeBlock = createFencedCodeBlock(code, CodeKind.CSS)
	if (type === "utility") {
		const markdown = new vscode.MarkdownString()
		markdown.appendMarkdown(fencedCodeBlock)
		item.documentation = markdown
	}

	return item
}

function getRemUnit(classname: string, rootFontSize: number, state: TailwindLoader) {
	if (rootFontSize <= 0) {
		return ""
	}

	const decls = state.tw.renderDecls(classname)
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
