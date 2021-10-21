import { ExtractedToken, ExtractedTokenKind, TextDocument } from "@/extractors"
import { defaultLogger as console } from "@/logger"
import parseThemeValue from "@/parseThemeValue"
import { transformSourceMap } from "@/sourcemap"
import * as parser from "@/twin-parser"
import * as nodes from "@/twin-parser/twNodes"
import { cssDataManager } from "@/vscode-css-languageservice"
import Fuse from "fuse.js"
import vscode from "vscode"
import { DIAGNOSTICS_ID } from "~/shared"
import type { ServiceOptions } from "."
import type { TailwindLoader } from "./tailwind"

export interface IDiagnostic extends vscode.Diagnostic {
	data?: {
		text: string
		newText: string
	}
}

const cssProperties = cssDataManager.getProperties().map(c => c.name)
const csspropSearcher = new Fuse(cssProperties, { includeScore: true, isCaseSensitive: true })

function createDiagnosticArray() {
	const arr: vscode.Diagnostic[] = []
	const MAXSZIE = 20
	return new Proxy(arr, {
		get(target, prop, ...rest) {
			switch (prop) {
				case "push":
					return function (item: vscode.Diagnostic) {
						if (item.severity === vscode.DiagnosticSeverity.Warning && target.length >= 2 * MAXSZIE) {
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
	}) as IDiagnostic[]
}

export function validate(
	tokens: ExtractedToken[],
	document: TextDocument,
	state: TailwindLoader,
	options: ServiceOptions,
) {
	const diagnostics = createDiagnosticArray()
	const start = process.hrtime.bigint()
	const answer = doValidate()
	const end = process.hrtime.bigint()
	console.trace(`validate (${Number((end - start) / 10n ** 6n)}ms)`)
	return answer

	function doValidate() {
		try {
			for (const { token, kind } of tokens) {
				const [start, end, value] = token
				if (kind === ExtractedTokenKind.TwinTheme) {
					const result = parseThemeValue(value)
					for (const err of result.errors) {
						if (
							!diagnostics.push({
								range: new vscode.Range(
									document.positionAt(start + err.start),
									document.positionAt(start + err.end),
								),
								source: DIAGNOSTICS_ID,
								message: err.message,
								severity: vscode.DiagnosticSeverity.Error,
							})
						) {
							return diagnostics
						}
					}
					if (!state.tw.getTheme(result.keys(), true)) {
						if (
							!diagnostics.push({
								range: new vscode.Range(document.positionAt(start), document.positionAt(end)),
								source: DIAGNOSTICS_ID,
								message: "value is undefined",
								severity: vscode.DiagnosticSeverity.Error,
							})
						) {
							return diagnostics
						}
					}
				} else if (kind === ExtractedTokenKind.TwinScreen) {
					if (value) {
						const result = state.tw.getTheme(["screens", value])
						if (result == undefined) {
							if (
								!diagnostics.push({
									range: new vscode.Range(document.positionAt(start), document.positionAt(end)),
									source: DIAGNOSTICS_ID,
									message: "value is undefined",
									severity: vscode.DiagnosticSeverity.Error,
								})
							) {
								return diagnostics
							}
						}
					}
				} else if (kind === ExtractedTokenKind.Twin || ExtractedTokenKind.TwinCssProperty) {
					const result = parser.spread({ text: value, separator: state.separator })
					validateTwin({
						document,
						offset: start,
						kind,
						diagnostics: options.diagnostics,
						state,
						result: diagnostics,
						...result,
					})
				}
			}
			return diagnostics
		} catch (error) {
			const err = error as Error
			if (err.stack) err.stack = transformSourceMap(options.serverSourceMapUri.fsPath, err.stack)
			console.error(err)
			console.error("do validation failed.")
		}

		return diagnostics
	}
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
	kind: ExtractedTokenKind
	state: TailwindLoader
	diagnostics: ServiceOptions["diagnostics"]
	result: IDiagnostic[]
} & ReturnType<typeof parser.spread>): void {
	for (const e of notClosed) {
		if (
			!result.push({
				source: DIAGNOSTICS_ID,
				message: "Bracket is not closed.",
				range: new vscode.Range(document.positionAt(offset + e.start), document.positionAt(offset + e.end)),
				severity: vscode.DiagnosticSeverity.Error,
			})
		) {
			return
		}
	}

	if (kind === ExtractedTokenKind.Twin) {
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
							range: new vscode.Range(
								document.positionAt(offset + token.start),
								document.positionAt(offset + token.end),
							),
							severity: vscode.DiagnosticSeverity.Warning,
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

		if (kind === ExtractedTokenKind.Twin) {
			for (let i = 0; i < items.length; i++) {
				const item = items[i]
				if (item.important) {
					continue
				}

				const variants = item.variants.map(v => v.child.value.trim().replace(/\s{2,}/g, " ")).sort()
				if (item.type === parser.SpreadResultType.CssProperty) {
					// same as loose
					const property = item.prop?.toKebab()
					const key = [...variants, property].join(".")
					const target = map[key]
					if (target instanceof Array) {
						target.push(item.target)
					} else {
						map[key] = parser.createTokenList([item.target])
					}
					continue
				}

				const label = item.target.value
				const decls = state.tw.renderDecls(label)
				if (decls.size === 0) {
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
					for (const [prop] of decls) {
						s.add(prop)
					}
					const key = [...variants, Array.from(s).sort().join(":")].join(".")
					const target = map[key]
					if (target instanceof Array) {
						target.push(item.target)
					} else {
						map[key] = parser.createTokenList([item.target])
					}
				} else if (diagnostics.conflict === "strict") {
					for (const [prop] of decls) {
						const key = [undefined, ...variants, prop].join(".")
						const target = map[key]
						if (target instanceof Array) {
							target.push(item.target)
						} else {
							map[key] = parser.createTokenList([item.target])
						}
					}
				}
			}
		} else if (kind === ExtractedTokenKind.TwinCssProperty) {
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
						range: new vscode.Range(
							document.positionAt(offset + item.target.start),
							document.positionAt(offset + item.target.end),
						),
						severity: vscode.DiagnosticSeverity.Error,
					})
					continue
				}

				const twinKeys = item.variants.map(v => v.child.value.trim().replace(/\s{2,}/g, " ")).sort()
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
					range: new vscode.Range(
						document.positionAt(offset + item.end),
						document.positionAt(offset + item.end + 1),
					),
					severity: vscode.DiagnosticSeverity.Warning,
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
					range: new vscode.Range(
						document.positionAt(offset + item.start),
						document.positionAt(offset + item.end),
					),
					severity: vscode.DiagnosticSeverity.Warning,
				})
			) {
				return
			}
		}
	}
}

