import { dlv } from "../get_set"
import { NodeType, ThemePathNode } from "./nodes"
import { parse_theme, parse_theme_val } from "./parse_theme"

export function resolveThemeFunc(config: Tailwind.ResolvedConfigJS, value: string): string {
	let start = 0
	let ret = ""

	for (const node of parse_theme({ text: value })) {
		const result = theme(config, node.value.path)
		const val = result.value !== undefined ? renderThemeValue(result) : ""
		ret += value.slice(start, node.range[0]) + val
		start = node.range[1]
	}

	if (start < value.length) {
		ret += value.slice(start)
	}
	return ret.trim()
}

export function parseThemeValue({
	config,
	useDefault,
	text,
	start = 0,
	end = text.length,
}: {
	config: Tailwind.ResolvedConfigJS
	useDefault?: boolean
	text: string
	start?: number
	end?: number
}) {
	const node = parse_theme_val({ text, start, end })
	const value = resolvePath(config.theme, node.path, useDefault)
	if (value === undefined) {
		const ret = tryOpacityValue(node.path)
		if (ret.opacityValue) {
			node.path = ret.path
		}
	}
	return { path: node.path, range: node.range }
}

export function theme(config: Tailwind.ResolvedConfigJS, path: ThemePathNode[], useDefault = false) {
	let opacityValue: string | undefined
	let value = resolvePath(config.theme, path, useDefault)
	if (value === undefined) {
		const ret = tryOpacityValue(path)
		if (ret.opacityValue) {
			value = resolvePath(config.theme, ret.path, useDefault)
			opacityValue = ret.opacityValue
			path = ret.path
		}
	}
	return { value, opacityValue }
}

function tryOpacityValue(path: ThemePathNode[]) {
	let opacityValue: string | undefined
	let arr = path.slice().reverse()
	let end: number | undefined
	for (let i = 0; i < arr.length; i++) {
		const n = arr[i]
		const x = n.value.lastIndexOf("/")
		if (x === -1) {
			if (end != undefined && end !== n.range[1]) {
				return { path }
			}
			end = n.range[0]
			opacityValue = n.toString() + (opacityValue ?? "")
			continue
		}

		opacityValue = n.value.slice(x + 1) + (opacityValue ?? "")

		const raw = n.toString()
		const k = raw.lastIndexOf("/")
		const rest = raw.slice(0, k)

		if (end != undefined && rest !== "" && end !== n.range[1]) {
			return { path }
		}

		if (rest === "") {
			arr = arr.slice(i + 1)
			break
		}

		const t: ThemePathNode = { ...n, range: [n.range[0], n.range[1]] }
		t.value = n.value.slice(0, n.value.lastIndexOf("/"))
		t.range[1] = t.range[0] + k
		arr[i] = t
		arr = arr.slice(i)

		break
	}

	arr = arr.reverse()
	return { path: arr, opacityValue }
}

export function renderThemePath(
	config: Tailwind.ResolvedConfigJS,
	path: Array<string | ThemePathNode>,
	useDefault = false,
): string {
	const keys = path.map<ThemePathNode>(value => {
		if (typeof value !== "string") return value
		return {
			type: NodeType.ThemePath,
			closed: true,
			value,
			range: [0, value.length],
			toString() {
				return "." + value
			},
		}
	})
	return renderThemeValue(theme(config, keys, useDefault))
}

export function resolvePath(obj: unknown, path: Array<string | ThemePathNode>, useDefault = false): unknown {
	const keys = path.map<string>(p => (typeof p === "string" ? p : p.value))
	let value = dlv(obj, keys)
	if (useDefault && value?.["DEFAULT"] != undefined) {
		value = value["DEFAULT"]
	}
	return value
}

export function renderThemeValue({ value, opacityValue }: { value?: unknown; opacityValue?: string } = {}) {
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
		value = String(value({ opacityValue: opacityValue ?? "1" }))
	}
	if (opacityValue && typeof value === "string") {
		let replaced = false
		const result = value.replace("<alpha-value>", _ => {
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
