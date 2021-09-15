import Fuse from "fuse.js"
import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import { DIAGNOSTICS_ID } from "~/../shared"
import { findAllMatch, PatternKind } from "~/common/ast"
import parseThemeValue from "~/common/parseThemeValue"
import * as parser from "~/common/twin-parser"
import type { Tailwind } from "~/tailwind"
import type { Cache, ServiceOptions } from "~/twLanguageService"
import { cssDataManager } from "./cssData"

const cssProperties = cssDataManager.getProperties().map(c => c.name)
const csspropSearcher = new Fuse(cssProperties, { includeScore: true, isCaseSensitive: true })

function createDiagnosticArray() {
	const arr: Diagnostic[] = []
	const MAXSZIE = 10
	return new Proxy(arr, {
		get(target, prop, ...rest) {
			switch (prop) {
				case "push":
					return function (item: Diagnostic) {
						if (item.severity === DiagnosticSeverity.Warning && target.length >= 2 * MAXSZIE) {
							return 0
						}
						if (target.length >= MAXSZIE) {
							return 0
						}
						return target.push(item)
					}
				default:
					return Reflect.get(target, prop, ...rest)
			}
		},
		set(target, prop, value, ...rest) {
			switch (prop) {
				default:
					return Reflect.set(target, prop, value, ...rest)
			}
		},
	}) as Diagnostic[]
}

