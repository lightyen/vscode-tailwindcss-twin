import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver"
import { Range, TextDocument } from "vscode-languageserver-textdocument"

import { findMatch, getPatterns, Pattern, PatternKind } from "~/patterns"
import { connection, settings } from "~/server"
import { ClassInfo, findClasses } from "~/find"
import { state } from "./tailwind"

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
	const values = classList.map(c => [...c.variants.map(v => v[2]), c.token[2]].join(separator))
	const base = document.offsetAt(range.start)
	for (let i = 0; i < classList.length; i++) {
		result.push(...checkClassName(classList[i], kind, document, base))
		for (let j = i + 1; j < classList.length; j++) {
			if (values[i] === values[j]) {
				// TODO: make it more user friendly
				result.push({
					source,
					message: `Classname '${values[j]}' is duplicated.`,
					range: {
						start: document.positionAt(base + classList[j].token[0]),
						end: document.positionAt(base + classList[j].token[1]),
					},
					severity: DiagnosticSeverity.Warning,
					relatedInformation: [
						{
							location: {
								uri: document.uri,
								range: {
									start: document.positionAt(base + classList[i].token[0]),
									end: document.positionAt(base + classList[i].token[1]),
								},
							},
							message: values[i],
						},
					],
				})
			}
		}
	}
	for (let i = 0; i < empty.length; i++) {
		result.push({
			source,
			message: `Miss something?`,
			range: {
				start: document.positionAt(base + empty[i][0]),
				end: document.positionAt(base + empty[i][1]),
			},
			severity: DiagnosticSeverity.Warning,
		})
	}

	return result
}

function checkClassName(info: ClassInfo, kind: PatternKind, document: TextDocument, base: number) {
	const twin = kind === "twin"
	const result: Diagnostic[] = []
	const variants = info.variants.map(v => v[2])
	for (const [a, b, value] of info.variants) {
		if (state.classnames.isVariant(value, twin)) {
			continue
		}
		// TODO: use another approximate string matching method?
		const ans = state.classnames.getSearcher(variants, twin).variants.search(value)
		if (ans?.length > 0) {
			result.push({
				source,
				message: `'${value}' is undefined, do you mean '${ans[0].item}'?`,
				range: {
					start: document.positionAt(base + a),
					end: document.positionAt(base + b),
				},
				severity: DiagnosticSeverity.Information,
			})
		} else {
			result.push({
				source,
				message: `'${value}' is undefined.`,
				range: {
					start: document.positionAt(base + a),
					end: document.positionAt(base + b),
				},
				severity: DiagnosticSeverity.Information,
			})
		}
	}
	if (info.token) {
		const variants = info.variants.map(v => v[2])
		if (info.token[2] === "") {
			result.push({
				source,
				message: `Miss something?`,
				range: {
					start: document.positionAt(base + info.token[0]),
					end: document.positionAt(base + info.token[1]),
				},
				severity: DiagnosticSeverity.Warning,
			})
		} else if (!state.classnames.isClassName(info.token[2], variants, twin)) {
			const ans = state.classnames.getSearcher(variants, twin).classes.search(info.token[2])
			if (ans?.length > 0) {
				result.push({
					source,
					message: `'${info.token[2]}' is undefined, do you mean '${ans[0].item}'?`,
					range: {
						start: document.positionAt(base + info.token[0]),
						end: document.positionAt(base + info.token[1]),
					},
					severity: DiagnosticSeverity.Information,
				})
			} else {
				result.push({
					source,
					message: `'${info.token[2]}' is undefined.`,
					range: {
						start: document.positionAt(base + info.token[0]),
						end: document.positionAt(base + info.token[1]),
					},
					severity: DiagnosticSeverity.Information,
				})
			}
		}
	}
	return result
}
