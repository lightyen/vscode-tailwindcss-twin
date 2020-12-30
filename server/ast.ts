import ts from "typescript"
import { Token } from "./typings"

export enum PatternKind {
	Twin = 1,
	TwinTheme = 2,
	ClassName = 3,
	Html = 4,
}
export function transfromToken(
	result: { kind: PatternKind; token: ts.Node },
	source: ts.SourceFile,
): { kind: PatternKind; token: Token } {
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

export function getScriptKind(languageId: string) {
	switch (languageId) {
		case "typescript":
			return ts.ScriptKind.TS
		case "javascript":
			return ts.ScriptKind.JS
		case "typescriptreact":
			return ts.ScriptKind.TSX
		case "javascriptreact":
			return ts.ScriptKind.JSX
		default:
			return undefined
	}
}

function find(
	source: ts.SourceFile,
	node: ts.Node,
	cb: (node: ts.Node) => boolean,
	position: number | undefined = undefined,
) {
	if (typeof position == "number") {
		if (position < node.getStart(source) || position >= node.getEnd()) {
			return undefined
		}
	}
	if (cb(node)) {
		return node
	}
	return ts.forEachChild(node, child => find(source, child, cb, position))
}

export function findNode(
	source: ts.SourceFile,
	node: ts.Node,
	position: number,
	twin = false,
): { token: ts.Node; kind: PatternKind } {
	if (position < node.getStart(source) || position >= node.getEnd()) {
		return undefined
	}
	if (ts.isJsxAttribute(node)) {
		const token = find(source, node, node => ts.isStringLiteral(node), position)
		if (!token) {
			return undefined
		}
		if (position < token.getStart(source) + 1 || position >= token.getEnd()) {
			return undefined
		}
		const id = node.getFirstToken(source).getText(source)
		if (twin && id === "tw") {
			return { token, kind: PatternKind.Twin }
		} else if (id === "className") {
			return { token, kind: PatternKind.ClassName }
		}
		return undefined
	} else if (ts.isTaggedTemplateExpression(node)) {
		// QUESTION: match TemplateExpression?
		const token = find(source, node, node => ts.isNoSubstitutionTemplateLiteral(node), position)
		if (!token) {
			return undefined
		}
		if (position < token.getStart(source) + 1 || position >= token.getEnd()) {
			return undefined
		}
		const id = node.getFirstToken(source).getText(source)
		if (twin && id === "tw") {
			return { token, kind: PatternKind.Twin }
		} else if (twin && id === "theme") {
			return { token, kind: PatternKind.TwinTheme }
		}
		return undefined
	}
	return ts.forEachChild(node, child => findNode(source, child, position, twin))
}

export function findAllNode(
	source: ts.SourceFile,
	node: ts.Node,
	twin = false,
): Array<{ token: ts.Node; kind: PatternKind }> {
	if (ts.isJsxAttribute(node)) {
		const token = find(source, node, node => ts.isStringLiteral(node))
		if (!token) {
			return undefined
		}
		const id = node.getFirstToken(source).getText(source)
		if (twin && id === "tw") {
			return [{ token, kind: PatternKind.Twin }]
		} else if (id === "className") {
			return [{ token, kind: PatternKind.ClassName }]
		}
		return undefined
	} else if (ts.isTaggedTemplateExpression(node)) {
		// QUESTION: match TemplateExpression?
		const token = find(source, node, node => ts.isNoSubstitutionTemplateLiteral(node))
		if (!token) {
			return undefined
		}
		const id = node.getFirstToken(source).getText(source)
		if (twin && id === "tw") {
			return [{ token, kind: PatternKind.Twin }]
		} else if (twin && id === "theme") {
			return [{ token, kind: PatternKind.TwinTheme }]
		}
		return undefined
	}
	return node
		.getChildren(source)
		.map(c => findAllNode(source, c, twin))
		.filter(Boolean)
		.flat()
}

export function findToken(source: ts.SourceFile, position: number, twin = false) {
	const n = findNode(source, source, position, twin)
	if (n) {
		return transfromToken(n, source)
	}
	return undefined
}

export function findAllToken(source: ts.SourceFile, twin = false): Array<{ token: Token; kind: PatternKind }> {
	const nodes = findAllNode(source, source, twin)
	return nodes.map(n => transfromToken(n, source))
}
