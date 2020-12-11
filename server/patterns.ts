import { TextDocument } from "vscode-languageserver-textdocument"
import { settings } from "~/server"

import { Token } from "./typings"

// https://code.visualstudio.com/docs/languages/identifiers#_known-language-identifiers
export type Language = "html" | "javascript" | "javascriptreact" | "plaintext" | "typescript" | "typescriptreact"

export type PatternKind = "twin" | "html" | "jsx"

export type PatternInitParams = {
	lpat: string | RegExp
	rpat: string | RegExp
	type: "single" | "multiple"
	languages: Language[]
	handleBrackets: boolean
	handleImportant: boolean
	id: string
}

export class Pattern {
	lpat: string | RegExp
	rpat: string | RegExp
	type: "single" | "multiple"
	languages: Language[]
	handleBrackets: boolean
	handleImportant: boolean
	id: string
	kind: PatternKind

	constructor(args: PatternInitParams) {
		this.lpat = args.lpat
		this.rpat = args.rpat
		this.type = args.type
		this.languages = args.languages
		this.handleBrackets = args.handleBrackets
		this.handleImportant = args.handleImportant
		this.id = args.id
		const parts = args.id.split(".")
		if (parts.length === 0) throw Error(`Invalid Pattern ID: ${args.id}`)
		this.kind = parts[0] as PatternKind
	}
}

const twinPatterns: Pattern[] = [
	new Pattern({
		lpat: /tw\s*=\s*"/,
		rpat: '"',
		type: "single",
		languages: ["javascriptreact", "typescriptreact"],
		handleBrackets: true,
		handleImportant: true,
		id: "twin.01",
	}),
	new Pattern({
		lpat: /tw\s*=\s*'/,
		rpat: "'",
		type: "single",
		languages: ["javascriptreact", "typescriptreact"],
		handleBrackets: true,
		handleImportant: true,
		id: "twin.02",
	}),
	new Pattern({
		lpat: /tw(?:\.[^`\s]+|\([^`\s]+\))?`/,
		rpat: "`",
		type: "multiple",
		languages: ["javascriptreact", "typescriptreact", "javascript", "typescript"],
		handleBrackets: true,
		handleImportant: true,
		id: "twin.03",
	}),
]

const htmlPatterns: Pattern[] = [
	new Pattern({
		lpat: /class\s*=\s*"/,
		rpat: '"',
		type: "single",
		languages: ["html"],
		handleBrackets: false,
		handleImportant: true,
		id: "html",
	}),
]

const jsxPatterns: Pattern[] = [
	new Pattern({
		lpat: /className\s*=\s*"/,
		rpat: '"',
		type: "single",
		languages: ["javascriptreact", "typescriptreact"],
		handleBrackets: false,
		handleImportant: false,
		id: "jsx.01",
	}),
	new Pattern({
		lpat: /className\s*=\s*'/,
		rpat: "'",
		type: "single",
		languages: ["javascriptreact", "typescriptreact"],
		handleBrackets: false,
		handleImportant: false,
		id: "jsx.02",
	}),
	new Pattern({
		lpat: /className\s*=\s*{\s*"/,
		rpat: /"\s*}/,
		type: "single",
		languages: ["javascriptreact", "typescriptreact"],
		handleBrackets: false,
		handleImportant: false,
		id: "jsx.03",
	}),
	new Pattern({
		lpat: /className\s*=\s*{\s*'/,
		rpat: /'\s*}/,
		type: "single",
		languages: ["javascriptreact", "typescriptreact"],
		handleBrackets: false,
		handleImportant: false,
		id: "jsx.04",
	}),
	new Pattern({
		lpat: /className\s*=\s*{\s*`/,
		rpat: /`\s*}/,
		type: "multiple",
		languages: ["javascriptreact", "typescriptreact"],
		handleBrackets: false,
		handleImportant: false,
		id: "jsx.05",
	}),
	new Pattern({
		lpat: /className\s*:\s*"/,
		rpat: '"',
		type: "single",
		languages: ["javascriptreact", "typescriptreact"],
		handleBrackets: false,
		handleImportant: false,
		id: "jsx.06",
	}),
	new Pattern({
		lpat: /className\s*:\s*'/,
		rpat: "'",
		type: "single",
		languages: ["javascriptreact", "typescriptreact"],
		handleBrackets: false,
		handleImportant: false,
		id: "jsx.07",
	}),
	new Pattern({
		lpat: /className\s*:\s*`/,
		rpat: "`",
		type: "multiple",
		languages: ["javascriptreact", "typescriptreact"],
		handleBrackets: false,
		handleImportant: false,
		id: "jsx.08",
	}),
]

export function getPatterns({ document: { languageId } }: { document: TextDocument }): Pattern[] {
	const patterns: Pattern[] = []
	switch (languageId) {
		case "html":
			patterns.push(...htmlPatterns)
			break
		case "typescriptreact":
			patterns.push(...jsxPatterns)
			settings.twin && patterns.push(...twinPatterns)
			break
		case "javascriptreact":
			patterns.push(...jsxPatterns)
			settings.twin && patterns.push(...twinPatterns)
			break
		case "typescript":
			settings.twin && patterns.push(...twinPatterns)
			break
		case "javascript":
			settings.twin && patterns.push(...twinPatterns)
			break
	}
	return patterns
}

export function canMatch({
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

export function findMatch({
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
