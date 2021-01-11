import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import findClasses, { ClassInfo } from "~/findClasses"
import type { InitOptions } from "./twLanguageService"
import type { Tailwind } from "./tailwind"
import type { Token } from "./typings"
import { findAllMatch, PatternKind } from "~/ast"

const source = "tailwindcss"

export function validate(document: TextDocument, state: Tailwind, initOptions: InitOptions) {
	const diagnostics: Diagnostic[] = []
	const tokens = findAllMatch(document)
	for (const { token, kind } of tokens) {
		const [start, end, value] = token
		if (kind === PatternKind.TwinTheme) {
			const v = state.getTheme(value.split("."))
			if (v == undefined) {
				diagnostics.push({
					range: { start: document.positionAt(start), end: document.positionAt(end) },
					source,
					message: `Can't find ${value}`,
					severity: DiagnosticSeverity.Error,
				})
			}
		} else {
			diagnostics.push(
				...validateClasses({
					document,
					offset: start,
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
	offset,
	classes,
	separator,
	kind,
	state,
	diagnostics,
}: {
	document: TextDocument
	offset: number
	classes: string
	separator: string
	kind: PatternKind
	state: Tailwind
	diagnostics: InitOptions["diagnostics"]
}): Diagnostic[] {
	const { classList, empty, error } = findClasses({ input: classes, separator })
	const result: Diagnostic[] = []

	if (error) {
		result.push({
			source,
			message: error.message,
			range: {
				start: document.positionAt(offset + error.start),
				end: document.positionAt(offset + error.end),
			},
			severity: DiagnosticSeverity.Error,
		})
	}

	if (kind === PatternKind.Twin) {
		classList.forEach(c => {
			result.push(...checkTwinClassName(c, document, offset, state))
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
							start: document.positionAt(offset + token[0]),
							end: document.positionAt(offset + token[1]),
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
				start: document.positionAt(offset + empty[i][0]),
				end: document.positionAt(offset + empty[i][1]),
			},
			severity: DiagnosticSeverity.Warning,
		})
	}

	return result
}

function checkTwinClassName(info: ClassInfo, document: TextDocument, offset: number, state: Tailwind) {
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
				message: `Can't find '${value}', did you mean '${ans[0].item}'?`,
				range: {
					start: document.positionAt(offset + a),
					end: document.positionAt(offset + b),
				},
				data: { text: value, newText: ans[0].item },
				severity: DiagnosticSeverity.Error,
			})
		} else {
			result.push({
				source,
				message: `Can't find '${value}'`,
				range: {
					start: document.positionAt(offset + a),
					end: document.positionAt(offset + b),
				},
				severity: DiagnosticSeverity.Error,
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
					message: `Can't find '${info.token[2]}', did you mean '${ans[0].item}'?`,
					range: {
						start: document.positionAt(offset + info.token[0]),
						end: document.positionAt(offset + info.token[1]),
					},
					data: { text: info.token[2], newText: ans[0].item },
					severity: DiagnosticSeverity.Error,
				})
			} else {
				result.push({
					source,
					message: `Can't find '${info.token[2]}'`,
					range: {
						start: document.positionAt(offset + info.token[0]),
						end: document.positionAt(offset + info.token[1]),
					},
					severity: DiagnosticSeverity.Error,
				})
			}
		}
	}
	return result
}
