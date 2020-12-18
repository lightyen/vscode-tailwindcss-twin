import { Connection, DocumentLink } from "vscode-languageserver"
import { documents, settings } from "~/server"
import { findClasses } from "~/find"
import { findMatch, getPatterns } from "~/patterns"

import docs from "./docs.yaml"
import { state } from "~/tailwind"

function lastUrlToken(url: string) {
	if (url.includes("twin.macro")) {
		return "twin"
	}
	const i = url.lastIndexOf("/")
	if (i === -1) {
		return ""
	}
	const token = url.substring(i + 1)
	return token
}

export const documentLinks: Parameters<Connection["onDocumentLinks"]>[0] = async ({ textDocument }) => {
	if (!settings.links) {
		return []
	}
	if (!state) {
		return []
	}
	const document = documents.get(textDocument.uri)
	const patterns = getPatterns({ document })
	const links: DocumentLink[] = []
	const text = document.getText()
	const s = new Set<number>()
	for (const { lpat, rpat, handleBrackets, handleImportant, kind } of patterns) {
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
					let value = c.token[2]
					switch (value) {
						case "group":
						case "container":
							value = prefix + value
							break
						case "content":
							if (c.variants.every(v => v[2] !== "before" && v[2] !== "after")) {
								continue
							}
							value = prefix + value
							break
					}
					const target = docs[value]
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
