import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import type { Tailwind } from "~/tailwind"
import { findAllMatch, PatternKind } from "~/common/ast"
import type { InitOptions, Cache } from "."
import * as tw from "~/common/twin"
import toKebab from "~/common/toKebab"
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
			for (const err of result.errors) {
				diagnostics.push({
					range: {
						start: document.positionAt(start + err.start),
						end: document.positionAt(start + err.end),
					},
					source,
					message: err.message,
					severity: DiagnosticSeverity.Error,
				})
			}
			if (!state.getTheme(result.keys())) {
				diagnostics.push({
					range: { start: document.positionAt(start), end: document.positionAt(end) },
					source,
					message: "value is undefined",
					severity: DiagnosticSeverity.Error,
				})
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
	emptyList,
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
			if (c.kind === tw.TokenKind.ClassName) {
				result.push(...checkTwinClassName(c, document, offset, state))
			}
		})
	}

	function travel(obj: Record<string, tw.TokenList>) {
		for (const k in obj) {
			const t = obj[k]
			const parts = k.split(".")
			const prop = parts[parts.length - 1]
			if (t.length > 1) {
				for (const token of t) {
					const message =
						diagnostics.conflict === "strict"
							? `${token.text} is conflicted on property: ${prop}`
							: `${token.text} is conflicted`
					result.push({
						source,
						message,
						range: {
							start: document.positionAt(offset + token.start),
							end: document.positionAt(offset + token.end),
						},
						severity: DiagnosticSeverity.Warning,
					})
				}
			}
		}
	}

	if (diagnostics.conflict !== "none") {
		const map: Record<string, tw.TokenList> = {}

		if (kind === PatternKind.Twin) {
			for (let i = 0; i < classList.length; i++) {
				const item = classList[i]
				const variants = item.variants.texts
				if (item.important) {
					continue
				}

				if (item.kind === tw.TokenKind.CssProperty) {
					const twinKeys = variants.sort()
					const property = toKebab(item.key.text)
					const key = [undefined, ...twinKeys, property].join(".")
					const target = map[key]
					if (target instanceof Array) {
						target.push(classList[i].token)
					} else {
						map[key] = tw.createTokenList([classList[i].token])
					}
					continue
				}

				const data = state.classnames.getClassNameRule(variants, true, item.token.text)
				if (!(data instanceof Array)) {
					if (
						item.token.text !== "container" &&
						!(item.token.text === "content" && variants.some(v => v === "before" || v === "after"))
					) {
						result.push({
							source,
							message: `Invalid token '${item.token.text}'`,
							range: {
								start: document.positionAt(offset + item.token.start),
								end: document.positionAt(offset + item.token.end),
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
								map[key] = tw.createTokenList([item.token])
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
						map[key] = tw.createTokenList([classList[i].token])
					}
				}
			}
		} else if (kind === PatternKind.TwinCssProperty) {
			for (let i = 0; i < classList.length; i++) {
				const item = classList[i]
				if (item.kind === tw.TokenKind.Unknown || item.kind === tw.TokenKind.ClassName) {
					result.push({
						source,
						message: `Invalid token '${item.token.text}'`,
						range: {
							start: document.positionAt(offset + item.token.start),
							end: document.positionAt(offset + item.token.end),
						},
						severity: DiagnosticSeverity.Error,
					})
					continue
				}

				const twinKeys = item.variants.texts.sort()
				const property = toKebab(item.key.text)
				const key = [...twinKeys, property].join(".")
				const target = map[key]
				if (target instanceof Array) {
					target.push(classList[i].token)
				} else {
					map[key] = tw.createTokenList([classList[i].token])
				}
			}
		}

		travel(map)
	}

	for (let i = 0; i < emptyList.length; i++) {
		const item = emptyList[i]
		const variants = item.variants.texts
		const searcher = state.classnames.getSearcher(
			variants,
			kind === PatternKind.Twin || kind === PatternKind.TwinCssProperty,
		)
		for (const [a, b, variant] of item.variants) {
			if (
				!state.classnames.isVariant(variant, kind === PatternKind.Twin || kind === PatternKind.TwinCssProperty)
			) {
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

		if (item.kind === tw.EmptyKind.Group && diagnostics.emptyGroup) {
			result.push({
				source,
				message: `forgot something?`,
				range: {
					start: document.positionAt(offset + item.start),
					end: document.positionAt(offset + item.end),
				},
				severity: DiagnosticSeverity.Warning,
			})
		} else if (item.kind === tw.EmptyKind.Classname && diagnostics.emptyClass) {
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

function checkTwinClassName(info: tw.ClassName, document: TextDocument, offset: number, state: Tailwind) {
	const result: Diagnostic[] = []
	const variants = info.variants.texts
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

	if (info.token.text) {
		const variants = info.variants.texts
		const value = info.token.text
		if (!state.classnames.isClassName(variants, true, value)) {
			const ans = state.classnames.getSearcher(variants, true).classes.search(value)
			if (ans?.length > 0) {
				result.push({
					source,
					message: `Can't find '${value}', did you mean '${ans[0].item}'?`,
					range: {
						start: document.positionAt(offset + info.token.start),
						end: document.positionAt(offset + info.token.end),
					},
					data: { text: value, newText: ans[0].item },
					severity: DiagnosticSeverity.Error,
				})
			}
		}
	}
	return result
}
