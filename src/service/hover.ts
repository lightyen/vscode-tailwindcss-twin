import vscode from "vscode"
import { getEntryDescription } from "vscode-css-languageservice/lib/esm/languageFacts/entry"
import type { ExtractedToken, ExtractedTokenKind, TextDocument, Token } from "~/common/extractors/types"
import { defaultLogger as console } from "~/common/logger"
import * as parser from "~/common/parser"
import { removeComments } from "~/common/parser"
import { cssDataManager } from "~/common/vscode-css-languageservice"
import type { ServiceOptions } from "~/shared"
import { getDescription, getReferenceLinks } from "./referenceLink"
import type { TailwindLoader } from "./tailwind"

export default async function hover(
	result: ExtractedToken | undefined,
	document: TextDocument,
	position: vscode.Position,
	state: TailwindLoader,
	options: ServiceOptions,
	tabSize: number,
): Promise<vscode.Hover | undefined> {
	if (!result) return undefined

	return doHover(result)

	function doHover(result: ExtractedToken) {
		try {
			const { kind, ...token } = result
			if (kind === "theme") {
				const node = parser.parse_theme_val({ text: token.value })
				const range = new vscode.Range(
					document.positionAt(token.start + node.range[0]),
					document.positionAt(token.start + node.range[1]),
				)
				return resolveThemeValue({ kind, range, node, state, options })
			} else if (kind === "screen") {
				const range = new vscode.Range(document.positionAt(token.start), document.positionAt(token.end))
				return resolveScreenValue({ kind, range, token, state, options })
			} else {
				const selection = parser.hover({
					text: token.value,
					position: document.offsetAt(position) - token.start,
					separator: state.separator,
				})
				if (!selection) return undefined

				const [start, end] = selection.target.range
				const value = selection.value

				const range = new vscode.Range(
					document.positionAt(token.start + start),
					document.positionAt(token.start + end),
				)

				if (selection.target.type === parser.NodeType.ShortCss) {
					const prop = parser.toKebab(selection.target.prefix.value)
					const value = selection.value

					const header = new vscode.MarkdownString()
					if (options.references) {
						const entry = cssDataManager.getProperty(prop)
						if (entry) {
							const desc = getEntryDescription(entry, true)
							if (desc) {
								header.appendMarkdown(desc.value)
							}
						}
					}

					const code = state.tw.renderClassname({
						classname: `[${prop}: ${value}]`.replace(/ /g, "_"),
						important: selection.important,
						rootFontSize: options.rootFontSize,
						colorHint: options.hoverColorHint,
						tabSize,
					})
					const codes = new vscode.MarkdownString()
					if (code) codes.appendCodeblock(code, "scss")

					if (!header.value && !codes.value) return undefined

					return {
						range,
						contents: [header, codes],
					}
				}

				if (selection.target.type === parser.NodeType.ArbitraryProperty) {
					const rawText = selection.target.decl.value
					let prop = rawText.trim()
					let value = ""
					const i = rawText.indexOf(":")
					if (i >= 0) {
						prop = rawText.slice(0, i).trim()
						value = rawText.slice(i + 1).trim()
					}
					const header = new vscode.MarkdownString()
					if (options.references) {
						const entry = cssDataManager.getProperty(prop)
						if (entry) {
							const desc = getEntryDescription(entry, true)
							if (desc) {
								header.appendMarkdown(desc.value)
							}
						}
					}

					state.tw.renderArbitraryProperty(prop, value, {
						important: selection.important,
						rootFontSize: options.rootFontSize,
						colorHint: options.hoverColorHint,
						tabSize,
					})

					const code = state.tw.renderClassname({
						classname: `[${prop}: ${value}]`.replace(/(?!\\)_/g, "\\_").replace(/[ ]/g, "_"),
						important: selection.important,
						rootFontSize: options.rootFontSize,
						colorHint: options.hoverColorHint,
						tabSize,
					})
					const codes = new vscode.MarkdownString()
					if (code) codes.appendCodeblock(code, "scss")

					if (!header.value && !codes.value) return undefined

					return {
						range,
						contents: [header, codes],
					}
				}

				if (kind !== "tw") return undefined

				if (selection.target.type === parser.NodeType.ArbitrarySelector) {
					const header = new vscode.MarkdownString("**arbitrary variant**")
					const normalized = removeComments(value, false, state.separator)
						.trim()
						.replace(/\s{2,}/g, " ")
						.replace(/(?!\\)_/g, "\\_")
						.replace(/[ ]/g, "_")

					const code = state.tw.renderArbitraryVariant(`[${normalized}]`, state.separator, tabSize)
					const codes = new vscode.MarkdownString()
					if (code) codes.appendCodeblock(code, "scss")

					return {
						range,
						contents: [header, codes],
					}
				}

				if (selection.target.type === parser.NodeType.ArbitraryVariant) {
					const header = new vscode.MarkdownString("**arbitrary variant**")
					const code = state.tw.renderArbitraryVariant(value, state.separator, tabSize)
					const codes = new vscode.MarkdownString()
					if (code) codes.appendCodeblock(code, "scss")

					if (!header.value && !codes.value) return undefined
					return {
						range,
						contents: [header, codes],
					}
				}

				if (selection.target.type === parser.NodeType.SimpleVariant) {
					const header = new vscode.MarkdownString()
					if (options.references) {
						const desc =
							state.tw.screens.indexOf(value) === -1 ? getDescription(value) : getDescription("screens")
						if (typeof desc === "string") {
							header.appendMarkdown(desc ? desc + "\n" : "twin.macro" + "\n")
						}

						const links = getReferenceLinks(value)

						if (links.length > 0) {
							header.appendMarkdown("\n")
							header.appendMarkdown(links.map(ref => `[Reference](${ref.url}) `).join("\n"))
						}
					}

					const code = state.tw.renderSimpleVariant(value, tabSize)
					const codes = new vscode.MarkdownString()
					if (code) codes.appendCodeblock(code, "scss")

					if (!header.value && !codes.value) return undefined

					return {
						range,
						contents: [header, codes],
					}
				}

				const header = new vscode.MarkdownString()
				if (options.references) {
					const plugin = state.tw.getPlugin(value)
					const pluginName = plugin?.getName()
					if (pluginName) {
						const desc = getDescription(pluginName)
						if (typeof desc === "string") {
							header.appendMarkdown(desc ? desc + "\n" : "twin.macro" + "\n")
						}

						const links = getReferenceLinks(pluginName)
						if (links.length > 0) {
							header.appendMarkdown("\n")
							header.appendMarkdown(links.map(ref => `[Reference](${ref.url}) `).join("\n"))
						}
					}
				}

				if (selection.target.type === parser.NodeType.ArbitraryClassname) {
					const { prefix, expr, e } = selection.target
					let classname = `${prefix.value}`
					if (expr) {
						classname += `[${expr.value.trim().replace(/_/g, "\\_").replace(/ /g, "_")}]`
					}
					if (e) {
						if (e.type === parser.NodeType.WithOpacity) {
							classname += `/[${e.opacity.value.trim()}]`
						} else {
							classname += `/${e.value}`
						}
					}
					const code = state.tw.renderClassname({
						classname,
						important: selection.important,
						rootFontSize: options.rootFontSize,
						colorHint: options.hoverColorHint,
						tabSize,
					})
					const codes = new vscode.MarkdownString()
					if (code) codes.appendCodeblock(code, "scss")
					if (!header.value && !codes.value) return undefined

					return {
						range,
						contents: [header, codes],
					}
				}

				const code = state.tw.renderClassname({
					classname: value,
					important: selection.important,
					rootFontSize: options.rootFontSize,
					colorHint: options.hoverColorHint,
					tabSize,
				})
				const codes = new vscode.MarkdownString()
				if (code) codes.appendCodeblock(code, "scss")

				if (!header.value && !codes.value) return undefined

				return {
					range,
					contents: [header, codes],
				}
			}
		} catch (error) {
			console.error(error)
			console.error("hover failed.")
		}

		return undefined
	}
}

