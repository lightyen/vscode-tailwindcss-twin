import { Tailwind } from "~/tailwind"
import type { RuleItem } from "~/tailwind/twin"

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

		return ["```scss", ...text, "```", newline].join(newline)
	}

	return undefined
}

export function renderClassname({
	key,
	state,
	important = false,
}: {
	key: string
	state: Tailwind
	important?: boolean
}): string | undefined {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	// const key = selection.token!.token.text
	const rules = state.twin.classnames.get(key)
	const newline = "\n"
	const indent = "\t"
	function ruleToStrings(rule: RuleItem, indent: string, important: boolean) {
		console.dir(rule, { depth: null })
		const lines: string[] = [`.${rule.name}${rule.pseudo.join("")}${rule.rest} {`.replace(/\//g, "\\/")]
		for (const key in rule.decls) {
			for (const value of rule.decls[key]) {
				lines.push(`${indent}${key}: ${value}${important ? " !important" : ""};`)
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
			let ls = ruleToStrings(r, "\t", important)
			for (const ctx of r.context) {
				ls = indentConext(ls, ctx, indent)
			}
			ls[ls.length - 1] += newline
			lines.push(...ls)
		}
		return ["```scss", ...lines, "```", newline].join(newline)
	}

	return undefined
}
