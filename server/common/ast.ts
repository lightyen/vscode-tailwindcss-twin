import ts from "typescript"
import * as lsp from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import * as tw from "./twin"

// https://code.visualstudio.com/docs/languages/identifiers#_known-language-identifiers
export type Language = "javascript" | "javascriptreact" | "typescript" | "typescriptreact"

const twinLabel = "twin.macro"

export enum PatternKind {
	Twin = "tw",
	TwinTheme = "theme",
	TwinCssProperty = "cs",
}

interface Features {
	jsxProp: boolean
	twTemplate: Set<string>
	themeTemplate: Set<string>
}

export type TokenResult = { token: tw.Token; kind: PatternKind }

function transfromToken(
	result: { kind: PatternKind; token: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral },
	source: ts.SourceFile,
): TokenResult {
	const text = result.token.getText(source)
	const start = result.token.getStart(source) + 1
	let end = result.token.getEnd()
	const value = ts.isNoSubstitutionTemplateLiteral(result.token) ? result.token.rawText : result.token.text
	if (/['"`]$/.test(text)) {
		end -= 1
		return { kind: result.kind, token: tw.createToken(start, end, value) }
	} else {
		const m = text.match(/[ \r\t\n]/)
		if (m) {
			end = start + m.index
			return { kind: result.kind, token: tw.createToken(start, end, value.slice(0, m.index)) }
		}
		return { kind: result.kind, token: tw.createToken(start, end, value) }
	}
}

function find<T>(
	source: ts.SourceFile,
	node: ts.Node,
	cb: (node: T) => node is T,
	position: number | undefined = undefined,
): T {
	if (typeof position == "number") {
		if (position < node.getStart(source) || position >= node.getEnd()) {
			return undefined
		}
	}
	if (cb((node as unknown) as T)) {
		return (node as unknown) as T
	}
	return ts.forEachChild(node, child => find(source, child, cb, position))
}

function findNode(
	source: ts.SourceFile,
	node: ts.Node,
	position: number,
	features: Features,
): { token: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral; kind: PatternKind } {
	if (position < node.getStart(source) || position >= node.getEnd()) {
		return undefined
	}
	if (ts.isJsxAttribute(node)) {
		const id = node.getFirstToken(source).getText(source)
		if (features.jsxProp && id === PatternKind.Twin) {
			const token = find(source, node, ts.isStringLiteral, position)
			if (!token) {
				return undefined
			}
			if (position < token.getStart(source) + 1 || position >= token.getEnd()) {
				return undefined
			}
			return { token, kind: PatternKind.Twin }
		} else if (features.jsxProp && id === PatternKind.TwinCssProperty) {
			const token = find(source, node, ts.isStringLiteral, position)
			if (!token) {
				return undefined
			}
			if (position < token.getStart(source) + 1 || position >= token.getEnd()) {
				return undefined
			}
			return { token, kind: PatternKind.TwinCssProperty }
		}
	} else if (ts.isTaggedTemplateExpression(node)) {
		const getLiteral = (node: ts.Node) => {
			const literal = node.getChildAt(1, source)
			if (ts.isNoSubstitutionTemplateLiteral(literal)) {
				return literal
			}
			return undefined
		}

		const id = node.getFirstToken(source).getText(source)
		if (features.twTemplate.has(id)) {
			const token = getLiteral(node)
			if (token) {
				if (position < token.getStart(source) + 1 || position >= token.getEnd()) {
					return undefined
				}
				return { token, kind: PatternKind.Twin }
			} else {
				return undefined
			}
		} else if (features.themeTemplate.has(id)) {
			const token = getLiteral(node)
			if (token) {
				if (position < token.getStart(source) + 1 || position >= token.getEnd()) {
					return undefined
				}
				return { token, kind: PatternKind.TwinTheme }
			} else {
				return undefined
			}
		} else {
			const expr = find(source, node, ts.isTemplateExpression)
			if (!expr) {
				return undefined
			}
		}
	}
	return ts.forEachChild(node, child => findNode(source, child, position, features))
}

function findAllNode(
	source: ts.SourceFile,
	node: ts.Node,
	features: Features,
): Array<{ token: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral; kind: PatternKind }> {
	if (ts.isJsxAttribute(node)) {
		const id = node.getFirstToken(source).getText(source)
		if (features.jsxProp && id === PatternKind.Twin) {
			const token = find(source, node, ts.isStringLiteral)
			if (!token) {
				return undefined
			}
			return [{ token, kind: PatternKind.Twin }]
		} else if (features.jsxProp && id === PatternKind.TwinCssProperty) {
			const token = find(source, node, ts.isStringLiteral)
			if (!token) {
				return undefined
			}
			return [{ token, kind: PatternKind.TwinCssProperty }]
		}
	} else if (ts.isTaggedTemplateExpression(node)) {
		const getLiteral = (node: ts.Node) => {
			const literal = node.getChildAt(1, source)
			if (ts.isNoSubstitutionTemplateLiteral(literal)) {
				return literal
			}
			return undefined
		}

		const id = node.getFirstToken(source).getText(source)

		if (features.twTemplate.has(id)) {
			const literal = getLiteral(node)
			if (literal) {
				return [{ token: literal, kind: PatternKind.Twin }]
			} else {
				return undefined
			}
		} else if (features.themeTemplate.has(id)) {
			const literal = getLiteral(node)
			if (literal) {
				return [{ token: literal, kind: PatternKind.TwinTheme }]
			} else {
				return undefined
			}
		} else {
			const expr = find(source, node, ts.isTemplateExpression)
			if (!expr) {
				return undefined
			}
		}
	}
	return node
		.getChildren(source)
		.map(c => findAllNode(source, c, features))
		.filter(Boolean)
		.flat()
}

function checkImportTwin(source: ts.SourceFile, jsxPropChecking = true): Features {
	let jsxProp = !jsxPropChecking
	const twTemplate = new Set<string>()
	const themeTemplate = new Set<string>()
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

					ts.getJSDocReadonlyTag
					const namedImports = find(source, clause, ts.isNamedImports)
					if (namedImports) {
						namedImports.forEachChild(node => {
							if (ts.isImportSpecifier(node)) {
								if (node.getFirstToken(source)?.getText(source) === PatternKind.TwinTheme) {
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
								}
							}
						})
					}
				}
			}
		}
	})
	return { jsxProp, twTemplate, themeTemplate }
}

