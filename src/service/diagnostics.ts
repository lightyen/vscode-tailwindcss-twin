import { ExtractedToken, ExtractedTokenKind, TextDocument } from "@/extractors"
import { defaultLogger as console } from "@/logger"
import * as parser from "@/parser"
import parseThemeValue from "@/parseThemeValue"
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
			for (const token of tokens) {
				const { kind, start, end, value } = token
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
						text: value,
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
			console.error(error)
			console.error("do validation failed.")
		}

		return diagnostics
	}
}

function validateTwin({
	document,
	text,
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
	text: string
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
				range: new vscode.Range(
					document.positionAt(offset + e.range[0]),
					document.positionAt(offset + e.range[1]),
				),
				severity: vscode.DiagnosticSeverity.Error,
			})
		) {
			return
		}
	}

	if (kind === ExtractedTokenKind.Twin) {
		for (let i = 0; i < items.length; i++) {
			const c = items[i]
			switch (c.target.type) {
				case parser.NodeType.ClassName: {
					const ans = checkTwinClassName(c, document, text, offset, state)
					for (let k = 0; k < ans.length; k++) {
						if (!result.push(ans[k])) {
							return
						}
					}
					break
				}
				case parser.NodeType.CssDeclaration: {
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

	function travel(obj: Record<string, parser.Range[]>) {
		for (const k in obj) {
			const ranges = obj[k]
			const parts = k.split(".")
			const prop = parts[parts.length - 1]
			if (ranges.length > 1) {
				for (const [a, b] of ranges) {
					const message =
						diagnostics.conflict === "strict"
							? `${text.slice(a, b)} is duplicated on property: ${prop}`
							: `${text.slice(a, b)} is duplicated`
					if (
						!result.push({
							source: DIAGNOSTICS_ID,
							message,
							range: new vscode.Range(document.positionAt(offset + a), document.positionAt(offset + b)),
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
		const map: Record<string, parser.Range[]> = {}

		if (kind === ExtractedTokenKind.Twin) {
			for (let i = 0; i < items.length; i++) {
				const item = items[i]
				if (item.important) {
					continue
				}

				const variants = item.variants.map(v => v.value.trim().replace(/\s{2,}/g, " ")).sort()
				if (item.target.type === parser.NodeType.CssDeclaration) {
					// same as loose
					const property = parser.toKebab(item.target.prop.value)
					const key = [...variants, property].join(".")
					const target = map[key]
					if (target instanceof Array) {
						target.push(item.target.range)
					} else {
						map[key] = [item.target.range]
					}
					continue
				}

				let label = text.slice(item.target.range[0], item.target.range[1])
				if (item.target.type === parser.NodeType.ArbitraryClassname) {
					label = parser.formatArbitraryClassname(item.target, label)
				}
				const { decls, scopes } = state.tw.renderDecls(label)
				if (decls.size === 0) {
					continue
				}

				if (diagnostics.conflict === "loose" || isIgnored(state.tw.getPlugin(label)?.name)) {
					const key = [...variants, ...scopes, Array.from(decls.keys()).sort().join(":")].join(".")
					const target = map[key]
					if (target instanceof Array) {
						target.push(item.target.range)
					} else {
						map[key] = [item.target.range]
					}
				} else if (diagnostics.conflict === "strict") {
					for (const [prop] of decls) {
						const key = [undefined, ...variants, ...scopes, prop].join(".")
						const target = map[key]
						if (target instanceof Array) {
							target.push(item.target.range)
						} else {
							map[key] = [item.target.range]
						}
					}
				}
			}
		} else if (kind === ExtractedTokenKind.TwinCssProperty) {
			for (let i = 0; i < items.length; i++) {
				const item = items[i]

				if (item.target.type === parser.NodeType.ClassName) {
					let message = `Invalid token '${item.target.value}'`
					if (cssDataManager.getProperty(item.target.value)) {
						message += ", missing square brackets?"
					}
					result.push({
						source: DIAGNOSTICS_ID,
						message,
						range: new vscode.Range(
							document.positionAt(offset + item.target.range[0]),
							document.positionAt(offset + item.target.range[1]),
						),
						severity: vscode.DiagnosticSeverity.Error,
					})
					continue
				}

				const twinKeys = item.variants.map(v => v.value.trim().replace(/\s{2,}/g, " ")).sort()
				const property = parser.toKebab(item.target.prop.value)
				const key = [...twinKeys, property].join(".")
				const target = map[key]
				if (target instanceof Array) {
					target.push(item.target.range)
				} else {
					map[key] = [item.target.range]
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
						document.positionAt(offset + item.range[1]),
						document.positionAt(offset + item.range[1] + 1),
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
						document.positionAt(offset + item.range[0]),
						document.positionAt(offset + item.range[1]),
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
		if (node.type === parser.NodeType.ArbitraryVariant) {
			continue
		}
		const {
			value: variant,
			range: [a, b],
		} = node
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

	if (item.target.type !== parser.NodeType.CssDeclaration) {
		return result
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const prop = item.target.prop
	const {
		value,
		range: [start, end],
	} = prop
	if (value.startsWith("--")) {
		return result
	}
	const ret = csspropSearcher.search(parser.toKebab(value))
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
	text: string,
	offset: number,
	state: TailwindLoader,
) {
	const result: IDiagnostic[] = []
	for (const node of item.variants) {
		if (node.type === parser.NodeType.ArbitraryVariant) {
			continue
		}
		const {
			value: variant,
			range: [a, b],
		} = node
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

	const {
		range: [start, end],
	} = item.target
	const value = text.slice(start, end)
	if (state.tw.renderDecls(value).decls.size === 0) {
		const ret = guess(state, value)
		if (ret.score === 0) {
			switch (ret.kind) {
				case PredictionKind.CssProperty:
					result.push({
						source: DIAGNOSTICS_ID,
						message: `Invalid token '${value}', missing square brackets?`,
						range: new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + end)),
						severity: vscode.DiagnosticSeverity.Error,
					})
					break
				case PredictionKind.Variant:
					result.push({
						source: DIAGNOSTICS_ID,
						message: `Invalid token '${value}', missing separator?`,
						range: new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + end)),
						severity: vscode.DiagnosticSeverity.Error,
					})
					break
				default:
					result.push({
						source: DIAGNOSTICS_ID,
						message: `Unknown: ${value}`,
						range: new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + end)),
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

function isIgnored(plugin: keyof Tailwind.CorePluginFeatures | undefined) {
	if (!plugin) return false
	switch (plugin) {
		case "fontVariantNumeric":
		case "inset":
		case "margin":
		case "padding":
		case "borderRadius":
		case "borderWidth":
		case "lineHeight":
		case "backgroundOpacity":
		case "textOpacity":
		case "ringOpacity":
		case "borderOpacity":
		case "divideOpacity":
		case "placeholderOpacity":
		case "transitionDuration":
		case "transitionDelay":
		case "transitionTimingFunction":
		case "scale":
		case "rotate":
		case "skew":
		case "translate":
		case "gradientColorStops":
		case "space":
		case "hueRotate":
		case "brightness":
		case "contrast":
		case "grayscale":
		case "invert":
		case "sepia":
		case "saturate":
		case "backdropHueRotate":
		case "backdropBrightness":
		case "backdropContrast":
		case "backdropGrayscale":
		case "backdropInvert":
		case "backdropSepia":
		case "backdropSaturate":
		case "backdropOpacity":
		case "dropShadow":
			return true
		default:
			return false
	}
}
