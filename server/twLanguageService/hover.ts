import * as lsp from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import { canMatch, PatternKind } from "~/common/ast"
import parseThemeValue from "~/common/parseThemeValue"
import { transformSourceMap } from "~/common/sourcemap"
import * as parser from "~/common/twin-parser"
import { cssDataManager, getEntryDescription } from "~/common/vscode-css-languageservice"
import type { TailwindLoader } from "~/tailwind"
import { getDescription, getReferenceLinks } from "./referenceLink"
import type { ServiceOptions } from "./service"

export default async function hover(
	document: TextDocument,
	position: lsp.Position,
	state: TailwindLoader,
	options: ServiceOptions,
): Promise<lsp.Hover | undefined> {
	try {
		const result = canMatch(document, position, true, options.jsxPropImportChecking)
		if (!result) {
			return undefined
		}
		const { token, kind } = result
		if (kind === PatternKind.TwinTheme) {
			const range = {
				start: document.positionAt(token.start),
				end: document.positionAt(token.end),
			}
			return resolveThemeValue({ kind, range, token, state, options })
		} else if (kind === PatternKind.TwinScreen) {
			const range = {
				start: document.positionAt(token.start),
				end: document.positionAt(token.end),
			}
			return resolveScreenValue({ kind, range, token, state, options })
		} else {
			const selection = parser.hover({
				text: token.value,
				position: document.offsetAt(position) - token.start,
				separator: state.separator,
			})
			if (!selection) {
				return undefined
			}

			const { start, end } = selection.target
			let value = selection.target.value

			const range = lsp.Range.create(
				document.positionAt(token.start + start),
				document.positionAt(token.start + end),
			)

			if (selection.type === parser.HoverResultType.CssProperty) {
				const prop = selection.prop?.toKebab() ?? ""
				const value = selection.value?.value ?? ""
				const important = selection.important

				const scssText = state.tw.renderCssProperty({
					prop,
					value,
					important,
					rootFontSize: options.rootFontSize,
				})

				const values = ["```scss", scssText, "```\n"]

				const entry = cssDataManager.getProperty(prop)
				if (entry) {
					values.unshift(getEntryDescription(entry, true).value + "\n\n---\n")
				}

				return {
					range,
					contents: {
						kind: lsp.MarkupKind.Markdown,
						value: values.join("\n"),
					},
				}
			}

			if (kind !== PatternKind.Twin) {
				return undefined
			}

			let cssText = ""
			if (selection.type === parser.HoverResultType.Variant) {
				cssText = state.tw.renderVariant(value)
			} else {
				cssText = state.tw.renderClassname({
					classname: value,
					important: selection.important,
					rootFontSize: options.rootFontSize,
				})
			}

			let markdown: lsp.MarkupContent | undefined

			if (cssText) {
				markdown = {
					kind: lsp.MarkupKind.Markdown,
					value: ["```scss", cssText, "```", "\n"].join("\n"),
				}
			} else {
				// try anoather keyword
				const i = value.lastIndexOf("/")
				if (i !== -1) {
					value = value.slice(0, i)
				}
			}

			if (options.references) {
				let title = ""
				const keyword = value.replace(new RegExp(`^${state.config.prefix}`), "")
				let name: string | undefined = state.tw.getPlugin(keyword)?.name
				if (!name) {
					name = keyword
				}
				if (name) {
					const type = getDescription(name)
					if (type) {
						title = type + "\n"
					}

					if (type === "") {
						title = "twin" + "\n"
					}

					const refs = getReferenceLinks(name)

					if (refs.length > 0) {
						title += "\n" + refs.map(ref => `[Reference](${ref.url}) `).join("\n") + "\n"
					}
				}

				if (!markdown) {
					markdown = {
						kind: lsp.MarkupKind.Markdown,
						value: "",
					}
				}

				if (title) markdown.value = `${title}\n---\n\n` + markdown.value
			}

			if (!markdown) return undefined

			return {
				range,
				contents: markdown,
			}
		}
	} catch (error) {
		const err = error as Error
		if (err.stack) err.stack = transformSourceMap(options.serverSourceMapUri.fsPath, err.stack)
		console.error(`[${new Date().toLocaleString()}]`, err)
		console.error("hover failed.")
	}
	return undefined
}

function resolveThemeValue({
	range,
	token,
	state,
}: {
	kind: PatternKind
	range: lsp.Range
	token: parser.Token
	state: TailwindLoader
	options: ServiceOptions
}): lsp.Hover | undefined {
	const result = parseThemeValue(token.value)
	if (result.errors.length > 0) {
		return undefined
	}

	const value = state.tw.getTheme(result.keys(), true)

	const markdown: lsp.MarkupContent = {
		kind: lsp.MarkupKind.Markdown,
		value: "",
	}

	if (typeof value === "string") {
		markdown.value = `\`\`\`txt\n${value}\n\`\`\``
	} else if (value instanceof Array) {
		markdown.value = `\`\`\`txt\n${value.join(", ")}\n\`\`\``
	} else if (value) {
		markdown.value = `\`\`\`js\n${value.toString?.() ?? typeof value}\n\`\`\``
	}

	return {
		range,
		contents: markdown,
	}
}

function resolveScreenValue({
	range,
	token,
	state,
}: {
	kind: PatternKind
	range: lsp.Range
	token: parser.Token
	state: TailwindLoader
	options: ServiceOptions
}): lsp.Hover | undefined {
	const value = state.tw.getTheme(["screens", token.value])
	if (value == undefined) {
		return
	}

	const markdown: lsp.MarkupContent = {
		kind: lsp.MarkupKind.Markdown,
		value: "",
	}

	if (typeof value === "string") {
		markdown.value = `\`\`\`css\n@media (min-width: ${value})\n\`\`\``
	} else if (value instanceof Array) {
		markdown.value = `\`\`\`txt\n${value.join(", ")}\n\`\`\``
	} else if (value) {
		markdown.value = `\`\`\`js\n${value.toString?.() ?? typeof value}\n\`\`\``
	}

	return {
		range,
		contents: markdown,
	}
}