function checkTwinCssProperty(
	item: parser.SpreadDescription,
	document: TextDocument,
	offset: number,
	state: TailwindLoader,
) {
	const result: IDiagnostic[] = []
	for (const node of item.variants) {
		if (!nodes.isVariant(node)) {
			continue
		}
		const [a, b, variant] = node.child
		if (state.tw.isVariant(variant)) {
			continue
		}
		const ret = state.variants.search(variant)
		const ans = ret?.[0]?.item
		if (ans) {
			result.push({
				source: DIAGNOSTICS_ID,
				message: `Can't find '${variant}', did you mean '${ans}'?`,
				range: new vscode.Range(document.positionAt(offset + a), document.positionAt(offset + b)),
				data: { text: variant, newText: ans },
				severity: vscode.DiagnosticSeverity.Error,
			})
		} else {
			result.push({
				source: DIAGNOSTICS_ID,
				message: `Can't find '${variant}'`,
				range: new vscode.Range(document.positionAt(offset + a), document.positionAt(offset + b)),
				severity: vscode.DiagnosticSeverity.Error,
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
			range: new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + end)),
			severity: vscode.DiagnosticSeverity.Error,
		})
	} else if (score > 0) {
		result.push({
			source: DIAGNOSTICS_ID,
			message: `Can't find '${value}', did you mean '${ret[0].item}'?`,
			range: new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + end)),
			data: { text: value, newText: ret[0].item },
			severity: vscode.DiagnosticSeverity.Error,
		})
	}
	return result
}

function checkTwinClassName(
	item: parser.SpreadDescription,
	document: TextDocument,
	offset: number,
	state: TailwindLoader,
) {
	const result: IDiagnostic[] = []
	for (const node of item.variants) {
		if (!nodes.isVariant(node)) {
			continue
		}
		const [a, b, variant] = node.child
		if (state.tw.isVariant(variant)) {
			continue
		}
		const ret = state.variants.search(variant)
		const ans = ret?.[0]?.item
		if (ans) {
			result.push({
				source: DIAGNOSTICS_ID,
				message: `Unknown variant: ${variant}, did you mean '${ans}'?`,
				range: new vscode.Range(document.positionAt(offset + a), document.positionAt(offset + b)),
				data: { text: variant, newText: ans },
				severity: vscode.DiagnosticSeverity.Error,
			})
		} else {
			result.push({
				source: DIAGNOSTICS_ID,
				message: `Unknown variant: ${variant}`,
				range: new vscode.Range(document.positionAt(offset + a), document.positionAt(offset + b)),
				severity: vscode.DiagnosticSeverity.Error,
			})
		}
	}

	if (item.target.value) {
		const { start, end } = item.target
		const value = item.target.value
		if (state.tw.renderDecls(value).size === 0) {
			const ret = guess(state, value)
			if (ret.score === 0) {
				switch (ret.kind) {
					case PredictionKind.CssProperty:
						result.push({
							source: DIAGNOSTICS_ID,
							message: `Invalid token '${value}', missing square brackets?`,
							range: new vscode.Range(
								document.positionAt(offset + start),
								document.positionAt(offset + end),
							),
							severity: vscode.DiagnosticSeverity.Error,
						})
						break
					case PredictionKind.Variant:
						result.push({
							source: DIAGNOSTICS_ID,
							message: `Invalid token '${value}', missing separator?`,
							range: new vscode.Range(
								document.positionAt(offset + start),
								document.positionAt(offset + end),
							),
							severity: vscode.DiagnosticSeverity.Error,
						})
						break
					default:
						result.push({
							source: DIAGNOSTICS_ID,
							message: `Unknown: ${value}`,
							range: new vscode.Range(
								document.positionAt(offset + start),
								document.positionAt(offset + end),
							),
							severity: vscode.DiagnosticSeverity.Error,
						})
				}
			} else if (ret.value) {
				result.push({
					source: DIAGNOSTICS_ID,
					message: `Unknown: ${value}, did you mean ${ret.value}?`,
					range: new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + end)),
					data: { text: value, newText: ret.value },
					severity: vscode.DiagnosticSeverity.Error,
				})
			} else {
				result.push({
					source: DIAGNOSTICS_ID,
					message: `Unknown: ${value}`,
					range: new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + end)),
					severity: vscode.DiagnosticSeverity.Error,
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

function guess(state: TailwindLoader, text: string): { kind: PredictionKind; value: string; score: number } {
	const a = state.classnames.search(text)
	const b = state.variants.search(text)
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

	if (label.match(/^border-(?:x|y|t|r|b|l)-/)) {
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
