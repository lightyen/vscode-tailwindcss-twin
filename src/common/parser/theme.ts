import { dlv } from "../get_set"
import * as nodes from "./nodes"
import { parse_theme } from "./parse_theme"

export function resolveThemeFunc(config: Tailwind.ResolvedConfigJS, value: string): string {
	let start = 0
	let ret = ""
	for (const node of parse_theme({ text: value })) {
		const ans = node.value.others ? "" : theme(config, node)
		ret += value.slice(start, node.range[0]) + ans
		start = node.range[1]
	}
	if (start < value.length) {
		ret += value.slice(start)
	}
	return ret.trim()

	function theme(
		config: Tailwind.ResolvedConfigJS,
		node: nodes.ThemeFunctionNode | nodes.ThemeValueNode,
		useDefault = false,
	): string {
		if (node.type === nodes.NodeType.ThemeFunction) node = node.value
		return resolveThemeString(
			resolveThemeConfig(
				config,
				node.path.map(p => {
					return p.value
				}),
				useDefault,
			),
			node.suffix?.value,
		)
	}
}

export function resolveThemeConfig(config: Tailwind.ResolvedConfigJS, path: string[], useDefault = false) {
	let value = dlv(config.theme, path)
	if (useDefault && value?.["DEFAULT"] != undefined) {
		value = value["DEFAULT"]
	}
	return value
}

export function resolveThemeString(value: unknown, opacityValue = "1") {
	if (value == null) return `[${value}]`
	if (typeof value === "object") {
		if (Array.isArray(value)) return `Array[${value.join(", ")}]`
		return (
			`Object{\n` +
			Object.keys(value)
				.map(k => `\t"${k}": "...",\n`)
				.join("") +
			"}\n"
		)
	}
	if (typeof value === "function") {
		value = String(value({ opacityValue }))
	}
	if (typeof value === "string") {
		let replaced = false
		const result = value.replace("<alpha-value>", match => {
			replaced = true
			return opacityValue
		})
		if (replaced) return result
		else {
			const match =
				/(\w+)\(\s*([\d.]+(?:%|deg|rad|grad|turn)?\s*,?\s*)([\d.]+(?:%|deg|rad|grad|turn)?\s*,?\s*)([\d.]+(?:%|deg|rad|grad|turn)?)/.exec(
					value,
				)
			if (match == null) {
				const rgb = parseHexColor(value)
				if (rgb == null) return value
				const r = (rgb >> 16) & 0xff
				const g = (rgb >> 8) & 0xff
				const b = rgb & 0xff
				return `rgb(${r} ${g} ${b} / ${opacityValue})`
			}
			const [, fn, a, b, c] = match
			return `${fn}(${a.replaceAll(" ", "")} ${b.replaceAll(" ", "")} ${c.replaceAll(" ", "")}${
				(a.indexOf(",") === -1 ? " / " : ", ") + opacityValue
			})`
		}
	}
	return String(value)
}

function parseHexColor(value: string): number | null {
	const result = /(?:^#?([A-Fa-f0-9]{6})(?:[A-Fa-f0-9]{2})?$)|(?:^#?([A-Fa-f0-9]{3})[A-Fa-f0-9]?$)/.exec(value)
	if (result !== null) {
		if (result[1]) {
			const v = parseInt(result[1], 16)
			return Number.isNaN(v) ? null : v
		} else if (result[2]) {
			const v = parseInt(result[2], 16)
			if (!Number.isNaN(v)) {
				let r = v & 0xf00
				let g = v & 0xf0
				let b = v & 0xf
				r = (r << 12) | (r << 8)
				g = (g << 8) | (g << 4)
				b = (b << 4) | b
				return r | g | b
			}
		}
	}
	return null
}
