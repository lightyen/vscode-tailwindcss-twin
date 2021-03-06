import Fuse from "fuse.js"
import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import { DIAGNOSTICS_ID } from "~/../shared"
import { findAllMatch, PatternKind } from "~/common/ast"
import findAllElements from "~/common/findAllElements"
import parseThemeValue from "~/common/parseThemeValue"
import * as tw from "~/common/twin"
import type { Tailwind } from "~/tailwind"
import type { Cache, ServiceOptions } from "~/twLanguageService"
import { cssDataManager } from "./cssData"

const cssProperties = cssDataManager.getProperties().map(c => c.name)
const csspropSearcher = new Fuse(cssProperties, { includeScore: true })

// TODO: Enhance performance
export function validate(document: TextDocument, state: Tailwind, options: ServiceOptions, cache: Cache) {
	const diagnostics: Diagnostic[] = []
	const uri = document.uri.toString()
	const tokens = findAllMatch(document, options.jsxPropImportChecking)
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
					source: DIAGNOSTICS_ID,
					message: err.message,
					severity: DiagnosticSeverity.Error,
				})
			}
			if (!state.getTheme(result.keys())) {
				diagnostics.push({
					range: { start: document.positionAt(start), end: document.positionAt(end) },
					source: DIAGNOSTICS_ID,
					message: "value is undefined",
					severity: DiagnosticSeverity.Error,
				})
			}
		} else if (kind === PatternKind.Twin || PatternKind.TwinCssProperty) {
			const c = cache[uri][value]
			if (!c) {
				const result = findAllElements({ input: value, separator: state.separator })
				cache[uri][value] = result
			}
			diagnostics.push(
				...validateTwin({
					document,
					offset: start,
					kind,
					diagnostics: options.diagnostics,
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
	elementList,
	emptyList,
	error,
}: {
	document: TextDocument
	offset: number
	kind: PatternKind
	state: Tailwind
	diagnostics: ServiceOptions["diagnostics"]
} & ReturnType<typeof findAllElements>): Diagnostic[] {
	const result: Diagnostic[] = []

	if (error) {
		result.push({
			source: DIAGNOSTICS_ID,
			message: error.message,
			range: {
				start: document.positionAt(offset + error.start),
				end: document.positionAt(offset + error.end),
			},
			severity: DiagnosticSeverity.Error,
		})
	}

	if (kind === PatternKind.Twin) {
		elementList.forEach(c => {
			switch (c.kind) {
				case tw.TokenKind.ClassName:
					result.push(...checkTwinClassName(c, document, offset, state))
					break
				case tw.TokenKind.CssProperty:
					result.push(...checkTwinCssProperty(c, document, offset, state))
					break
				case tw.TokenKind.Unknown:
					result.push(...checkTwinClassName(c, document, offset, state))
					break
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
						source: DIAGNOSTICS_ID,
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
			for (let i = 0; i < elementList.length; i++) {
				const item = elementList[i]
				if (item.kind === tw.TokenKind.Comment) {
					continue
				}
				const variants = item.variants.texts
				if (item.important) {
					continue
				}

				if (item.kind === tw.TokenKind.CssProperty) {
					const twinKeys = variants.sort()
					const property = item.prop.toKebab()
					const key = [undefined, ...twinKeys, property].join(".")
					const target = map[key]
					if (target instanceof Array) {
						target.push(elementList[i].token)
					} else {
						map[key] = tw.createTokenList([elementList[i].token])
					}
					continue
				}

				const data = state.classnames.getClassNameRule(variants, true, item.token.text)
				if (!(data instanceof Array)) {
					continue
				}

				if (diagnostics.conflict === "strict") {
					for (const d of data) {
						const twinKeys = variants.sort()
						for (const property of Object.keys(d.decls)) {
							// NOTE: skip tailwind css variable, because of duplicated by tailwindcss itself
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
						target.push(elementList[i].token)
					} else {
						map[key] = tw.createTokenList([elementList[i].token])
					}
				}
			}
		} else if (kind === PatternKind.TwinCssProperty) {
			for (let i = 0; i < elementList.length; i++) {
				const item = elementList[i]
				if (item.kind === tw.TokenKind.Comment) {
					continue
				}
				if (item.kind === tw.TokenKind.Unknown || item.kind === tw.TokenKind.ClassName) {
					let message = `Invalid token '${item.token.text}'`
					if (cssDataManager.getProperty(item.token.text)) {
						message += ", missing square brackets?"
					}
					result.push({
						source: DIAGNOSTICS_ID,
						message,
						range: {
							start: document.positionAt(offset + item.token.start),
							end: document.positionAt(offset + item.token.end),
						},
						severity: DiagnosticSeverity.Error,
					})
					continue
				}

				const twinKeys = item.variants.texts.sort()
				const property = item.prop.toKebab()
				const key = [...twinKeys, property].join(".")
				const target = map[key]
				if (target instanceof Array) {
					target.push(elementList[i].token)
				} else {
					map[key] = tw.createTokenList([elementList[i].token])
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
						source: DIAGNOSTICS_ID,
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
						source: DIAGNOSTICS_ID,
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
				source: DIAGNOSTICS_ID,
				message: `forgot something?`,
				range: {
					start: document.positionAt(offset + item.start),
					end: document.positionAt(offset + item.end),
				},
				severity: DiagnosticSeverity.Warning,
			})
		} else if (item.kind === tw.EmptyKind.Classname && diagnostics.emptyClass) {
			result.push({
				source: DIAGNOSTICS_ID,
				message: `forgot something?`,
				range: {
					start: document.positionAt(offset + item.start),
					end: document.positionAt(offset + item.start + 1),
				},
				severity: DiagnosticSeverity.Warning,
			})
		} else if (item.kind === tw.EmptyKind.CssProperty && diagnostics.emptyCssProperty) {
			result.push({
				source: DIAGNOSTICS_ID,
				message: `forgot something?`,
				range: {
					start: document.positionAt(offset + item.start),
					end: document.positionAt(offset + item.end),
				},
				severity: DiagnosticSeverity.Warning,
			})
		}
	}

	return result
}

function checkTwinCssProperty(item: tw.CssProperty, document: TextDocument, offset: number, state: Tailwind) {
	const result: Diagnostic[] = []
	const variants = item.variants.texts
	for (const [a, b, variant] of item.variants) {
		if (state.classnames.isVariant(variant, true)) {
			continue
		}
		const ret = state.classnames.getSearcher(variants, true).variants.search(variant)
		const ans = ret?.[0]?.item
		if (ans) {
			result.push({
				source: DIAGNOSTICS_ID,
				message: `Can't find '${variant}', did you mean '${ans}'?`,
				range: {
					start: document.positionAt(offset + a),
					end: document.positionAt(offset + b),
				},
				data: { text: variant, newText: ans },
				severity: DiagnosticSeverity.Error,
			})
		} else {
			result.push({
				source: DIAGNOSTICS_ID,
				message: `Can't find '${variant}'`,
				range: {
					start: document.positionAt(offset + a),
					end: document.positionAt(offset + b),
				},
				severity: DiagnosticSeverity.Error,
			})
		}
	}

	if (item.token.text) {
		const { text, start, end } = item.prop
		if (text.startsWith("--")) {
			return result
		}
		const ret = csspropSearcher.search(text)
		const score = ret?.[0]?.score
		if (score > 0) {
			result.push({
				source: DIAGNOSTICS_ID,
				message: `Can't find '${text}', did you mean '${ret[0].item}'?`,
				range: {
					start: document.positionAt(offset + start),
					end: document.positionAt(offset + end),
				},
				data: { text, newText: ret[0].item },
				severity: DiagnosticSeverity.Error,
			})
		} else if (score !== 0) {
			result.push({
				source: DIAGNOSTICS_ID,
				message: `Can't find '${text}'`,
				range: {
					start: document.positionAt(offset + start),
					end: document.positionAt(offset + end),
				},
				severity: DiagnosticSeverity.Error,
			})
		}
	}
	return result
}

function checkTwinClassName(item: tw.ClassName | tw.Unknown, document: TextDocument, offset: number, state: Tailwind) {
	const result: Diagnostic[] = []
	const variants = item.variants.texts
	for (const [a, b, variant] of item.variants) {
		if (state.classnames.isVariant(variant, true)) {
			continue
		}
		// TODO: use another approximate string matching method?
		const ret = state.classnames.getSearcher(variants, true).variants.search(variant)
		const ans = ret?.[0]?.item
		if (ans) {
			result.push({
				source: DIAGNOSTICS_ID,
				message: `Can't find '${variant}', did you mean '${ans}'?`,
				range: {
					start: document.positionAt(offset + a),
					end: document.positionAt(offset + b),
				},
				data: { text: variant, newText: ans },
				severity: DiagnosticSeverity.Error,
			})
		} else {
			result.push({
				source: DIAGNOSTICS_ID,
				message: `Can't find '${variant}'`,
				range: {
					start: document.positionAt(offset + a),
					end: document.positionAt(offset + b),
				},
				severity: DiagnosticSeverity.Error,
			})
		}
	}

	if (item.token.text) {
		const variants = item.variants.texts
		const { start, end, text } = item.token
		if (!state.classnames.isClassName(variants, true, text)) {
			const ret = guess(state, variants, text)
			if (ret.score === 0) {
				switch (ret.kind) {
					case PredictionKind.CssProperty:
						result.push({
							source: DIAGNOSTICS_ID,
							message: `Invalid token '${text}', missing square brackets?`,
							range: {
								start: document.positionAt(offset + start),
								end: document.positionAt(offset + end),
							},
							severity: DiagnosticSeverity.Error,
						})
						break
					case PredictionKind.Variant:
						result.push({
							source: DIAGNOSTICS_ID,
							message: `Invalid token '${text}', missing separator?`,
							range: {
								start: document.positionAt(offset + start),
								end: document.positionAt(offset + end),
							},
							severity: DiagnosticSeverity.Error,
						})
						break
					default:
						result.push({
							source: DIAGNOSTICS_ID,
							message: `Can't find '${text}'`,
							range: {
								start: document.positionAt(offset + start),
								end: document.positionAt(offset + end),
							},
							severity: DiagnosticSeverity.Error,
						})
				}
			} else {
				result.push({
					source: DIAGNOSTICS_ID,
					message: `Can't find '${text}', did you mean '${ret.value}'?`,
					range: {
						start: document.positionAt(offset + start),
						end: document.positionAt(offset + end),
					},
					data: { text, newText: ret.value },
					severity: DiagnosticSeverity.Error,
				})
			}
		}
	}
	return result
}

enum PredictionKind {
	Unknown,
	Classname,
	CssProperty,
	Variant,
}

function guess(
	state: Tailwind,
	variants: string[],
	text: string,
): { kind: PredictionKind; value: string; score: number } {
	const a = state.classnames.getSearcher(variants, true).classnames.search(text)
	const b = state.classnames.getSearcher(variants, true).variants.search(text)
	const c = csspropSearcher.search(text)
	let kind = PredictionKind.Unknown
	let value = ""
	let score = +Infinity

	if (a?.[0]?.score < score) {
		kind = PredictionKind.Classname
		value = a[0].item
		score = a[0].score
	}

	if (b?.[0]?.score < score) {
		kind = PredictionKind.Variant
		value = b[0].item
		score = b[0].score
	}

	if (c?.[0]?.score < score) {
		kind = PredictionKind.CssProperty
		value = c[0].item
		score = c[0].score
	}

	return {
		kind,
		value,
		score,
	}
}
