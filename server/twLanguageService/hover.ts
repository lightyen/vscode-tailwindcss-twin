import { serializeError } from "serialize-error"
import * as lsp from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import { canMatch, PatternKind } from "~/common/ast"
import parseThemeValue from "~/common/parseThemeValue"
import * as parser from "~/common/twin-parser"
import { Tailwind } from "~/tailwind"
import type { ServiceOptions } from "~/twLanguageService"
import { cssDataManager, getEntryDescription } from "./cssData"
import { renderClassname, renderVariant } from "./markdown"
import { getDescription, getReferenceLinks } from "./referenceLink"

export default function hover(
	document: TextDocument,
	position: lsp.Position,
	state: Tailwind,
	options: ServiceOptions,
): lsp.Hover | undefined {
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
		} else {
			const selection = parser.hover({
				text: token.value,
				position: document.offsetAt(position) - token.start,
				separator: state.separator,
			})
			if (!selection) {
				return undefined
			}

			const { start, end, value } = selection.target
			const range = lsp.Range.create(
				document.positionAt(token.start + start),
				document.positionAt(token.start + end),
			)

			if (selection.type === parser.HoverResultType.CssProperty) {
				const key = selection.prop?.toKebab() ?? ""
				const value = selection.value?.value ?? ""
				const important = selection.important

				const values = [
					"```scss",
					"& {",
					`\t${key}: ${parser.formatCssValue(parser.removeComments(value))}${
						important ? " !important" : ""
					};`,
					"}",
					"```\n",
				]

				const entry = cssDataManager.getProperty(key)
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

			if (
				selection.type === parser.HoverResultType.ClassName &&
				!state.twin.isSuggestedClassName(selection.variants.texts, selection.target.value)
			) {
				return undefined
			}

			const markdown = getHoverTwinMarkdown({
				kind,
				selection,
				state,
				options,
			})

			if (!markdown) {
				return undefined
			}

			const keyword = value.replace(new RegExp(`^${state.config.prefix}`), "").replace(state.separator, "")
			let title = ""
			if (options.references) {
				const type = getDescription(keyword)
				if (type) {
					title = type + "\n"
				}

				if (type === "") {
					title = "twin.macro" + "\n"
				}

				const refs = getReferenceLinks(keyword)
				if (refs.length > 0) {
					title += "\n" + refs.map(ref => `[Reference](${ref.url}) `).join("\n") + "\n"
				}
			}

			if (title) {
				markdown.value = `${title}\n---\n\n` + markdown.value
			}

			if (!title && options.references) {
				markdown.value = "custom\n" + "\n---\n\n" + markdown.value
			}

			return {
				range,
				contents: markdown,
			}
		}
	} catch (err) {
		console.log(serializeError(err))
	}
	return undefined
}

function getHoverTwinMarkdown({
	kind,
	selection,
	state,
	options,
}: {
	kind: PatternKind
	selection: Exclude<ReturnType<typeof parser.hover>, undefined>
	state: Tailwind
	options: ServiceOptions
}): lsp.MarkupContent | undefined {
	const { important } = selection

	const value = selection.target.value

	if (selection.type === parser.HoverResultType.Variant) {
		const content = renderVariant({ state, key: value })
		if (content) {
			return { kind: lsp.MarkupKind.Markdown, value: content }
		}
		return undefined
	}

	if (selection.type !== parser.HoverResultType.ClassName) {
		return undefined
	}

	const content = renderClassname({ state, key: value, important, options })
	if (content) {
		return { kind: lsp.MarkupKind.Markdown, value: content }
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
	state: Tailwind
	options: ServiceOptions
}): lsp.Hover | undefined {
	const result = parseThemeValue(token.value)
	if (result.errors.length > 0) {
		return undefined
	}

	const value = state.getTheme(result.keys())

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
