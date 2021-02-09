import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import type { Tailwind } from "~/tailwind"
import { findAllMatch, PatternKind } from "~/common/ast"
import type { InitOptions, Cache } from "."
import { TokenKind, Token, EmptyKind, ClassName } from "~/common/types"
import camel2kebab from "~/common/camel2kebab"
import findAllClasses from "~/common/findAllClasses"
import parseThemeValue from "~/common/parseThemeValue"

const source = "tailwindcss"

// TODO: Enhance performance
export function validate(document: TextDocument, state: Tailwind, initOptions: InitOptions, cache: Cache) {
	const diagnostics: Diagnostic[] = []
	const uri = document.uri.toString()
	const tokens = findAllMatch(document)
	for (const { token, kind } of tokens) {
		const [start, end, value] = token
		if (kind === PatternKind.TwinTheme) {
			const result = parseThemeValue(value)
			if (result.errors.length > 0) {
				const [err] = result.errors
				diagnostics.push({
					range: {
						start: document.positionAt(start + err.start),
						end: document.positionAt(start + err.start),
					},
					source,
					message: err.message,
					severity: DiagnosticSeverity.Error,
				})
			} else {
				if (!state.getTheme(result.keys())) {
					diagnostics.push({
						range: { start: document.positionAt(start), end: document.positionAt(end) },
						source,
						message: "value is undefined",
						severity: DiagnosticSeverity.Error,
					})
				}
			}
		} else if (kind === PatternKind.Twin || PatternKind.TwinCssProperty) {
			const c = cache[uri][value]
			if (!c) {
				const result = findAllClasses({ input: value, separator: state.separator })
				cache[uri][value] = result
			}
			diagnostics.push(
				...validateTwin({
					document,
					offset: start,
					kind,
					diagnostics: initOptions.diagnostics,
					state,
					...cache[uri][value],
				}),
			)
		}
	}
	return diagnostics
}

function validateTwin({
	document,
	offset,
	kind,
	state,
	diagnostics,
	classList,
	empty,
	error,
}: {
	document: TextDocument
	offset: number
	kind: PatternKind
	state: Tailwind
	diagnostics: InitOptions["diagnostics"]
} & ReturnType<typeof findAllClasses>): Diagnostic[] {
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
			if (c.kind === TokenKind.ClassName) {
				result.push(...checkTwinClassName(c, document, offset, state))
			}
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

		if (kind === PatternKind.Twin) {
			for (let i = 0; i < classList.length; i++) {
				const item = classList[i]
				const variants = item.variants.map(v => v[2])
				if (item.important) {
					continue
				}

				if (item.kind === TokenKind.CssProperty) {
					const twinKeys = item.variants.map(v => v[2]).sort()
					const property = camel2kebab(item.key[2])
					const key = [undefined, ...twinKeys, property].join(".")
					const target = map[key]
					if (target instanceof Array) {
						target.push(classList[i].token)
					} else {
						map[key] = [classList[i].token]
					}
					continue
				}

				const data = state.classnames.getClassNameRule(variants, true, item.token[2])
				if (!(data instanceof Array)) {
					if (
						item.token[2] !== "container" &&
						!(item.token[2] === "content" && variants.some(v => v === "before" || v === "after"))
					) {
						result.push({
							source,
							message: `Invalid token '${item.token[2]}'`,
							range: {
								start: document.positionAt(offset + item.token[0]),
								end: document.positionAt(offset + item.token[1]),
							},
							severity: DiagnosticSeverity.Error,
						})
					}
					continue
				}

				if (diagnostics.conflict === "strict") {
					for (const d of data) {
						const twinKeys = variants.sort()
						for (const property of Object.keys(d.decls)) {
							// skip css variable
							if (property.startsWith("--tw")) {
								continue
							}
							const key = [...d.__context, d.__scope, ...d.__pseudo, ...twinKeys, property].join(".")
							const target = map[key]
							if (target instanceof Array) {
								target.push(item.token)
							} else {
								map[key] = [item.token]
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
		} else if (kind === PatternKind.TwinCssProperty) {
			for (let i = 0; i < classList.length; i++) {
				const item = classList[i]
				if (item.kind === TokenKind.Unknown || item.kind === TokenKind.ClassName) {
					result.push({
						source,
						message: `Invalid token '${item.token[2]}'`,
						range: {
							start: document.positionAt(offset + item.token[0]),
							end: document.positionAt(offset + item.token[1]),
						},
						severity: DiagnosticSeverity.Error,
					})
					continue
				}

				const twinKeys = item.variants.map(v => v[2]).sort()
				const property = camel2kebab(item.key[2])
				const key = [...twinKeys, property].join(".")
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
		const item = empty[i]
		const variants = item.variants.map(v => v[2])
		const searcher = state.classnames.getSearcher(variants, kind === PatternKind.Twin)
		for (const [a, b, variant] of item.variants) {
			if (!state.classnames.isVariant(variant, kind === PatternKind.Twin)) {
				const ans = searcher.variants.search(variant)
				if (ans?.length > 0) {
					result.push({
						source,
						message: `Can't find '${variant}', did you mean '${ans[0].item}'?`,
						range: {
							start: document.positionAt(offset + a),
							end: document.positionAt(offset + b),
						},
						data: { text: variant, newText: ans[0].item },
						severity: DiagnosticSeverity.Error,
					})
				} else {
					result.push({
						source,
						message: `Can't find '${variant}'`,
						range: {
							start: document.positionAt(offset + a),
							end: document.positionAt(offset + b),
						},
						severity: DiagnosticSeverity.Error,
					})
				}
			}
		}

		if (item.kind === EmptyKind.Group && diagnostics.emptyGroup) {
			result.push({
				source,
				message: `forgot something?`,
				range: {
					start: document.positionAt(offset + item.start),
					end: document.positionAt(offset + item.end),
				},
				severity: DiagnosticSeverity.Warning,
			})
		} else if (item.kind === EmptyKind.Classname && diagnostics.emptyClass) {
			result.push({
				source,
				message: `forgot something?`,
				range: {
					start: document.positionAt(offset + item.start),
					end: document.positionAt(offset + item.start + 1),
				},
				severity: DiagnosticSeverity.Warning,
			})
		}
	}

	return result
}

function checkTwinClassName(info: ClassName, document: TextDocument, offset: number, state: Tailwind) {
	const result: Diagnostic[] = []
	const variants = info.variants.map(v => v[2])
	for (const [a, b, variant] of info.variants) {
		if (state.classnames.isVariant(variant, true)) {
			continue
		}
		// TODO: use another approximate string matching method?
		const ans = state.classnames.getSearcher(variants, true).variants.search(variant)
		if (ans?.length > 0) {
			result.push({
				source,
				message: `Can't find '${variant}', did you mean '${ans[0].item}'?`,
				range: {
					start: document.positionAt(offset + a),
					end: document.positionAt(offset + b),
				},
				data: { text: variant, newText: ans[0].item },
				severity: DiagnosticSeverity.Error,
			})
		} else {
			result.push({
				source,
				message: `Can't find '${variant}'`,
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
		const value = info.token[2]
		if (!state.classnames.isClassName(variants, true, value)) {
			const ans = state.classnames.getSearcher(variants, true).classes.search(value)
			if (ans?.length > 0) {
				result.push({
					source,
					message: `Can't find '${value}', did you mean '${ans[0].item}'?`,
					range: {
						start: document.positionAt(offset + info.token[0]),
						end: document.positionAt(offset + info.token[1]),
					},
					data: { text: value, newText: ans[0].item },
					severity: DiagnosticSeverity.Error,
				})
			}
		}
	}
	return result
}