export function findToken(source: ts.SourceFile, position: number, jsxPropChecking = true): TokenResult {
	const features = checkImportTwin(source, jsxPropChecking)
	const node = findNode(source, source, position, features)
	if (node) {
		return transfromToken(node, source)
	}
	return undefined
}

export function findAllToken(source: ts.SourceFile, jsxPropChecking = true): TokenResult[] {
	const features = checkImportTwin(source, jsxPropChecking)
	try {
		const nodes = findAllNode(source, source, features)
		return nodes.map(node => transfromToken(node, source))
	} catch {
		return []
	}
}

export function canMatch(
	document: TextDocument,
	position: lsp.Position,
	hover: boolean,
	jsxPropChecking = true,
): TokenResult {
	const pos = document.offsetAt(position) + (hover ? 1 : 0)
	let scriptKind: ts.ScriptKind
	switch (document.languageId) {
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
		const source = ts.createSourceFile("", document.getText(), ts.ScriptTarget.Latest, false, scriptKind)
		const token = findToken(source, pos, jsxPropChecking)
		if (!token) {
			return undefined
		}
		return token
	}
	return undefined
}

export function findAllMatch(document: TextDocument, jsxPropChecking = true): TokenResult[] {
	let scriptKind: ts.ScriptKind
	switch (document.languageId) {
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
		const source = ts.createSourceFile("", document.getText(), ts.ScriptTarget.Latest, false, scriptKind)
		return findAllToken(source, jsxPropChecking)
	}
	return []
}
