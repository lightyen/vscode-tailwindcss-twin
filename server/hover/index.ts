import { Connection, MarkupContent, MarkupKind } from "vscode-languageserver"

import { state } from "~/tailwind"
import { canHover } from "./canHover"
import { serializeError } from "serialize-error"

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
	if (twin) {
		if (value === "group" || value === "container") {
			return null
		}
		if (value === "content") {
			if (inputVariants.some(v => v === "before" || v === "after")) {
				return {
					kind: MarkupKind.Markdown,
					value: ["```scss", ".content {", '\tcontent: "";', "}", "```"].join("\n"),
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
	const common = inputVariants.filter(v => state.classnames.isCommonVariant(v, twin))
	const notCommon = inputVariants.filter(v => !common.includes(v))
	const meta = data
		.filter(d => {
			for (const context of d.__context) {
				for (const k in __variants) {
					if (!__variants[k].includes(context)) {
						continue
					}
					if (!notCommon.includes(k)) {
						return false
					}
				}
			}
			if (common.length === 0 && d.__pseudo.length > 0) {
				return false
			}
			return common.flatMap(v => __variants[v]).every(c => d.__pseudo.some(p => "&" + p === c))
		})
		.map(i =>
			Object.entries(i.decls).flatMap(([label, values]) => values.map<[string, string]>(v => [label, v])),
		)
		.flat()

	const result: Record<string, string> = {}
	for (const d of meta) {
		result[d[0]] = d[1]
	}
	const text = Object.entries(result)
		.map(i => `\t${i[0]}: ${i[1]}${important ? " !important" : ""};`)
		.join("\n")

	return {
		kind: MarkupKind.Markdown,
		value: ["```scss", `.${value.replace(/\//g, "\\/")} {\n${text}\n}`, "```"].join("\n"),
	}
}
