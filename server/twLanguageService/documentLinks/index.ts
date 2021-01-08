import type { DocumentLink } from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import findClasses from "~/findClasses"
import { Tailwind } from "~/tailwind"
import { InitOptions } from ".."
import docs from "./docs.yaml"
import { findAllMatch, PatternKind } from "~/ast"

function lastUrlToken(url: string) {
	if (url.includes("twin")) {
		return "twin"
	}
	const i = url.lastIndexOf("/")
	if (i === -1) {
		return ""
	}
	const token = url.substring(i + 1)
	return token
}

export const documentLinks = (document: TextDocument, state: Tailwind, _: InitOptions) => {
	const links: DocumentLink[] = []
	const s = new Set<number>()
	const tokens = findAllMatch(document)
	for (const { token, kind } of tokens) {
		const twin = kind === PatternKind.Twin
		const prefix = twin ? "tw." : ""
		const [start, , value] = token
		const { classList, empty } = findClasses({
			input: value,
			separator: state.separator,
		})
		for (const c of classList) {
			for (const [a, b, value] of c.variants) {
				const bg = state.classnames.getBreakingPoint(value)
				const iv = state.classnames.isVariant(value, twin)
				if (!bg && !iv) continue
				const target = docs[bg ? value : prefix + value]
				if (target && !s.has(start + a)) {
					links.push({
						target,
						tooltip: lastUrlToken(target),
						range: {
							start: document.positionAt(start + a),
							end: document.positionAt(start + b),
						},
					})
					s.add(start + a)
				}
			}
			const value = c.token[2]
			if (
				!state.classnames.isClassName(
					c.variants.map(v => v[2]),
					twin,
					value,
				)
			) {
				continue
			}
			if (value === "content" && c.variants.every(v => v[2] !== "before" && v[2] !== "after")) {
				continue
			}
			const target = docs[prefix + value] || docs[value]
			if (target) {
				links.push({
					target,
					tooltip: lastUrlToken(target),
					range: {
						start: document.positionAt(start + c.token[0]),
						end: document.positionAt(start + c.token[1]),
					},
				})
			}
		}
		for (const [, , variants] of empty) {
			for (const [a, b, value] of variants) {
				const bg = state.classnames.getBreakingPoint(value)
				const iv = state.classnames.isVariant(value, twin)
				if (!bg && !iv) continue
				const target = docs[bg ? value : prefix + value]
				if (target && !s.has(start + a)) {
					links.push({
						target,
						tooltip: lastUrlToken(target),
						range: {
							start: document.positionAt(start + a),
							end: document.positionAt(start + b),
						},
					})
					s.add(start + a)
				}
			}
		}
	}
	return links
}
