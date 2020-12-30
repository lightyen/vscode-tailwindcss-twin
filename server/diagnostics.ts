import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver"
import { Range, TextDocument } from "vscode-languageserver-textdocument"
import { ClassInfo, findClasses } from "~/find"
import type { InitOptions } from "./twLanguageService"
import type { Tailwind } from "./tailwind"
import type { Token } from "./typings"
import { findAllToken, getScriptKind, PatternKind } from "~/ast"
import ts from "typescript"

const source = "tailwindcss"

export function validate(document: TextDocument, state: Tailwind, initOptions: InitOptions) {
	const diagnostics: Diagnostic[] = []
	const src = ts.createSourceFile(
		"",
		document.getText(),
		ts.ScriptTarget.Latest,
		false,
		getScriptKind(document.languageId),
	)
	const tokens = findAllToken(src, initOptions.twin)
	for (const { token, kind } of tokens) {
		const [start, end, value] = token
		const range: Range = { start: document.positionAt(start), end: document.positionAt(end) }
		if (kind === PatternKind.TwinTheme) {
			const v = state.getTheme(value.split("."))
			if (v == undefined) {
				diagnostics.push({
					range,
					source,
					message: `${value} is undefined`,
					severity: DiagnosticSeverity.Error,
				})
			}
		} else {
			diagnostics.push(
				...validateClasses({
					document,
					range,
					classes: value,
					separator: state.separator,
					kind,
					diagnostics: initOptions.diagnostics,
					state,
				}),
			)
		}
	}
	return diagnostics
}

function validateClasses({
	document,
	range,
	classes,
	separator,
	kind,
	state,
	diagnostics,
}: {
	document: TextDocument
	range: Range
	classes: string
	separator: string
	kind: PatternKind
	state: Tailwind
	diagnostics: InitOptions["diagnostics"]
}): Diagnostic[] {
	const handleBrackets = kind === PatternKind.Twin
	const handleImportant = kind === PatternKind.Twin
	const { classList, empty } = findClasses({ classes, separator, handleBrackets, handleImportant })
	const result: Diagnostic[] = []
	const base = document.offsetAt(range.start)

	if (kind === PatternKind.Twin) {
		classList.forEach(c => {
			result.push(...checkTwinClassName(c, document, base, state))
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
						diagnostics.conflict === "strict"
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

	if (diagnostics.conflict !== "none") {
		const map: Record<string, Token[]> = {}
		for (let i = 0; i < classList.length; i++) {
			const variants = classList[i].variants.map(v => v[2])
			if (classList[i].important) {
				continue
			}
			const data = state.classnames.getClassNameRule(variants, kind === PatternKind.Twin, classList[i].token[2])
			if (!(data instanceof Array)) {
				if (kind !== PatternKind.Twin && classList[i].token[2] === "group") {
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
			if (diagnostics.conflict === "strict") {
				for (const d of data) {
					let twinKeys: string[] = []
					if (kind === PatternKind.Twin) {
						twinKeys = variants.sort()
					}
					for (const property of Object.keys(d.decls)) {
						if (property.startsWith("--tw")) {
							continue
						}
						const key = [...d.__context, d.__scope, ...d.__pseudo, ...twinKeys, property].join(".")
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
			} else if (diagnostics.conflict === "loose") {
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

function checkTwinClassName(info: ClassInfo, document: TextDocument, base: number, state: Tailwind) {
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
