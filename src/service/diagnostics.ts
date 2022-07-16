import Fuse from "fuse.js"
import vscode from "vscode"
import type { ExtractedToken, ExtractedTokenKind, TextDocument } from "~/common/extractors/types"
import { defaultLogger as console } from "~/common/logger"
import * as parser from "~/common/parser"
import { cssDataManager } from "~/common/vscode-css-languageservice"
import type { ServiceOptions } from "~/shared"
import { DIAGNOSTICS_ID } from "~/shared"
import { TailwindLoader } from "./tailwind"
import { deprecated } from "./tailwind/data"

export interface IDiagnostic extends vscode.Diagnostic {
	codeActions?: vscode.CodeAction[]
}

const cssProperties = cssDataManager.getProperties().map(c => c.name)
const csspropSearcher = new Fuse(cssProperties, { includeScore: true, isCaseSensitive: true })

function createDiagnosticArray() {
	const arr: vscode.Diagnostic[] = []
	const MAXSZIE = 20
	let errors = 0
	let warnings = 0
	let others = 0
	return new Proxy(arr, {
		get(target, prop, ...rest) {
			switch (prop) {
				case "push":
					return function (item: vscode.Diagnostic) {
						switch (item.severity) {
							case vscode.DiagnosticSeverity.Error:
								if (errors >= MAXSZIE) return 0
								errors++
								break
							case vscode.DiagnosticSeverity.Warning:
								if (warnings >= MAXSZIE << 1) return 0
								warnings++
								break
							default:
								if (others >= MAXSZIE << 2) return 0
								others++
								break
						}
						target.push(item)
						return 1
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
	console.trace(`diagnostic (${Number((end - start) / 10n ** 6n)}ms)`)
	return answer

	function doValidate() {
		try {
			for (const token of tokens) {
				const { kind, start, end, value } = token
				if (kind === "theme") {
					if (
						!validateTwinTheme({
							document,
							text: value,
							offset: start,
							kind,
							diagnosticOptions: options.diagnostics,
							state,
							diagnostics,
						})
					) {
						return diagnostics
					}
				} else if (kind === "screen") {
					if (value) {
						const result = parser.resolvePath(state.config.theme, ["screens", value])
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
				} else if (kind === "tw" || kind === "cs") {
					const result = parser.spread(value, { separator: state.separator })
					if (
						!validateTwin({
							document,
							text: value,
							offset: start,
							kind,
							diagnosticOptions: options.diagnostics,
							state,
							diagnostics,
							...result,
						})
					) {
						return diagnostics
					}
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
	diagnosticOptions,
	items,
	emptyGroup,
	emptyVariants,
	notClosed,
	diagnostics,
}: {
	document: TextDocument
	text: string
	offset: number
	kind: ExtractedTokenKind
	state: TailwindLoader
	diagnosticOptions: ServiceOptions["diagnostics"]
	diagnostics: IDiagnostic[]
} & ReturnType<typeof parser.spread>): boolean {
	for (const e of notClosed) {
		if (
			!diagnostics.push({
				source: DIAGNOSTICS_ID,
				message: "Bracket is not closed.",
				range: new vscode.Range(
					document.positionAt(offset + e.range[0]),
					document.positionAt(offset + e.range[1]),
				),
				severity: vscode.DiagnosticSeverity.Error,
			})
		) {
			return false
		}
	}

	for (let i = 0; i < items.length; i++) {
		const item = items[i]
		if (!checkVariants(diagnostics, item, document, offset, diagnosticOptions.emptyChecking, state)) {
			return false
		}

		switch (item.target.type) {
			case parser.NodeType.ClassName: {
				const ans = checkTwinClassName(item.target, document, text, offset, state)
				if (!ans.some(item => item.severity === vscode.DiagnosticSeverity.Error)) {
					const message = deprecated.get(item.target.value)
					if (message) {
						ans.push({
							message,
							severity: vscode.DiagnosticSeverity.Hint,
							range: new vscode.Range(
								document.positionAt(offset + item.target.range[0]),
								document.positionAt(offset + item.target.range[1]),
							),
							tags: [vscode.DiagnosticTag.Deprecated],
						})
					}
				}
				for (let i = 0; i < ans.length; i++) {
					if (!diagnostics.push(ans[i])) return false
				}
				break
			}
			case parser.NodeType.ShortCss: {
				const ans = checkShortCss(item.target, document, offset, diagnosticOptions.emptyChecking)
				if (!ans.some(item => item.severity === vscode.DiagnosticSeverity.Error)) {
					ans.push({
						message: `Short css is now deprecated, replace it with '[${item.target.prefix.value}: ${item.target.expr.value}]'.`,
						severity: vscode.DiagnosticSeverity.Hint,
						range: new vscode.Range(
							document.positionAt(offset + item.target.range[0]),
							document.positionAt(offset + item.target.range[1]),
						),
						tags: [vscode.DiagnosticTag.Deprecated],
					})
				}
				for (let i = 0; i < ans.length; i++) {
					if (!diagnostics.push(ans[i])) return false
				}
				break
			}
			case parser.NodeType.ArbitraryClassname: {
				const ans = checkArbitraryClassname(
					item.target,
					document,
					offset,
					diagnosticOptions.emptyChecking,
					state,
				)
				for (let i = 0; i < ans.length; i++) {
					if (!diagnostics.push(ans[i])) return false
				}
				break
			}
			case parser.NodeType.ArbitraryProperty: {
				const ans = checkArbitraryProperty(item.target, document, offset, diagnosticOptions.emptyChecking)
				for (let i = 0; i < ans.length; i++) {
					if (!diagnostics.push(ans[i])) return false
				}
				break
			}
		}
	}

	// Check duplicate items
	const mappings: Record<string, parser.Range[]> = {}
	function addItem(key: string, value: parser.Range) {
		const target = mappings[key]
		if (target instanceof Array) {
			target.push(value)
		} else {
			mappings[key] = [value]
		}
	}

	if (kind === "tw") {
		for (let i = 0; i < items.length; i++) {
			const item = items[i]
			if (item.important) {
				continue
			}

			const variants = item.variants
				.map(v => {
					if (v.type === parser.NodeType.ArbitraryVariant) {
						return state.tw.renderArbitraryVariantScopes(v.value, state.separator)
					}
					return v.value.trim().replace(/\s{2,}/g, " ")
				})
				.sort()
			switch (item.target.type) {
				case parser.NodeType.ShortCss: {
					const prop = parser.toKebab(item.target.prefix.value)
					if (isLooseProperty(prop)) {
						const key = [...variants, prop].join(".")
						addItem(key, item.target.range)
						continue
					}
					const key = [undefined, ...variants, prop].join(".")
					addItem(key, item.target.range)
					continue
				}
				case parser.NodeType.ArbitraryProperty: {
					const i = item.target.decl.value.indexOf(":")
					if (i < 0) continue
					const prop = item.target.decl.value.slice(0, i).trim()
					if (isLooseProperty(prop)) {
						const key = [...variants, prop].join(".")
						addItem(key, item.target.range)
						continue
					}
					const key = [undefined, ...variants, prop].join(".")
					addItem(key, item.target.range)
					continue
				}
				default: {
					const label = text.slice(item.target.range[0], item.target.range[1])
					const { decls, scopes } = state.tw.renderDecls(label)
					if (decls.size === 0) continue
					if (isLoose(state, label, decls)) {
						const key = [...variants, ...scopes, Array.from(decls.keys()).sort().join(":")].join(".")
						addItem(key, item.target.range)
					} else {
						for (const [prop] of decls) {
							const key = [undefined, ...variants, ...scopes, prop].join(".")
							addItem(key, item.target.range)
						}
					}
					break
				}
			}
		}
	} else if (kind === "cs") {
		for (let i = 0; i < items.length; i++) {
			const item = items[i]
			if (item.target.type === parser.NodeType.ClassName) {
				let message = `Invalid token '${item.target.value}'`
				if (cssDataManager.getProperty(item.target.value)) {
					message += ", missing square brackets?"
				}
				diagnostics.push({
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

			const variants = item.variants
				.map(v => {
					if (v.type === parser.NodeType.ArbitraryVariant) {
						return state.tw.renderArbitraryVariantScopes(v.value, state.separator)
					}
					return v.value.trim().replace(/\s{2,}/g, " ")
				})
				.sort()
			let prop = ""
			if (item.target.type === parser.NodeType.ArbitraryProperty) {
				const i = item.target.decl.value.indexOf(":")
				if (i < 0) continue
				prop = item.target.decl.value.slice(0, i).trim()
			} else {
				prop = parser.toKebab(item.target.prefix.value)
			}

			if (isLooseProperty(prop)) {
				const key = [...variants, prop].join(".")
				addItem(key, item.target.range)
				continue
			}
			const key = [undefined, ...variants, prop].join(".")
			addItem(key, item.target.range)
		}
	}

	for (const payload in mappings) {
		const items = mappings[payload]
		if (items.length > 1) {
			const parts = payload.split(".")
			const prop = parts[parts.length - 1]
			for (const [a, b] of items) {
				const message = `${text.slice(a, b)} is duplicated on these properties: ${prop.split(":").join(", ")}`
				if (
					!diagnostics.push({
						source: DIAGNOSTICS_ID,
						message,
						range: new vscode.Range(document.positionAt(offset + a), document.positionAt(offset + b)),
						severity: vscode.DiagnosticSeverity.Warning,
					})
				) {
					return false
				}
			}
		}
	}

	for (let i = 0; i < emptyVariants.length; i++) {
		const item = emptyVariants[i]
		if (diagnosticOptions.emptyChecking) {
			if (
				!diagnostics.push({
					source: DIAGNOSTICS_ID,
					message: `Empty block.`,
					range: new vscode.Range(
						document.positionAt(offset + item.range[1]),
						document.positionAt(offset + item.range[1] + 1),
					),
					severity: vscode.DiagnosticSeverity.Warning,
				})
			) {
				return false
			}
		}
	}

	for (let i = 0; i < emptyGroup.length; i++) {
		const item = emptyGroup[i]
		if (diagnosticOptions.emptyChecking) {
			if (
				!diagnostics.push({
					source: DIAGNOSTICS_ID,
					message: `Empty block statement.`,
					range: new vscode.Range(
						document.positionAt(offset + item.range[0]),
						document.positionAt(offset + item.range[1]),
					),
					severity: vscode.DiagnosticSeverity.Warning,
				})
			) {
				return false
			}
		}
	}

	return true
}

function checkVariants(
	diagnostics: IDiagnostic[],
	item: parser.SpreadDescription,
	document: TextDocument,
	offset: number,
	emptyChecking: boolean,
	state: TailwindLoader,
) {
	for (const node of item.variants) {
		if (node.type === parser.NodeType.ArbitrarySelector || node.type === parser.NodeType.ArbitraryVariant) {
			// FIXME: duplicate checking
			// if (emptyChecking && node.selector.value.trim() === "") {
			// 	if (
			// 		!diagnostics.push({
			// 			source: DIAGNOSTICS_ID,
			// 			message: `Empty block statement.`,
			// 			range: new vscode.Range(
			// 				document.positionAt(offset + node.selector.range[0] - 1),
			// 				document.positionAt(offset + node.selector.range[1] + 1),
			// 			),
			// 			severity: vscode.DiagnosticSeverity.Warning,
			// 		})
			// 	) {
			// 		return false
			// 	}
			// }
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
		const range = new vscode.Range(document.positionAt(offset + a), document.positionAt(offset + b))
		const diagnostic: IDiagnostic = {
			message: "",
			source: DIAGNOSTICS_ID,
			range,
			severity: vscode.DiagnosticSeverity.Error,
		}
		if (ans) {
			const action = new vscode.CodeAction(`Replace '${variant}' with '${ans}'`, vscode.CodeActionKind.QuickFix)
			action.edit = new vscode.WorkspaceEdit()
			action.edit.replace(document.uri, range, ans)
			diagnostic.message = `'${variant}' is an unknown variant, did you mean '${ans}'?`
			diagnostic.codeActions = [action]
		} else {
			diagnostic.message = `'${variant}' is an unknown variant.`
		}
		if (!diagnostics.push(diagnostic)) {
			return false
		}
	}
	return true
}

function checkShortCss(item: parser.ShortCss, document: TextDocument, offset: number, emptyChecking: boolean) {
	const result: IDiagnostic[] = []
	const prop = item.prefix
	const {
		value,
		range: [start, end],
	} = prop
	if (value.startsWith("--")) return result
	const range = new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + end))
	const ret = csspropSearcher.search(parser.toKebab(value))
	const score = ret?.[0]?.score
	if (score == undefined) {
		result.push({
			source: DIAGNOSTICS_ID,
			message: `'${value}' is unknown.`,
			range,
			severity: vscode.DiagnosticSeverity.Error,
		})
	} else if (score > 0) {
		const action = new vscode.CodeAction(`Replace '${value}' with '${ret[0].item}'`, vscode.CodeActionKind.QuickFix)
		action.edit = new vscode.WorkspaceEdit()
		action.edit.replace(document.uri, range, ret[0].item)
		result.push({
			source: DIAGNOSTICS_ID,
			message: `'${value}' is unknown, did you mean '${ret[0].item}'?`,
			range,
			codeActions: [action],
			severity: vscode.DiagnosticSeverity.Error,
		})
	}
	if (emptyChecking && item.expr.value.trim() === "") {
		result.push({
			source: DIAGNOSTICS_ID,
			message: `forgot something?`,
			range: new vscode.Range(
				document.positionAt(offset + item.expr.range[0] - 1),
				document.positionAt(offset + item.expr.range[1] + 1),
			),
			severity: vscode.DiagnosticSeverity.Warning,
		})
	}
	return result
}

function checkArbitraryClassname(
	item: parser.ArbitraryClassname,
	document: TextDocument,
	offset: number,
	emptyChecking: boolean,
	state: TailwindLoader,
) {
	const result: IDiagnostic[] = []
	if (emptyChecking) {
		if (item.expr && item.expr.value.trim() === "") {
			result.push({
				source: DIAGNOSTICS_ID,
				message: `forgot something?`,
				range: new vscode.Range(
					document.positionAt(offset + item.expr.range[0] - 1),
					document.positionAt(offset + item.expr.range[1] + 1),
				),
				severity: vscode.DiagnosticSeverity.Warning,
			})
		}
	}

	let prefix = item.prefix.value
	if (item.expr == undefined) {
		const [start, end] = item.prefix.range
		const range = new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + end - 1))
		const ret = guess(state, prefix)
		if (ret.score === 0) {
			return result
		}
		if (ret.value) {
			const action = new vscode.CodeAction(
				`Replace '${prefix}' with '${ret.value}'`,
				vscode.CodeActionKind.QuickFix,
			)
			action.edit = new vscode.WorkspaceEdit()
			action.edit.replace(document.uri, range, ret.value)
			result.push({
				source: DIAGNOSTICS_ID,
				message: `'${prefix}' is an unknown value, did you mean '${ret.value}'?`,
				range,
				codeActions: [action],
				severity: vscode.DiagnosticSeverity.Error,
			})
		} else {
			result.push({
				source: DIAGNOSTICS_ID,
				message: `'${prefix}' is an unknown value.`,
				range,
				severity: vscode.DiagnosticSeverity.Error,
			})
		}
		return result
	}

	if (prefix[0] === "-") prefix = prefix.slice(1)
	if (prefix.startsWith(state.tw.prefix)) prefix = prefix.slice(state.tw.prefix.length)
	if (!state.tw.arbitrary[prefix]) {
		const start = item.range[0]
		const end = start + prefix.length
		const range = new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + end))
		result.push({
			source: DIAGNOSTICS_ID,
			message: `'${prefix}' is an unknown value.`,
			range,
			severity: vscode.DiagnosticSeverity.Error,
		})
	} else {
		const message = deprecated.get(prefix.slice(0, -1))
		if (message) {
			result.push({
				message,
				severity: vscode.DiagnosticSeverity.Hint,
				range: new vscode.Range(
					document.positionAt(offset + item.range[0]),
					document.positionAt(offset + item.range[1]),
				),
				tags: [vscode.DiagnosticTag.Deprecated],
			})
		}
	}

	return result
}

function checkArbitraryProperty(
	item: parser.ArbitraryProperty,
	document: TextDocument,
	offset: number,
	emptyChecking: boolean,
) {
	const result: IDiagnostic[] = []
	let prop = item.decl.value.trim()
	if (!prop) {
		if (emptyChecking) {
			result.push({
				source: DIAGNOSTICS_ID,
				message: `forgot something?`,
				range: new vscode.Range(
					document.positionAt(offset + item.range[0]),
					document.positionAt(offset + item.range[1]),
				),
				severity: vscode.DiagnosticSeverity.Warning,
			})
		}
		return result
	}
	const i = item.decl.value.indexOf(":")
	if (i >= 0) prop = item.decl.value.slice(0, i).trim()
	const start = item.decl.range[0] + item.decl.value.search(/\w/)
	const end = start + prop.length
	if (prop.startsWith("--")) return result
	const range = new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + end))
	const ret = csspropSearcher.search(prop)
	const score = ret?.[0]?.score
	if (score == undefined) {
		result.push({
			source: DIAGNOSTICS_ID,
			message: `'${prop}' is an unknown value.`,
			range,
			severity: vscode.DiagnosticSeverity.Error,
		})
	} else if (score > 0) {
		const action = new vscode.CodeAction(`Replace '${prop}' with '${ret[0].item}'`, vscode.CodeActionKind.QuickFix)
		action.edit = new vscode.WorkspaceEdit()
		action.edit.replace(document.uri, range, ret[0].item)
		result.push({
			source: DIAGNOSTICS_ID,
			message: `'${prop}' is an unknown value, did you mean '${ret[0].item}'?`,
			range,
			codeActions: [action],
			severity: vscode.DiagnosticSeverity.Error,
		})
	}
	return result
}

function checkTwinClassName(
	item: parser.Classname,
	document: TextDocument,
	text: string,
	offset: number,
	state: TailwindLoader,
) {
	const result: IDiagnostic[] = []

	const {
		range: [start, end],
	} = item
	const value = text.slice(start, end)
	const range = new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + end))
	if (state.tw.renderDecls(value).decls.size === 0) {
		const ret = guess(state, value)
		if (ret.score === 0) {
			switch (ret.kind) {
				case PredictionKind.CssProperty:
					result.push({
						source: DIAGNOSTICS_ID,
						message: `Invalid token '${value}', missing square brackets?`,
						range,
						severity: vscode.DiagnosticSeverity.Error,
					})
					break
				case PredictionKind.Variant:
					result.push({
						source: DIAGNOSTICS_ID,
						message: `Invalid token '${value}', missing separator?`,
						range,
						severity: vscode.DiagnosticSeverity.Error,
					})
					break
				default:
					result.push({
						source: DIAGNOSTICS_ID,
						message: `'${value}' is an unknown value.`,
						range,
						severity: vscode.DiagnosticSeverity.Error,
					})
			}
		} else if (ret.value) {
			const action = new vscode.CodeAction(
				`Replace '${value}' with '${ret.value}'`,
				vscode.CodeActionKind.QuickFix,
			)
			action.edit = new vscode.WorkspaceEdit()
			action.edit.replace(document.uri, range, ret.value)
			result.push({
				source: DIAGNOSTICS_ID,
				message: `'${value}' is an unknown value, did you mean '${ret.value}'?`,
				range,
				codeActions: [action],
				severity: vscode.DiagnosticSeverity.Error,
			})
		} else {
			result.push({
				source: DIAGNOSTICS_ID,
				message: `'${value}' is an unknown value.`,
				range,
				severity: vscode.DiagnosticSeverity.Error,
			})
		}
	}

	// https://tailwindcss.com/docs/text-color#changing-the-opacity
	if (result.length === 0 && state.isDeprecated(value)) {
		result.push({
			message: "",
			severity: vscode.DiagnosticSeverity.Hint,
			relatedInformation: [],
			range,
			tags: [vscode.DiagnosticTag.Deprecated],
		})
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

function isLoose(state: TailwindLoader, label: string, decls: Map<string, string[]>) {
	const pname = state.tw.getPlugin(label)?.getName()
	if (!pname) return true
	switch (pname) {
		case "lineHeight":
		case "transitionDuration":
		case "transitionDelay":
		case "transitionTimingFunction":
			return true
	}

	for (const k of decls.keys()) {
		if (isLooseProperty(k)) return true
	}
	return false
}

function isLooseProperty(prop: string) {
	if (/\b(?:top|right|bottom|left)\b/.test(prop)) return true
	if (prop.startsWith("--")) return true
	return false
}

function validateTwinTheme({
	document,
	text,
	offset,
	kind,
	state,
	diagnosticOptions,
	diagnostics,
}: {
	document: TextDocument
	text: string
	offset: number
	kind: ExtractedTokenKind
	state: TailwindLoader
	diagnosticOptions: ServiceOptions["diagnostics"]
	diagnostics: IDiagnostic[]
}): boolean {
	let diagnostic: IDiagnostic | undefined
	const { path, range } = parser.parse_theme_val({ text })
	for (const { closed, range } of path) {
		if (!closed) {
			const [a] = range
			diagnostic = {
				range: new vscode.Range(document.positionAt(offset + a), document.positionAt(offset + a)),
				source: DIAGNOSTICS_ID,
				message: "Syntax Error",
				severity: vscode.DiagnosticSeverity.Error,
			}
			break
		}
	}
	if (!diagnostic) {
		const { value } = parser.theme(state.config, path)
		if (value === undefined) {
			diagnostic = {
				range: new vscode.Range(document.positionAt(offset + range[0]), document.positionAt(offset + range[1])),
				source: DIAGNOSTICS_ID,
				message: "value is undefined",
				severity: vscode.DiagnosticSeverity.Error,
			}
		}
	}
	if (diagnostic) {
		return diagnostics.push(diagnostic) > 0
	}
	return true
}
