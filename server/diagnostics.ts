import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver"
import { Range, TextDocument } from "vscode-languageserver-textdocument"

import { findMatch, getPatterns, Pattern, PatternKind } from "~/patterns"
import { connection, settings } from "~/server"
import { ClassInfo, findClasses } from "~/find"
import { state } from "./tailwind"
import { dlv, dset } from "./tailwind/classnames"

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
	const patterns = getPatterns({ document })

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

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function travel(obj: any) {
		for (const k in obj) {
			const t = obj[k]
			if (t instanceof Array) {
				if (t.length > 1) {
					for (const token of t) {
						result.push({
							source,
							message: `${token[2]} is conflicted on property: ${k}`,
							range: {
								start: document.positionAt(base + token[0]),
								end: document.positionAt(base + token[1]),
							},
							severity: DiagnosticSeverity.Warning,
						})
					}
				}
			} else {
				travel(t)
			}
		}
	}

	if (settings.diagnostics.conflict) {
		const map = {}
		for (let i = 0; i < classList.length; i++) {
			const variants = classList[i].variants.map(v => v[2])
			if (classList[i].important) {
				continue
			}
			const data = state.classnames.getClassNameRule(variants, kind === "twin", classList[i].token[2])
			if (!(data instanceof Array)) {
				if (kind !== "twin" && classList[i].token[2] === "group") {
					const target = dlv(map, [...variants, "group"])
					if (target instanceof Array) {
						target.push(classList[i].token)
					} else {
						dset(map, [...variants, "group"], [classList[i].token])
					}
				}
				continue
			}
			for (const d of data) {
				for (const property of Object.keys(d.decls)) {
					const target = dlv(map, [...variants, property])
					if (target instanceof Array) {
						target.push(classList[i].token)
					} else {
						dset(map, [...variants, property], [classList[i].token])
					}
				}
				if (d.__source === "components") {
					break
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
		if (!state.classnames.isClassName(info.token[2], variants, true)) {
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