function resolveThemeValue({
	range,
	node,
	state,
}: {
	kind: ExtractedTokenKind
	range: vscode.Range
	node: parser.ThemeValueNode
	state: TailwindLoader
	options: ServiceOptions
}): vscode.Hover | undefined {
	const text = parser.renderThemePath(state.config, node.path)
	if (text === "[undefined]") return
	const markdown = new vscode.MarkdownString()
	markdown.value = `\`\`\`txt\n${text}\n\`\`\``
	return {
		range,
		contents: [markdown],
	}
}

function resolveScreenValue({
	range,
	token,
	state,
}: {
	kind: ExtractedTokenKind
	range: vscode.Range
	token: Token
	state: TailwindLoader
	options: ServiceOptions
}): vscode.Hover | undefined {
	const value = parser.resolvePath(state.config.theme, ["screens", token.value])
	if (value === undefined) return

	const markdown = new vscode.MarkdownString()
	if (typeof value === "string") {
		markdown.value = `\`\`\`css\n@media (min-width: ${value})\n\`\`\``
	} else if (value instanceof Array) {
		markdown.value = `\`\`\`txt\n${value.join(", ")}\n\`\`\``
	} else if (value instanceof String) {
		markdown.value = `\`\`\`js\n${value.toString()}\n\`\`\``
	} else {
		markdown.value = `\`\`\`js\n${typeof value}\n\`\`\``
	}

	return {
		range,
		contents: [markdown],
	}
}
