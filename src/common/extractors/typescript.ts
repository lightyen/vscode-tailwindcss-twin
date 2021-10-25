import ts from "typescript"
import { ExtractedToken, ExtractedTokenKind, Extractor } from "."

const twinLabel = "twin.macro"

interface Features {
	jsxProp: boolean
	twTemplate: Set<string>
	themeTemplate: Set<string>
	screenTemplate: Set<string>
}

function transfromToken(
	result: { kind: ExtractedTokenKind; token: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral },
	source: ts.SourceFile,
): ExtractedToken {
	const text = result.token.getText(source)
	const start = result.token.getStart(source) + 1
	let end = result.token.getEnd()
	const value = ts.isNoSubstitutionTemplateLiteral(result.token) ? result.token.rawText ?? "" : result.token.text
	if (/['"`]$/.test(text)) {
		end -= 1
		return { kind: result.kind, start, end, value }
	} else {
		const m = text.match(/[ \r\t\n]/)
		if (m?.index != undefined) {
			end = start + m.index
			return { kind: result.kind, start, end, value: value.slice(0, m.index) }
		}
		return { kind: result.kind, start, end, value }
	}
}

function find<T>(
	source: ts.SourceFile,
	node: ts.Node,
	cb: (node: T) => node is T,
	position: number | undefined = undefined,
): T | undefined {
	if (typeof position == "number") {
		if (position < node.getStart(source) || position >= node.getEnd()) {
			return undefined
		}
	}
	if (cb(node as unknown as T)) {
		return node as unknown as T
	}
	return ts.forEachChild(node, child => find(source, child, cb, position))
}

function getJsxPropFirstStringLiteral(node: ts.JsxAttribute, source: ts.SourceFile): ts.StringLiteral | undefined {
	if (node.getChildCount(source) < 3) {
		return undefined
	}
	const target = node.getChildAt(2, source)
	let token: ts.StringLiteral | undefined
	if (ts.isStringLiteral(target)) {
		token = target
	} else if (ts.isJsxExpression(target)) {
		for (let i = 0; i < target.getChildCount(source); i++) {
			const t = target.getChildAt(i, source)
			if (ts.isStringLiteral(t)) {
				token = t
				break
			}
		}
	}
	return token
}

function findNode(
	source: ts.SourceFile,
	node: ts.Node,
	position: number,
	features: Features,
): { token: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral; kind: ExtractedTokenKind } | undefined {
	if (position < node.getStart(source) || position >= node.getEnd()) {
		return undefined
	}
	if (ts.isJsxAttribute(node)) {
		const first = node.getFirstToken(source)
		if (!first) {
			return undefined
		}
		const id = first.getText(source)
		if (features.jsxProp && id === ExtractedTokenKind.Twin) {
			const token = getJsxPropFirstStringLiteral(node, source)
			if (!token) {
				return undefined
			}
			if (position < token.getStart(source) + 1 || position >= token.getEnd()) {
				return undefined
			}
			return { token, kind: ExtractedTokenKind.Twin }
		} else if (features.jsxProp && id === ExtractedTokenKind.TwinCssProperty) {
			const token = getJsxPropFirstStringLiteral(node, source)
			if (!token) {
				return undefined
			}
			if (position < token.getStart(source) + 1 || position >= token.getEnd()) {
				return undefined
			}
			return { token, kind: ExtractedTokenKind.TwinCssProperty }
		}
	} else if (ts.isTaggedTemplateExpression(node)) {
		const getLiteral = (node: ts.Node) => {
			const literal = node.getChildAt(1, source)
			if (ts.isNoSubstitutionTemplateLiteral(literal)) {
				return literal
			}
			return undefined
		}

		const first = node.getFirstToken(source)
		if (!first) {
			return undefined
		}
		const id = first.getText(source)
		if (features.twTemplate.has(id)) {
			const token = getLiteral(node)
			if (token) {
				if (position < token.getStart(source) + 1 || position >= token.getEnd()) {
					return undefined
				}
				return { token, kind: ExtractedTokenKind.Twin }
			} else {
				return undefined
			}
		} else if (features.themeTemplate.has(id)) {
			const token = getLiteral(node)
			if (token) {
				if (position < token.getStart(source) + 1 || position >= token.getEnd()) {
					return undefined
				}
				return { token, kind: ExtractedTokenKind.TwinTheme }
			} else {
				return undefined
			}
		} else if (features.screenTemplate.has(id)) {
			const token = getLiteral(node)
			if (token) {
				if (position < token.getStart(source) + 1 || position >= token.getEnd()) {
					return undefined
				}
				return { token, kind: ExtractedTokenKind.TwinScreen }
			} else {
				return undefined
			}
		} else {
			const expr = find(source, node, ts.isTemplateExpression)
			if (!expr) {
				return undefined
			}
		}
	} else if (ts.isCallExpression(node)) {
		if (position < node.getStart(source) + 1 || position >= node.getEnd()) {
			return undefined
		}

		const first = node.getChildAt(0, source)
		if (first && ts.isIdentifier(first)) {
			if (features.themeTemplate.has(first.getText(source))) {
				const token = ts.forEachChild(node, c => {
					if (ts.isStringLiteral(c)) {
						return c
					}
					return undefined
				})
				if (!token) {
					return undefined
				}
				if (position < node.getStart(source) + 1 || position >= node.getEnd()) {
					return undefined
				}
				return { token, kind: ExtractedTokenKind.TwinTheme }
			}

			if (features.screenTemplate.has(first.getText(source))) {
				const token = ts.forEachChild(node, c => {
					if (ts.isStringLiteral(c)) {
						return c
					}
					return undefined
				})
				if (!token) {
					return undefined
				}
				if (position < node.getStart(source) + 1 || position >= node.getEnd()) {
					return undefined
				}
				return { token, kind: ExtractedTokenKind.TwinScreen }
			}
		}
	}
	return ts.forEachChild(node, child => findNode(source, child, position, features))
}

function notEmpty<T>(value: T | null | undefined): value is T {
	return value != undefined
}

function findAllNode(
	source: ts.SourceFile,
	node: ts.Node,
	features: Features,
): Array<{ token: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral; kind: ExtractedTokenKind }> | undefined {
	if (ts.isJsxAttribute(node)) {
		const first = node.getFirstToken(source)
		if (!first) {
			return undefined
		}

		const id = first.getText(source)
		if (features.jsxProp && id === ExtractedTokenKind.Twin) {
			const token = getJsxPropFirstStringLiteral(node, source)
			if (!token) {
				return undefined
			}
			return [{ token, kind: ExtractedTokenKind.Twin }]
		} else if (features.jsxProp && id === ExtractedTokenKind.TwinCssProperty) {
			const token = getJsxPropFirstStringLiteral(node, source)
			if (!token) {
				return undefined
			}
			return [{ token, kind: ExtractedTokenKind.TwinCssProperty }]
		}
	} else if (ts.isTaggedTemplateExpression(node)) {
		const getLiteral = (node: ts.Node) => {
			const literal = node.getChildAt(1, source)
			if (ts.isNoSubstitutionTemplateLiteral(literal)) {
				return literal
			}
			return undefined
		}

		const first = node.getFirstToken(source)
		if (!first) {
			return undefined
		}

		const id = first.getText(source)
		if (features.twTemplate.has(id)) {
			const literal = getLiteral(node)
			if (literal) {
				return [{ token: literal, kind: ExtractedTokenKind.Twin }]
			} else {
				return undefined
			}
		} else if (features.themeTemplate.has(id)) {
			const literal = getLiteral(node)
			if (literal) {
				return [{ token: literal, kind: ExtractedTokenKind.TwinTheme }]
			} else {
				return undefined
			}
		} else if (features.screenTemplate.has(id)) {
			const literal = getLiteral(node)
			if (literal) {
				return [{ token: literal, kind: ExtractedTokenKind.TwinScreen }]
			} else {
				return undefined
			}
		} else {
			const expr = find(source, node, ts.isTemplateExpression)
			if (!expr) {
				return undefined
			}
		}
	} else if (ts.isCallExpression(node)) {
		const first = node.getChildAt(0, source)
		if (first && ts.isIdentifier(first)) {
			if (features.themeTemplate.has(first.getText(source))) {
				const token = ts.forEachChild(node, c => {
					if (ts.isStringLiteral(c)) {
						return c
					}
					return undefined
				})
				if (!token) {
					return undefined
				}
				return [{ token, kind: ExtractedTokenKind.TwinTheme }]
			}

			if (features.screenTemplate.has(first.getText(source))) {
				const token = ts.forEachChild(node, c => {
					if (ts.isStringLiteral(c)) {
						return c
					}
					return undefined
				})
				if (!token) {
					return undefined
				}
				return [{ token, kind: ExtractedTokenKind.TwinScreen }]
			}
		}
	}
	return node
		.getChildren(source)
		.map(c => findAllNode(source, c, features))
		.filter(notEmpty)
		.flat()
}

function checkImportTwin(source: ts.SourceFile, jsxPropChecking = true): Features {
	let jsxProp = !jsxPropChecking
	const twTemplate = new Set<string>()
	const themeTemplate = new Set<string>()
	const screenTemplate = new Set<string>()

	source.forEachChild(node => {
		if (ts.isImportDeclaration(node)) {
			const token = find(source, node, ts.isStringLiteral)
			if (token?.text === twinLabel) {
				jsxProp = true
				const clause = find(source, node, ts.isImportClause)
				if (clause) {
					clause.forEachChild(node => {
						if (ts.isIdentifier(node)) {
							const identifier = node.getText(source)
							if (!twTemplate.has(identifier)) {
								twTemplate.add(identifier)
							}
						}
					})

					const namedImports = find(source, clause, ts.isNamedImports)
					if (namedImports) {
						namedImports.forEachChild(node => {
							if (ts.isImportSpecifier(node)) {
								if (node.getFirstToken(source)?.getText(source) === ExtractedTokenKind.TwinTheme) {
									const count = node.getChildCount(source)
									if (count === 1) {
										const identifier = node.getFirstToken(source)?.getText(source)
										if (identifier && !themeTemplate.has(identifier)) {
											themeTemplate.add(identifier)
										}
									} else if (count === 3) {
										const identifier = node.getLastToken(source)?.getText(source)
										if (identifier && !themeTemplate.has(identifier)) {
											themeTemplate.add(identifier)
										}
									}
								} else if (
									node.getFirstToken(source)?.getText(source) === ExtractedTokenKind.TwinScreen
								) {
									const count = node.getChildCount(source)
									if (count === 1) {
										const identifier = node.getFirstToken(source)?.getText(source)
										if (identifier && !screenTemplate.has(identifier)) {
											screenTemplate.add(identifier)
										}
									} else if (count === 3) {
										const identifier = node.getLastToken(source)?.getText(source)
										if (identifier && !screenTemplate.has(identifier)) {
											screenTemplate.add(identifier)
										}
									}
								}
							}
						})
					}
				}
			}
		}
	})
	return { jsxProp, twTemplate, themeTemplate, screenTemplate }
}

export function findToken(source: ts.SourceFile, position: number, jsxPropChecking = true): ExtractedToken | undefined {
	const features = checkImportTwin(source, jsxPropChecking)
	const node = findNode(source, source, position, features)
	if (node == undefined) {
		return undefined
	}
	return transfromToken(node, source)
}

export function findAllToken(source: ts.SourceFile, jsxPropChecking = true): ExtractedToken[] {
	const features = checkImportTwin(source, jsxPropChecking)
	return findAllNode(source, source, features)?.map(node => transfromToken(node, source)) ?? []
}

export const typescriptExtractor: Extractor = {
	findAll(languageId, code, jsxPropImportChecking) {
		let scriptKind: ts.ScriptKind | undefined
		switch (languageId) {
			case "typescript":
				scriptKind = ts.ScriptKind.TS
				break
			case "javascript":
				scriptKind = ts.ScriptKind.JS
				break
			case "typescriptreact":
				scriptKind = ts.ScriptKind.TSX
				break
			case "javascriptreact":
				scriptKind = ts.ScriptKind.JSX
				break
			default:
				scriptKind = undefined
		}
		if (scriptKind) {
			const source = ts.createSourceFile("", code, ts.ScriptTarget.Latest, false, scriptKind)
			try {
				return findAllToken(source, jsxPropImportChecking)
			} catch {
				return []
			}
		}
		return []
	},
	find(languageId, code, position, hover, jsxPropImportChecking) {
		const pos = position + (hover ? 1 : 0)
		let scriptKind: ts.ScriptKind | undefined
		switch (languageId) {
			case "typescript":
				scriptKind = ts.ScriptKind.TS
				break
			case "javascript":
				scriptKind = ts.ScriptKind.JS
				break
			case "typescriptreact":
				scriptKind = ts.ScriptKind.TSX
				break
			case "javascriptreact":
				scriptKind = ts.ScriptKind.JSX
				break
			default:
				scriptKind = undefined
		}
		if (scriptKind) {
			const source = ts.createSourceFile("", code, ts.ScriptTarget.Latest, false, scriptKind)
			const token = findToken(source, pos, jsxPropImportChecking)
			if (!token) {
				return undefined
			}
			return token
		}
		return undefined
	},
}
