import type { DocumentLink } from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import { findClasses } from "~/find"
import { findMatch, getPatterns } from "~/patterns"
import { Tailwind } from "~/tailwind"
import { InitOptions } from ".."
import docs from "./docs.yaml"

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

export const documentLinks = (document: TextDocument, state: Tailwind, { twin }: InitOptions) => {
	const patterns = getPatterns(document.languageId, twin)
	const links: DocumentLink[] = []
	const text = document.getText()
	const s = new Set<number>()
	for (const { lpat, rpat, handleBrackets, handleImportant, kind } of patterns) {
		if (kind === "twinTheme") {
			continue
		}
		const twin = kind === "twin"
		const prefix = twin ? "tw." : ""
		findMatch({
			text,
			lpat,
			rpat,
		})
			.filter(v => v.length > 0)
			.forEach(([start, end]) => {
				const a = document.positionAt(start)
				const b = document.positionAt(end)
				const classes = document.getText({ start: a, end: b })
				const { classList, empty } = findClasses({
					classes,
					separator: state.separator,
					handleBrackets,
					handleImportant,
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
			})
	}
	return links
}
