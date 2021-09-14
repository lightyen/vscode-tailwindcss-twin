import { escape } from "~/common/escape"
import { Tailwind } from "~/tailwind"
import type { RuleItem, Twin } from "~/tailwind/twin"
import { ServiceOptions } from "."

function toPixelUnit(value: string, rootFontSize: number | boolean) {
	if (rootFontSize === false) {
		return value
	}
	const reg = /(-?\d[.\d+e]*)rem/
	const match = reg.exec(value)
	if (!match) {
		return value
	}
	if (rootFontSize === true) {
		rootFontSize = 16
	}
	const [text, n] = match
	const val = parseFloat(n)
	if (Number.isNaN(val)) {
		return value
	}

	return value.replace(reg, text + `/** ${(rootFontSize * val).toFixed(0)}px */`)
}

export function renderVariant({ key, state }: { key: string; state: Tailwind }): string | undefined {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	// const key = selection.token!.token.text
	const data = state.twin.variants.get(key)
	const newline = "\n"

	if (data) {
		const text: string[] = []
		if (data.length === 0) {
			text.push(key)
		} else {
			text.push(`${data.join(", ")}`)
		}

		return ["```css", ...text, "```", newline].join(newline)
	}

	return undefined
}

export function renderClassname({
	key,
	state,
	important = false,
	options,
}: {
	key: string
	state: Tailwind
	important?: boolean
	options: ServiceOptions
}): string | undefined {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	// const key = selection.token!.token.text
	const rules = state.twin.classnames.get(key)
	const newline = "\n"
	const indent = "\t"
	function ruleToStrings(rule: RuleItem, indent: string, important: boolean) {
		const lines: string[] = [`.${escape(rule.name)}${rule.pseudo.join("")}${escape(rule.rest)} {`]
		for (const key in rule.decls) {
			for (const value of rule.decls[key]) {
				lines.push(
					`${indent}${key}: ${toPixelUnit(value, options.rootFontSize)}${important ? " !important" : ""};`,
				)
			}
		}
		lines.push(`}`)
		return lines
	}

	function indentConext(lines: string[], context: string, indent: string) {
		lines = lines.map(line => indent + line)
		lines.unshift(`${context} {`)
		lines.push(`}`)
		return lines
	}

	if (rules instanceof Array) {
		const lines: string[] = []
		for (const r of rules) {
			let ls = ruleToStrings(r, indent, important)
			for (const ctx of r.context) {
				ls = indentConext(ls, ctx, indent)
			}
			ls[ls.length - 1] += newline
			lines.push(...ls)
		}
		return ["```css", ...lines, "```", newline].join(newline)
	}

	return undefined
}

export function renderClassnameJIT({
	raw,
	twin,
	important = false,
	options,
}: {
	raw: string
	twin: Twin
	important?: boolean
	options: ServiceOptions
}): string | undefined {
	const key = raw.replace(/\s/g, "")
	const rules = twin.classnames.get(key)
	if (!rules) {
		return undefined
	}
	const newline = "\n"
	const indent = "\t"
	function ruleToStrings(rule: RuleItem, indent: string, important: boolean) {
		const lines: string[] = [`.${escape(raw)}${rule.pseudo.join("")}${escape(rule.rest)} {`]
		for (const key in rule.decls) {
			for (const value of rule.decls[key]) {
				lines.push(
					`${indent}${key}: ${toPixelUnit(value, options.rootFontSize)}${important ? " !important" : ""};`,
				)
			}
		}
		lines.push(`}`)
		return lines
	}

	function indentConext(lines: string[], context: string, indent: string) {
		lines = lines.map(line => indent + line)
		lines.unshift(`${context} {`)
		lines.push(`}`)
		return lines
	}

	if (rules instanceof Array) {
		const lines: string[] = []
		for (const r of rules) {
			let ls = ruleToStrings(r, indent, important)
			for (const ctx of r.context) {
				ls = indentConext(ls, ctx, indent)
			}
			ls[ls.length - 1] += newline
			lines.push(...ls)
		}
		return ["```css", ...lines, "```", newline].join(newline)
	}

	return undefined
}