export function validate(document: TextDocument, state: Tailwind, options: ServiceOptions, cache: Cache) {
	const diagnostics = createDiagnosticArray()
	const uri = document.uri.toString()
	const tokens = findAllMatch(document, options.jsxPropImportChecking)
	for (const { token, kind } of tokens) {
		const [start, end, value] = token
		if (kind === PatternKind.TwinTheme) {
			const result = parseThemeValue(value)
			for (const err of result.errors) {
				if (
					!diagnostics.push({
						range: {
							start: document.positionAt(start + err.start),
							end: document.positionAt(start + err.end),
						},
						source: DIAGNOSTICS_ID,
						message: err.message,
						severity: DiagnosticSeverity.Error,
					})
				) {
					return diagnostics
				}
			}
			if (!state.getTheme(result.keys(), true)) {
				if (
					!diagnostics.push({
						range: { start: document.positionAt(start), end: document.positionAt(end) },
						source: DIAGNOSTICS_ID,
						message: "value is undefined",
						severity: DiagnosticSeverity.Error,
					})
				) {
					return diagnostics
				}
			}
		} else if (kind === PatternKind.TwinScreen) {
			if (value) {
				const result = state.getTheme(["screens", value])
				if (result == undefined) {
					if (
						!diagnostics.push({
							range: { start: document.positionAt(start), end: document.positionAt(end) },
							source: DIAGNOSTICS_ID,
							message: "value is undefined",
							severity: DiagnosticSeverity.Error,
						})
					) {
						return diagnostics
					}
				}
			}
		} else if (kind === PatternKind.Twin || PatternKind.TwinCssProperty) {
			const c = cache[uri][value]
			if (!c) {
				const result = parser.spread({ text: value, separator: state.separator })
				cache[uri][value] = result
			}
			validateTwin({
				document,
				offset: start,
				kind,
				diagnostics: options.diagnostics,
				state,
				result: diagnostics,
				...cache[uri][value],
			})
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
	items,
	emptyGroup,
	emptyVariants,
	notClosed,
	result,
}: {
	document: TextDocument
	offset: number
	kind: PatternKind
	state: Tailwind
	diagnostics: ServiceOptions["diagnostics"]
	result: Diagnostic[]
} & ReturnType<typeof parser.spread>): void {
	for (const e of notClosed) {
		if (
			!result.push({
				source: DIAGNOSTICS_ID,
				message: "Bracket is not closed.",
				range: {
					start: document.positionAt(offset + e.start),
					end: document.positionAt(offset + e.end),
				},
				severity: DiagnosticSeverity.Error,
			})
		) {
			return
		}
	}

	if (kind === PatternKind.Twin) {
		for (let i = 0; i < items.length; i++) {
			const c = items[i]
			switch (c.type) {
				case parser.SpreadResultType.ClassName: {
					const ans = checkTwinClassName(c, document, offset, state)
					for (let k = 0; k < ans.length; k++) {
						if (!result.push(ans[k])) {
							return
						}
					}
					break
				}
				case parser.SpreadResultType.CssProperty: {
					const ans = checkTwinCssProperty(c, document, offset, state)
					for (let k = 0; k < ans.length; k++) {
						if (!result.push(ans[k])) {
							return
						}
					}
					break
				}
			}
		}
	}

	function travel(obj: Record<string, parser.TokenList>) {
		for (const k in obj) {
			const t = obj[k]
			const parts = k.split(".")
			const prop = parts[parts.length - 1]
			if (t.length > 1) {
				for (const token of t) {
					const message =
						diagnostics.conflict === "strict"
							? `${token.value} is duplicated on property: ${prop}`
							: `${token.value} is duplicated`
					if (
						!result.push({
							source: DIAGNOSTICS_ID,
							message,
							range: {
								start: document.positionAt(offset + token.start),
								end: document.positionAt(offset + token.end),
							},
							severity: DiagnosticSeverity.Warning,
						})
					) {
						return
					}
				}
			}
		}
	}

	if (diagnostics.conflict !== "none") {
		const map: Record<string, parser.TokenList> = {}

		if (kind === PatternKind.Twin) {
			for (let i = 0; i < items.length; i++) {
				const item = items[i]
				if (item.important) {
					continue
				}

				const variants = item.variants.texts
				if (item.type === parser.SpreadResultType.CssProperty) {
					const twinKeys = variants.sort()
					const property = item.prop?.toKebab()
					const key = [undefined, ...twinKeys, property].join(".")
					const target = map[key]
					if (target instanceof Array) {
						target.push(item.target)
					} else {
						map[key] = parser.createTokenList([item.target])
					}
					continue
				}

				const label = item.target.value
				const data = state.twin.classnames.get(label)
				if (!(data instanceof Array)) {
					continue
				}

				// [except case] font-variant-numeric
				if (label.match(/^slashed-zero|ordinal$/)) {
					continue
				}

				if (label.match(/^(?:lining|oldstyle|proportional|tabular)-nums$/)) {
					continue
				}

				if (label.match(/^(?:diagonal|stacked)-fractions$/)) {
					continue
				}

				if (diagnostics.conflict === "loose" || isIgnored(label)) {
					const s = new Set<string>()
					for (const d of data) {
						for (const c of Object.keys(d.decls)) {
							s.add(c)
						}
					}
					const key = [...variants, Array.from(s).sort().join(":")].join(".")
					const target = map[key]
					if (target instanceof Array) {
						target.push(item.target)
					} else {
						map[key] = parser.createTokenList([item.target])
					}
				} else if (diagnostics.conflict === "strict") {
					for (const d of data) {
						const twinKeys = variants.sort()
						for (const property of Object.keys(d.decls)) {
							const key = [...d.context, d.rest, ...d.pseudo, ...twinKeys, property].join(".")
							const target = map[key]
							if (target instanceof Array) {
								target.push(item.target)
							} else {
								map[key] = parser.createTokenList([item.target])
							}
						}
						if (d.source === "components") {
							break
						}
					}
				}
			}
		} else if (kind === PatternKind.TwinCssProperty) {
			for (let i = 0; i < items.length; i++) {
				const item = items[i]

				if (item.type === parser.SpreadResultType.ClassName) {
					let message = `Invalid token '${item.target.value}'`
					if (cssDataManager.getProperty(item.target.value)) {
						message += ", missing square brackets?"
					}
					result.push({
						source: DIAGNOSTICS_ID,
						message,
						range: {
							start: document.positionAt(offset + item.target.start),
							end: document.positionAt(offset + item.target.end),
						},
						severity: DiagnosticSeverity.Error,
					})
					continue
				}

				const twinKeys = item.variants.texts.sort()
				const property = item.target.toKebab()
				const key = [...twinKeys, property].join(".")
				const target = map[key]
				if (target instanceof Array) {
					target.push(item.target)
				} else {
					map[key] = parser.createTokenList([item.target])
				}
			}
		}

		travel(map)
	}

	for (let i = 0; i < emptyVariants.length; i++) {
		const item = emptyVariants[i]
		if (diagnostics.emptyClass) {
			if (
				!result.push({
					source: DIAGNOSTICS_ID,
					message: `forgot something?`,
					range: {
						start: document.positionAt(offset + item.end),
						end: document.positionAt(offset + item.end + 1),
					},
					severity: DiagnosticSeverity.Warning,
				})
			) {
				return
			}
		}
	}

	for (let i = 0; i < emptyGroup.length; i++) {
		const item = emptyGroup[i]
		if (diagnostics.emptyGroup) {
			if (
				!result.push({
					source: DIAGNOSTICS_ID,
					message: `forgot something?`,
					range: {
						start: document.positionAt(offset + item.start),
						end: document.positionAt(offset + item.end),
					},
					severity: DiagnosticSeverity.Warning,
				})
			) {
				return
			}
		}
	}
}

function checkTwinCssProperty(item: parser.SpreadDescription, document: TextDocument, offset: number, state: Tailwind) {
	const result: Diagnostic[] = []
	for (const [a, b, variant] of item.variants) {
		if (state.twin.isVariant(variant)) {
			continue
		}
		const ret = state.twin.searchers.variants.search(variant)
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

	if (item.type !== parser.SpreadResultType.CssProperty) {
		return result
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const prop = item.prop!
	const { value, start, end } = prop
	if (value.startsWith("--")) {
		return result
	}
	const ret = csspropSearcher.search(prop.toKebab())
	const score = ret?.[0]?.score
	if (score == undefined) {
		result.push({
			source: DIAGNOSTICS_ID,
			message: `Can't find '${value}'`,
			range: {
				start: document.positionAt(offset + start),
				end: document.positionAt(offset + end),
			},
			severity: DiagnosticSeverity.Error,
		})
	} else if (score > 0) {
		result.push({
			source: DIAGNOSTICS_ID,
			message: `Can't find '${value}', did you mean '${ret[0].item}'?`,
			range: {
				start: document.positionAt(offset + start),
				end: document.positionAt(offset + end),
			},
			data: { text: value, newText: ret[0].item },
			severity: DiagnosticSeverity.Error,
		})
	}
	return result
}

function checkTwinClassName(item: parser.SpreadDescription, document: TextDocument, offset: number, state: Tailwind) {
	const result: Diagnostic[] = []
	for (const [a, b, variant] of item.variants) {
		if (state.twin.isVariant(variant)) {
			continue
		}
		const ret = state.twin.searchers.variants.search(variant)
		const ans = ret?.[0]?.item
		if (ans) {
			result.push({
				source: DIAGNOSTICS_ID,
				message: `Unknown variant: ${variant}, did you mean '${ans}'?`,
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
				message: `Unknown variant: ${variant}`,
				range: {
					start: document.positionAt(offset + a),
					end: document.positionAt(offset + b),
				},
				severity: DiagnosticSeverity.Error,
			})
		}
	}

	if (item.target.value) {
		const variants = item.variants.texts
		const { start, end } = item.target
		let value = item.target.value
		const [isColorShorthandOpacity, name] = state.twin.isColorShorthandOpacity(value)
		if (isColorShorthandOpacity) {
			value = name
		}
		if (!state.twin.isSuggestedClassName(variants, value)) {
			const ret = guess(state, variants, value)
			if (ret.score === 0) {
				switch (ret.kind) {
					case PredictionKind.CssProperty:
						result.push({
							source: DIAGNOSTICS_ID,
							message: `Invalid token '${value}', missing square brackets?`,
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
							message: `Invalid token '${value}', missing separator?`,
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
							message: `Unknown: ${value}`,
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
					message: `Unknown: ${value}, did you mean ${ret.value}?`,
					range: {
						start: document.positionAt(offset + start),
						end: document.positionAt(offset + end),
					},
					data: { text: value, newText: ret.value },
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
	const a = state.twin.searchers.classnames.search(text)
	const b = state.twin.searchers.variants.search(text)
	const c = csspropSearcher.search(text)
	let kind = PredictionKind.Unknown
	let value = ""
	let score = +Infinity

	if (a?.[0]?.score != undefined && a[0].score < score) {
		kind = PredictionKind.Classname
		value = a[0].item
		score = a[0].score
	}

	if (b?.[0]?.score != undefined && b[0].score < score) {
		kind = PredictionKind.Variant
		value = b[0].item
		score = b[0].score
	}

	if (c?.[0]?.score != undefined && c[0].score < score) {
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

// TODO: detect confliction on css shorthand properties

function isIgnored(label: string) {
	// top, right, bottom, left
	if (label.match(/^-?(?:top|right|bottom|left)-/)) {
		return true
	}

	if (label.match(/^-?(?:mt|mr|mb|ml)-(?:auto|px|[\d.]+)$/)) {
		return true
	}

	if (label.match(/^(?:pt|pr|pb|pl)-(?:px|[\d.]+)$/)) {
		return true
	}

	if (label.match(/^rounded-(?:t|r|b|l)(?:-\d?[a-z]+)?/)) {
		return true
	}

	if (label.match(/^border-(?:t|r|b|l)-/)) {
		return true
	}

	// text
	if (label.match(/^(?:leading)-(?:\d+|[a-z]+)$/)) {
		return true
	}

	// opactiy
	if (label.match(/^(?:bg|ring|text|border|divide|placeholder)-opacity-\d+$/)) {
		return true
	}

	// transition
	if (label.match(/^duration-\d+$/)) {
		return true
	}

	if (label.match(/^delay-\d+$/)) {
		return true
	}

	if (label.match(/^ease-(?:linear|in|out|in-out)$/)) {
		return true
	}

	// transform
	if (label.match(/^scale(?:-(?:x|y))?-\d+$/)) {
		return true
	}

	if (label.match(/^-?rotate-\d+$/)) {
		return true
	}

	if (label.match(/^-?translate-(?:x|y)-(?:[\d./]+|px|full)$/)) {
		return true
	}

	if (label.match(/^-?skew(?:-(?:x|y))?-\d+$/)) {
		return true
	}

	// gradient
	if (label.match(/^(?:via|to)-(?:[a-z]+)-\d+$/)) {
		return true
	}

	// reverse
	if (label.match(/^(?:divide|space)-(?:x|y)-reverse$/)) {
		return true
	}

	// filter
	if (label.match(/^(?:backdrop-)?blur(?:-(?:0|none|sm|md|lg|\d+xl))?$/)) {
		return true
	}

	if (label.match(/^-?(?:backdrop-)?hue-rotate-\d+$/)) {
		return true
	}

	if (label.match(/^(?:backdrop-)?(?:brightness|contrast|grayscale|invert|sepia|saturate)(?:-\d+)?$/)) {
		return true
	}

	if (label.match(/^drop-shadow(?:-(?:0|none|sm|md|lg|\d+xl))?$/)) {
		return true
	}

	if (label.match(/^backdrop-opacity-\d+$/)) {
		return true
	}

	return false
}
