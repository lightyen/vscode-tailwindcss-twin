import * as lsp from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import ts from "typescript"
import { Token } from "./typings"

// https://code.visualstudio.com/docs/languages/identifiers#_known-language-identifiers
export type Language = "javascript" | "javascriptreact" | "typescript" | "typescriptreact" | "html"

export enum PatternKind {
	Twin = 1,
	TwinTheme = 2,
	ClassName = 3,
	Html = 4,
}

interface Features {
	twProp: boolean
	twTemplate: boolean
	themeTemplate: string
}

export type TokenResult = { token: Token; kind: PatternKind }

function transfromToken(result: { kind: PatternKind; token: ts.Node }, source: ts.SourceFile): TokenResult {
	const t = result.token.getText(source)
	const start = result.token.getStart(source) + 1
	let end = result.token.getEnd()
	if (t.endsWith("'") || t.endsWith('"') || t.endsWith("`")) {
		end -= 1
		return { kind: result.kind, token: [start, end, result.token["text"]] }
	} else {
		const text = result.token["text"] as string
		const m = text.match(/[ \r\t\n]/)
		if (m) {
			end = start + m.index
			return { kind: result.kind, token: [start, end, text.substring(0, m.index)] }
		}
		return { kind: result.kind, token: [start, end, text] }
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
): { token: ts.Node; kind: PatternKind } {
	if (position < node.getStart(source) || position >= node.getEnd()) {
		return undefined
	}
	if (ts.isJsxAttribute(node)) {
		const id = node.getFirstToken(source).getText(source)
		if (features.twProp && id === "tw") {
			const token = find(source, node, ts.isStringLiteral, position)
			if (!token) {
				return undefined
			}
			if (position < token.getStart(source) + 1 || position >= token.getEnd()) {
				return undefined
			}
			return { token, kind: PatternKind.Twin }
		} else if (id === "className") {
			const token = find(source, node, ts.isStringLiteral, position)
			if (!token) {
				return undefined
			}
			if (position < token.getStart(source) + 1 || position >= token.getEnd()) {
				return undefined
			}
			return { token, kind: PatternKind.ClassName }
		} else if (id !== "css") {
			return undefined
		}
	} else if (ts.isTaggedTemplateExpression(node)) {
		const token = find(source, node, ts.isNoSubstitutionTemplateLiteral, position)
		if (token) {
			if (position < token.getStart(source) + 1 || position >= token.getEnd()) {
				return undefined
			}
			const id = node.getFirstToken(source).getText(source)
			if (features.twTemplate && id === "tw") {
				return { token, kind: PatternKind.Twin }
			} else if (features.themeTemplate && id === features.themeTemplate) {
				return { token, kind: PatternKind.TwinTheme }
			}
		}
	}
	return ts.forEachChild(node, child => findNode(source, child, position, features))
}

function findAllNode(
	source: ts.SourceFile,
	node: ts.Node,
	features: Features,
): Array<{ token: ts.Node; kind: PatternKind }> {
	if (ts.isJsxAttribute(node)) {
		const id = node.getFirstToken(source).getText(source)
		if (features.twProp && id === "tw") {
			const token = find(source, node, ts.isStringLiteral)
			if (!token) {
				return undefined
			}
			return [{ token, kind: PatternKind.Twin }]
		} else if (id === "className") {
			const token = find(source, node, ts.isStringLiteral)
			if (!token) {
				return undefined
			}
			return [{ token, kind: PatternKind.ClassName }]
		} else if (id !== "css") {
			return undefined
		}
	} else if (ts.isTaggedTemplateExpression(node)) {
		const token = find(source, node, ts.isNoSubstitutionTemplateLiteral)
		if (token) {
			const id = node.getFirstToken(source).getText(source)
			if (features.twTemplate && id === "tw") {
				return [{ token, kind: PatternKind.Twin }]
			} else if (features.themeTemplate && id === features.themeTemplate) {
				return [{ token, kind: PatternKind.TwinTheme }]
			}
		}
	}
	return node
		.getChildren(source)
		.map(c => findAllNode(source, c, features))
		.filter(Boolean)
		.flat()
}

function checkImportTwin(source: ts.SourceFile): Features {
	let twProp = false
	let twTemplate = false
	let themeTemplate: string = undefined
	source.forEachChild(node => {
		if (ts.isImportDeclaration(node)) {
			const token = find(source, node, ts.isStringLiteral)
			if (token?.text === "twin.macro") {
				twProp = true
				const clause = find(source, node, ts.isImportClause)
				if (clause) {
					const first = clause.getChildAt(0, source)
					if (first?.getText(source) === "tw") {
						twTemplate = true
					}
					if (!themeTemplate) {
						clause.forEachChild(node => {
							if (ts.isNamedImports(node)) {
								node.forEachChild(node => {
									if (ts.isImportSpecifier(node)) {
										if (node.getFirstToken(source)?.getText(source) === "theme") {
											themeTemplate = "theme"
										}
										if (themeTemplate) {
											const b = node.getLastToken(source)
											if (b) themeTemplate = b.getText(source)
										}
									}
								})
							}
						})
					}
				}
			}
		}
	})
	return { twProp, twTemplate, themeTemplate }
}

export function findToken(source: ts.SourceFile, position: number): TokenResult {
	const features = checkImportTwin(source)
	const node = findNode(source, source, position, features)
	if (node) {
		return transfromToken(node, source)
	}
	return undefined
}

export function findAllToken(source: ts.SourceFile): TokenResult[] {
	const features = checkImportTwin(source)
	const nodes = findAllNode(source, source, features)
	return nodes.map(node => transfromToken(node, source))
}

type __Pattern = {
	lpat: string | RegExp
	rpat: string | RegExp
	kind: PatternKind
	type: "single" | "multiple"
	languages: Language[]
}

const htmlPatterns: __Pattern[] = [
	{
		lpat: /class\s*=\s*"/,
		rpat: '"',
		kind: PatternKind.Html,
		type: "single",
		languages: ["html"],
	},
]

function __findToken({
	text,
	index,
	lpat,
	rpat,
	type,
}: {
	text: string
	index?: number
	lpat: string | RegExp
	rpat: string | RegExp
	type: "single" | "multiple"
}): Token {
	let m: RegExpExecArray
	const lpt = typeof lpat === "string" ? lpat : lpat.toString().substring(1, lpat.toString().length - 1)
	const l = new RegExp(`(${lpt})((?:.(?!${lpt}))*)$`, type === "multiple" ? "gs" : "g") // find last left bracket pattern
	const r = new RegExp(rpat, type === "multiple" ? "gs" : "g")
	const leftPart = text.substring(0, index)
	const rightPart = text.substring(index)

	if ((m = l.exec(leftPart))) {
		const [, lbrace] = m
		const start = m.index + lbrace.length
		r.lastIndex = start
		if ((m = r.exec(leftPart))) {
			return null
		} else {
			r.lastIndex = 0
			if ((m = r.exec(rightPart))) {
				const end = index + m.index
				return [start, end, text.substring(start, end)]
			}
		}
	}
	return null
}

function __findAllToken({
	text,
	lpat,
	rpat,
}: {
	text: string
	lpat: string | RegExp
	rpat: string | RegExp
}): Array<[start: number, end: number]> {
	const result: Array<[start: number, end: number]> = []
	let m: RegExpExecArray
	const l = new RegExp(lpat, "g")
	const r = new RegExp(rpat, "g")
	while ((m = l.exec(text))) {
		r.lastIndex = l.lastIndex
		if ((m = r.exec(text))) {
			result.push([l.lastIndex, m.index])
		}
		l.lastIndex = r.lastIndex
	}
	return result
}

export function canMatch(document: TextDocument, position: lsp.Position, hover = false): TokenResult {
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
		const token = findToken(source, pos)
		if (!token) {
			return undefined
		}
		return token
	} else if (document.languageId === "html") {
		for (const pattern of htmlPatterns) {
			const { type, lpat, rpat, kind } = pattern
			let range: lsp.Range
			if (type === "single") {
				range = {
					start: { line: position.line, character: 0 },
					end: { line: position.line + 1, character: 0 },
				}
			} else if (type === "multiple") {
				range = {
					start: { line: position.line - 20, character: 0 },
					end: { line: position.line + 20, character: 0 },
				}
			}
			const text = document.getText(range)
			const start = document.offsetAt(range.start)
			const token = __findToken({
				text,
				lpat,
				rpat,
				index: pos - start,
				type,
			})
			if (!token) {
				continue
			}
			return {
				kind,
				token: [start + token[0], start + token[1], token[2]],
			}
		}
	}
	return undefined
}

export function findAllMatch(document: TextDocument): TokenResult[] {
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
		return findAllToken(source)
	} else if (document.languageId === "html") {
		const text = document.getText()
		for (const pattern of htmlPatterns) {
			const { lpat, rpat, kind } = pattern
			const tokens = __findAllToken({
				text,
				lpat,
				rpat,
			})
			return tokens.map(([a, b]) => ({
				kind,
				token: [a, b, document.getText({ start: document.positionAt(a), end: document.positionAt(b) })],
			}))
		}
	}
	return []
}
