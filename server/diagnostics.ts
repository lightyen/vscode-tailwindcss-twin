import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver"
import { Range, TextDocument } from "vscode-languageserver-textdocument"

import { findMatch, getPatterns, Pattern, PatternKind } from "~/patterns"
import { connection, settings } from "~/server"
import { ClassInfo, findClasses } from "~/find"
import { state } from "./tailwind"
import { Token } from "./typings"

// TODO: add theme validate

export function validateTextDocument(document: TextDocument) {
	if (!settings.validate) {
		connection.sendDiagnostics({ uri: document.uri, diagnostics: [] })
		return
	}
	if (!state) {
		return
	}

	const text = document.getText()
	const diagnostics: Diagnostic[] = []
	const patterns = getPatterns(document.languageId, settings.twin)

	for (const pattern of patterns) {
		const { lpat, rpat, kind } = pattern
		if (kind === "twinTheme") {
			continue
		}
		findMatch({
			text,
			lpat,
			rpat,
		})
			.filter(v => v.length > 0)
			.forEach(([start, end]) => {
				const range: Range = { start: document.positionAt(start), end: document.positionAt(end) }
				const classes = document.getText(range)
				diagnostics.push(
					...validateClasses({ document, range, classes, pattern, separator: state.separator, kind }),
				)
			})
	}

	connection.sendDiagnostics({
		uri: document.uri,
		diagnostics,
	})
}

const source = "tailwindcss"

function validateClasses({
	document,
	range,
	classes,
	separator,
	kind,
	pattern: { handleBrackets, handleImportant },
}: {
	document: TextDocument
	range: Range
	classes: string
	separator: string
	pattern: Pattern
	kind: PatternKind
}): Diagnostic[] {
	const { classList, empty } = findClasses({ classes, separator, handleBrackets, handleImportant })
	const result: Diagnostic[] = []
	const base = document.offsetAt(range.start)

	if (kind === "twin") {
		classList.forEach(c => {
			result.push(...checkTwinClassName(c, document, base))
		})
	}

	function travel(obj: Record<string, Token[]>) {
		for (const k in obj) {
			const t = obj[k]
			const parts = k.split(".")
			const prop = parts[parts.length - 1]
			if (t.length > 1) {
				for (const token of t) {
					const message =
						settings.diagnostics.conflict === "strict"
							? `${token[2]} is conflicted on property: ${prop}`
							: `${token[2]} is conflicted`
					result.push({
						source,
						message,
						range: {
							start: document.positionAt(base + token[0]),
							end: document.positionAt(base + token[1]),
						},
						severity: DiagnosticSeverity.Warning,
					})
				}
			}
		}
	}

	if (settings.diagnostics.conflict !== "none") {
		const map: Record<string, Token[]> = {}
		for (let i = 0; i < classList.length; i++) {
			const variants = classList[i].variants.map(v => v[2])
			if (classList[i].important) {
				continue
			}
			const data = state.classnames.getClassNameRule(variants, kind === "twin", classList[i].token[2])
			if (!(data instanceof Array)) {
				if (kind !== "twin" && classList[i].token[2] === "group") {
					const key = [...data.__context, data.__scope, ...data.__pseudo, "group"].join(".")
					const target = map[key]
					if (target instanceof Array) {
						target.push(classList[i].token)
					} else {
						map[key] = [classList[i].token]
					}
				}
				continue
			}
			if (settings.diagnostics.conflict === "strict") {
				for (const d of data) {
					for (const property of Object.keys(d.decls)) {
						if (property.startsWith("--tw")) {
							continue
						}
						const key = [...d.__context, d.__scope, ...d.__pseudo, property].join(".")
						const target = map[key]
						if (target instanceof Array) {
							target.push(classList[i].token)
						} else {
							map[key] = [classList[i].token]
						}
					}
					if (d.__source === "components") {
						break
					}
				}
			} else if (settings.diagnostics.conflict === "loose") {
				const s = new Set<string>()
				for (const d of data) {
					for (const c of Object.keys(d.decls)) {
						s.add(c)
					}
				}
				const key = [...variants, Array.from(s).sort().join(":")].join(".")
				const target = map[key]
				if (target instanceof Array) {
					target.push(classList[i].token)
				} else {
					map[key] = [classList[i].token]
				}
			}
		}
		travel(map)
	}

	for (let i = 0; i < empty.length; i++) {
		result.push({
			source,
			message: `miss something?`,
			range: {
				start: document.positionAt(base + empty[i][0]),
				end: document.positionAt(base + empty[i][1]),
			},
			severity: DiagnosticSeverity.Warning,
		})
	}

	return result
}

function checkTwinClassName(info: ClassInfo, document: TextDocument, base: number) {
	const result: Diagnostic[] = []
	const variants = info.variants.map(v => v[2])
	for (const [a, b, value] of info.variants) {
		if (state.classnames.isVariant(value, true)) {
			continue
		}
		// TODO: use another approximate string matching method?
		const ans = state.classnames.getSearcher(variants, true).variants.search(value)
		if (ans?.length > 0) {
			result.push({
				source,
				message: `'${value}' is undefined, do you mean '${ans[0].item}'?`,
				range: {
					start: document.positionAt(base + a),
					end: document.positionAt(base + b),
				},
				severity: DiagnosticSeverity.Warning,
			})
		} else {
			result.push({
				source,
				message: `'${value}' is undefined`,
				range: {
					start: document.positionAt(base + a),
					end: document.positionAt(base + b),
				},
				severity: DiagnosticSeverity.Warning,
			})
		}
	}
	if (info.token[2]) {
		const variants = info.variants.map(v => v[2])
		if (!state.classnames.isClassName(variants, true, info.token[2])) {
			const ans = state.classnames.getSearcher(variants, true).classes.search(info.token[2])
			if (ans?.length > 0) {
				result.push({
					source,
					message: `'${info.token[2]}' is undefined, do you mean '${ans[0].item}'?`,
					range: {
						start: document.positionAt(base + info.token[0]),
						end: document.positionAt(base + info.token[1]),
					},
					severity: DiagnosticSeverity.Warning,
				})
			} else {
				result.push({
					source,
					message: `'${info.token[2]}' is undefined`,
					range: {
						start: document.positionAt(base + info.token[0]),
						end: document.positionAt(base + info.token[1]),
					},
					severity: DiagnosticSeverity.Warning,
				})
			}
		}
	}
	return result
}
