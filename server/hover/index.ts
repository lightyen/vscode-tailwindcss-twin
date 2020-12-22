import { Connection, MarkupContent, MarkupKind } from "vscode-languageserver"

import { state } from "~/tailwind"
import { canHover } from "./canHover"
import { serializeError } from "serialize-error"
import produce from "immer"

export const hover: Parameters<Connection["onHover"]>[0] = async params => {
	try {
		if (!state) {
			return null
		}
		const result = canHover(params)
		if (!result) {
			return null
		}
		const { range, ...rest } = result
		return { range, contents: await getHoverContents(rest) }
	} catch (err) {
		console.log(serializeError(err))
		return null
	}
}

export default hover

async function getHoverContents({
	important,
	value,
	variants,
	kind,
}: Omit<ReturnType<typeof canHover>, "range">): Promise<MarkupContent> {
	const twin = kind === "twin"
	const inputVariants = variants.map(([, , v]) => v)
	const common = inputVariants.filter(v => state.classnames.isCommonVariant(twin, v))
	const notCommon = inputVariants.filter(v => !common.includes(v))

	if (twin) {
		if (value === "group" || value === "container") {
			return null
		}
		if (value === "content") {
			const i = common.findIndex(v => v === "before" || v === "after")
			if (i !== -1) {
				return {
					kind: MarkupKind.Markdown,
					value: ["```scss", `.content::${common[i]} {`, '\tcontent: "";', "}", "```"].join("\n"),
				}
			}
			return null
		}
	}

	if (state.classnames.isVariant(value, twin)) {
		const data = state.classnames.getVariants(twin)[value]
		if (data) {
			const text: string[] = []
			if (data.length === 0) {
				text.push(value)
			} else {
				text.push(`${data.join(", ")}`)
			}
			return {
				kind: MarkupKind.Markdown,
				value: ["```scss", ...text, "```"].join("\n"),
			}
		}
		return null
	}

	const data = state.classnames.getClassNameRule(inputVariants, twin, value)
	if (!data) {
		return null
	}

	if (!(data instanceof Array)) {
		if (data.__pseudo) {
			return {
				kind: MarkupKind.Markdown,
				value: ["```scss", data.__pseudo.map(v => `.${value}${v}`).join("\n"), "```"].join("\n"),
			}
		}
		return null
	}

	const __variants = state.classnames.getVariants(twin)
	const variantValues = common.flatMap(c => __variants[c])

	const filterContext: boolean[] = []
	const meta = produce(data, draft => {
		for (let i = 0; i < draft.length; i++) {
			const d = draft[i]
			if (
				!d.__context.every(context => {
					const e = Object.entries(__variants).find(([, values]) => values.includes(context))
					if (!e) {
						return false
					}
					return notCommon.includes(e[0])
				})
			) {
				filterContext.push(false)
				continue
			}
			if (d.__source === "components") {
				filterContext.push(true)
				continue
			}
			if (variantValues.length === 0) {
				if (d.__pseudo.length > 0) {
					filterContext.push(false)
					continue
				}
				if (d.__scope) {
					filterContext.push(false)
					continue
				}
			}
			if (d.__scope) {
				filterContext.push(variantValues.includes(d.__scope))
				continue
			}
			if (twin && common.every(c => state.classnames.isVariant(c, twin) && !state.classnames.baseVariants[c])) {
				if (d.__pseudo.length === 0) {
					d.__pseudo = variantValues // inject pseudoes
				}
				filterContext.push(true)
				continue
			}
			filterContext.push(variantValues.every(c => d.__pseudo.some(p => p === c)))
			continue
		}
	})

	const blocks: Map<string, string[]> = new Map()
	meta.filter((_, i) => filterContext[i])
		.map(rule => {
			const selector = value + rule.__pseudo.join("")
			const decls = Object.entries(rule.decls).flatMap(([prop, values]) =>
				values.map<[string, string]>(v => [prop, v]),
			)
			return { scope: rule.__scope ? rule.__scope + " " : "", selector, decls }
		})
		.map(c => {
			const selector = `${c.scope}.${c.selector.replace(/\//g, "\\/")}`
			if (!blocks.has(selector)) {
				blocks.set(selector, [])
			}
			blocks
				.get(selector)
				.push(...c.decls.map(([prop, value]) => `${prop}: ${value}${important ? " !important" : ""};`))
		})

	return {
		kind: MarkupKind.Markdown,
		value: [
			"```scss",
			...Array.from(blocks).map(([selector, contents]) => {
				return `${selector} {\n${contents.map(c => `\t${c}`).join("\n")}\n}`
			}),
			"```",
		].join("\n"),
	}
}
