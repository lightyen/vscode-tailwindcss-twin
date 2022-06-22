import * as nodes from "./nodes"
import { findRightBracket, isSpace } from "./util"

const regexThemeFn = /\btheme\(/gs

export function parse_theme({ text, start = 0, end = text.length }: { text: string; start?: number; end?: number }) {
	let ret: nodes.ThemeFunctionNode[] = []
	while (start < end) {
		const { expr, lastIndex } = parse_theme_fn({ text, start, end })
		if (expr) ret = ret.concat(expr)
		start = lastIndex
		if (!start) break
	}
	return ret
}

function parse_theme_fn({ text, start = 0, end = text.length }: { text: string; start?: number; end?: number }): {
	expr?: nodes.ThemeFunctionNode
	lastIndex: number
} {
	regexThemeFn.lastIndex = start
	const match = regexThemeFn.exec(text)
	if (match == null) return { lastIndex: end }

	const rb = findRightBracket({
		text,
		start: regexThemeFn.lastIndex - 1,
		end,
	})
	if (rb == undefined) {
		const node: nodes.ThemeFunctionNode = {
			type: nodes.NodeType.ThemeFunction,
			closed: false,
			range: [match.index, end],
			innerRange: [regexThemeFn.lastIndex, end],
			value: parse_theme_val({ text, start: regexThemeFn.lastIndex, end }),
		}
		return { expr: node, lastIndex: end }
	}

	start = regexThemeFn.lastIndex
	end = rb
	const value = parse_theme_val({ text, start, end })
	const node: nodes.ThemeFunctionNode = {
		type: nodes.NodeType.ThemeFunction,
		closed: true,
		range: [match.index, end + 1],
		innerRange: [start, end],
		value,
	}
	return { expr: node, lastIndex: rb + 1 }
}

const regexThemePath = /(\[)|(\.\w*)|(\w+)|\/\s*((?:\+|-)?[\d.]+%?)|(\S+)/gs

export function parse_theme_val({
	text,
	start = 0,
	end = text.length,
}: {
	text: string
	start?: number
	end?: number
}) {
	while (start < end && isSpace(text.charCodeAt(start))) start++
	while (start < end && isSpace(text.charCodeAt(end - 1))) end--

	// unquote
	if (text.charCodeAt(start) === 34 || text.charCodeAt(start) === 39) {
		if (text.charCodeAt(end - 1) === text.charCodeAt(start)) {
			end--
		}
		start++
	} else if (text.charCodeAt(end - 1) === 34 || text.charCodeAt(end - 1) === 39) {
		end--
	}

	const node: nodes.ThemeValueNode = {
		type: nodes.NodeType.ThemeValue,
		range: [start, end],
		path: [],
	}

	while (start < end) {
		regexThemePath.lastIndex = start
		const match = regexThemePath.exec(text)
		if (match == null) break
		const [, leftSquareBracket, dotKey, firstKey, suffix] = match
		if (leftSquareBracket) {
			const rb = findRightBracket({
				text,
				start,
				end,
				brackets: [91, 93],
			})
			if (rb == undefined) {
				node.path = node.path.concat({
					type: nodes.NodeType.ThemePath,
					range: [match.index, end],
					value: text.slice(match.index + 1, end),
					closed: false,
				})
				start = end
				continue
			}
			node.path = node.path.concat({
				type: nodes.NodeType.ThemePath,
				range: [match.index, rb + 1],
				value: text.slice(match.index + 1, rb),
				closed: true,
			})
			start = rb + 1
			continue
		}

		if (dotKey) {
			node.path = node.path.concat({
				type: nodes.NodeType.ThemePath,
				range: [match.index, regexThemePath.lastIndex],
				value: text.slice(match.index + 1, regexThemePath.lastIndex),
				closed: true,
			})
			start = regexThemePath.lastIndex
			continue
		}

		if (suffix) {
			node.suffix = {
				range: [match.index, regexThemePath.lastIndex],
				value: suffix,
			}
			start = regexThemePath.lastIndex
			continue
		}

		if (firstKey) {
			node.path = node.path.concat({
				type: nodes.NodeType.ThemePath,
				range: [match.index, regexThemePath.lastIndex],
				value: text.slice(match.index, regexThemePath.lastIndex),
				closed: true,
			})
			start = regexThemePath.lastIndex
			continue
		}

		node.others = {
			range: [match.index, regexThemePath.lastIndex],
			value: text.slice(match.index, regexThemePath.lastIndex),
		}
		break
	}

	return node
}
