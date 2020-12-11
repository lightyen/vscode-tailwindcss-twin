import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver"
import { Range, TextDocument } from "vscode-languageserver-textdocument"

import { findMatch, getPatterns, Pattern, PatternKind } from "~/patterns"
import { connection, settings } from "~/server"
import { ClassInfo, findClasses } from "~/find"
import { isVariant, getValidVariantNames, isValidClassName, getValidClassNames, getSeparator } from "./common"
import leven from "leven"
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
					...validateClasses({ document, range, classes, pattern, separator: getSeparator(), kind }),
				)
			})
	}

	connection.sendDiagnostics({
		uri: document.uri,
		diagnostics,
	})
}

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
	const { classList } = findClasses({ classes, separator, handleBrackets, handleImportant })
	const result: Diagnostic[] = []
	const values = classList.map(c => [...c.variants.map(v => v[2]), c.token[2]].join(separator))
	const base = document.offsetAt(range.start)
	for (let i = 0; i < classList.length; i++) {
		result.push(...checkClassName(classList[i], kind, document, base))
		for (let j = i + 1; j < classList.length; j++) {
			if (values[i] === values[j]) {
				// duplicate
				result.push({
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

	return result
}

function checkClassName(info: ClassInfo, kind: PatternKind, document: TextDocument, base: number) {
	const twin = kind === "twin"
	const result: Diagnostic[] = []
	for (const [a, b, value] of info.variants) {
		if (isVariant(value, twin)) {
			continue
		}
		let answer = value
		let distance = +Infinity
		for (const v of getValidVariantNames(twin)) {
			const d = leven(value, v)
			if (distance > d) {
				answer = v
				distance = d
			}
		}
		result.push({
			message: `'${value}' is undefined, do you mean '${answer}'?`,
			range: {
				start: document.positionAt(base + a),
				end: document.positionAt(base + b),
			},
			severity: DiagnosticSeverity.Information,
		})
	}
	if (info.token) {
		const variants = info.variants.map(v => v[2])
		if (!isValidClassName(variants, info.token[2], twin)) {
			let answer = info.token[2]
			let distance = +Infinity
			for (const v of getValidClassNames(variants, twin)) {
				const d = leven(info.token[2], v)
				if (distance > d) {
					answer = v
					distance = d
				}
			}

			result.push({
				message: `'${info.token[2]}' is undefined, do you mean '${answer}'?`,
				range: {
					start: document.positionAt(base + info.token[0]),
					end: document.positionAt(base + info.token[1]),
				},
				severity: DiagnosticSeverity.Information,
			})
		}
	}
	return result
}
