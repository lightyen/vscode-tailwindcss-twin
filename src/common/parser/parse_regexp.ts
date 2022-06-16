import * as nodes from "./nodes"

// "-" 45
// "[" 91
// "]" 93
// " " 32
// "/" 47
// "*" 42
// "(" 40
// ")" 41
// "!" 33
// '"' 34
// "'" 39

/** Try to find right bracket from left bracket, return `undefind` if not found. */
export function findRightBracket({
	text,
	start = 0,
	end = text.length,
	brackets = [40, 41],
}: {
	text: string
	start?: number
	end?: number
	brackets?: [number, number]
}): number | undefined {
	let stack = 0
	const [lbrac, rbrac] = brackets
	let comment = 0
	let string = 0
	let url = 0

	for (let i = start; i < end; i++) {
		const char = text.charCodeAt(i)
		if (char === lbrac) {
			if (string === 0 && comment === 0) {
				stack++
			}
		} else if (char === rbrac) {
			if (string === 0 && comment === 0) {
				if (stack === 1) {
					return i
				}
				if (stack < 1) {
					return undefined
				}
				stack--
			}
		}

		if (string === 0 && comment === 0) {
			if (url === 0 && char === 117 && /\W/.test(text[i - 1] || " ")) {
				url = 1
			} else if (url === 1 && char === 114) {
				url = 2
			} else if (url === 2 && char === 108) {
				url = 3
			} else if (url < 3 || (url === 3 && char === 41)) {
				url = 0
			}
		}

		if (url < 3 && comment === 0) {
			if (string === 0) {
				if (char === 47 && text.charCodeAt(i + 1) === 47) {
					comment = 1
				} else if (char === 47 && text.charCodeAt(i + 1) === 42) {
					comment = 2
				}
			}
		} else if (comment === 1 && char === 10) {
			comment = 0
		} else if (comment === 2 && char === 42 && text.charCodeAt(i + 1) === 47) {
			comment = 0
			i += 1
		}

		if (string === 0) {
			if (comment === 0) {
				if (char === 34) {
					string = 1
				} else if (char === 39) {
					string = 2
				}
			}
		} else if (string === 1 && char === 34) {
			string = 0
		} else if (string === 2 && char === 39) {
			string = 0
		}
	}
	return undefined
}

function findRightBlockComment(text: string, start = 0, end = text.length): number | undefined {
	for (let i = start + 2; i < end; i++) {
		if (text.charCodeAt(i) === 42 && text.charCodeAt(i + 1) === 47) {
			return i + 1
		}
	}
	return undefined
}

function isSpace(char: number) {
	if (Number.isNaN(char)) return true
	switch (char) {
		case 32:
		case 12:
		case 10:
		case 13:
		case 9:
		case 11:
			return true
		default:
			return false
	}
}

export function parse(text: string, { breac = Infinity }: { breac?: number } = {}): nodes.Program {
	return {
		type: nodes.NodeType.Program,
		range: [0, text.length],
		expressions: parseExpressions({ text, breac }),
	}
}

export function parseExpressions({
	text,
	start = 0,
	end = text.length,
	breac = Infinity,
}: {
	text: string
	start?: number
	end?: number
	breac?: number
}) {
	const expressions: nodes.TwExpression[] = []
	while (start < end) {
		const { expr, lastIndex } = parseExpression({ text, breac, start, end })
		if (expr) {
			if (expr instanceof Array) expressions.push(...expr)
			else expressions.push(expr)
		}
		if (lastIndex > breac) break
		start = lastIndex
		if (!start) break
	}
	return expressions
}

function escapeRegexp(value: string) {
	return value.replace(/[/\\^$+?.()|[\]{}]/g, "\\$&")
}

function compileRegexp(sep: string) {
	return new RegExp(
		`(\\/\\/[^\\n]*\\n?)|(\\/\\*)|([\\w-]+${sep})|(!?\\[)|!?((?!\\/)(?:(?!\\/\\/{1,2})[\\w-/])+)\\[|(!?(?:(?!\\/\\/|\\/\\*)[\\w-./])+)!?|(!?\\()|(\\S+)`,
		"gs",
	)
}

let separator = escapeRegexp(":")
let regexp = compileRegexp(separator)

export function setSeparator(sep: string) {
	separator = escapeRegexp(sep)
	regexp = compileRegexp(separator)
}

function parseExpression({
	text,
	start = 0,
	end = text.length,
}: {
	text: string
	start?: number
	end?: number
	breac?: number
}): { expr?: nodes.TwExpression; lastIndex: number } {
	let match: RegExpExecArray | null
	regexp.lastIndex = start
	text = text.slice(0, end)

	if ((match = regexp.exec(text))) {
		const [
			,
			lineComment,
			blockComment,
			simpleVariant,
			leftSquareBracket,
			prefixLeftSquareBracket,
			classnames,
			group,
			others,
		] = match
		start = match.index

		if (simpleVariant) {
			start += simpleVariant.length
			const variant: nodes.SimpleVariant = {
				type: nodes.NodeType.SimpleVariant,
				range: [match.index, start],
				id: {
					type: nodes.NodeType.Identifier,
					range: [match.index, start - separator.length],
					value: text.slice(match.index, start - separator.length),
				},
			}

			if (isSpace(text.charCodeAt(start)) || isComment(start)) {
				const span: nodes.VariantSpan = {
					type: nodes.NodeType.VariantSpan,
					variant: variant,
					range: [match.index, regexp.lastIndex],
				}
				return { expr: span, lastIndex: regexp.lastIndex }
			}

			const { expr, lastIndex } = parseExpression({ text, start })
			const span: nodes.VariantSpan = {
				type: nodes.NodeType.VariantSpan,
				variant: variant,
				range: [match.index, lastIndex],
				child: expr,
			}

			return { expr: span, lastIndex }
		}

		if (leftSquareBracket) {
			// ArbitraryProperty, ArbitrarySelector
			let exclamationLeft = false
			if (text.charCodeAt(start) === 33) {
				exclamationLeft = true
			}
			const ar_rb = findRightBracket({
				text,
				start: exclamationLeft ? start + 1 : start,
				end,
				brackets: [91, 93],
			})
			if (ar_rb == undefined) {
				const expr: nodes.ArbitraryProperty = {
					type: nodes.NodeType.ArbitraryProperty,
					range: [match.index, end],
					value: text.slice(match.index, end),
					decl: {
						type: nodes.NodeType.CssDeclaration,
						range: [match.index + 1, end],
						value: text.slice(match.index + 1, end),
					},
					closed: false,
					important: exclamationLeft,
				}

				return { expr, lastIndex: end }
			}

			// Does it end with separator?
			for (let i = 0; i < separator.length; i++) {
				if (text.charCodeAt(ar_rb + 1 + i) !== separator.charCodeAt(i)) {
					let lastIndex = ar_rb + 1
					let exclamationRight = false
					if (text.charCodeAt(ar_rb + 1) === 33) {
						exclamationRight = true
						lastIndex += 1
					}
					if (exclamationLeft) start++
					const expr: nodes.ArbitraryProperty = {
						type: nodes.NodeType.ArbitraryProperty,
						important: exclamationLeft || exclamationRight,
						range: [start, ar_rb + 1],
						value: text.slice(start, ar_rb + 1),
						decl: {
							type: nodes.NodeType.CssDeclaration,
							range: [start + 1, ar_rb],
							value: text.slice(start + 1, ar_rb),
						},
						closed: true,
					}
					return { expr, lastIndex }
				}
			}

			if (exclamationLeft) {
				const classname: nodes.Classname = {
					type: nodes.NodeType.ClassName,
					important: false,
					range: [start, start + 1],
					value: text.slice(start, start + 1),
				}
				return { expr: classname, lastIndex: start + 1 }
			}

			start = ar_rb + 1 + separator.length
			regexp.lastIndex = start

			const variant: nodes.ArbitrarySelector = {
				type: nodes.NodeType.ArbitrarySelector,
				range: [match.index, regexp.lastIndex],
				selector: {
					type: nodes.NodeType.CssSelector,
					range: [match.index + 1, ar_rb],
					value: text.slice(match.index + 1, ar_rb),
				},
			}

			if (isSpace(text.charCodeAt(start)) || isComment(start)) {
				const span: nodes.VariantSpan = {
					type: nodes.NodeType.VariantSpan,
					variant,
					range: [match.index, regexp.lastIndex],
				}
				return { expr: span, lastIndex: regexp.lastIndex }
			}

			const { expr, lastIndex } = parseExpression({ text, start })
			const span: nodes.VariantSpan = {
				type: nodes.NodeType.VariantSpan,
				variant,
				range: [match.index, lastIndex],
				child: expr,
			}
			return { expr: span, lastIndex }
		}

		if (prefixLeftSquareBracket) {
			// ArbitraryClassname, ArbitraryVariant, ShortCss

			// text-[___], text-[___]/opacity, text-[___]/[opacity]
			const hyphen = text.charCodeAt(regexp.lastIndex - 2) === 45
			// text-color/[opacity]
			const slash = text.charCodeAt(regexp.lastIndex - 2) === 47

			// NOTE: text-color/opacity is a normal classname.

			let exclamationLeft = false
			if (text.charCodeAt(start) === 33) {
				exclamationLeft = true
			}

			const prefix_start = exclamationLeft ? start + 1 : start
			const prefix: nodes.Identifier = {
				type: nodes.NodeType.Identifier,
				range: [prefix_start, prefix_start + prefixLeftSquareBracket.length],
				value: text.slice(prefix_start, prefix_start + prefixLeftSquareBracket.length),
			}

			const ar_rb = findRightBracket({ text, start: regexp.lastIndex - 1, end, brackets: [91, 93] })
			if (ar_rb == undefined) {
				if (exclamationLeft) start++
				const expr: nodes.CssExpression = {
					type: nodes.NodeType.CssExpression,
					range: [regexp.lastIndex, end],
					value: text.slice(regexp.lastIndex, end),
				}
				if (hyphen) {
					// text-[
					const node: nodes.ArbitraryClassname = {
						type: nodes.NodeType.ArbitraryClassname,
						prefix,
						expr,
						important: exclamationLeft,
						range: [start, regexp.lastIndex],
						closed: false,
					}
					return { expr: node, lastIndex: regexp.lastIndex }
				}

				if (slash) {
					// text-color/[
					prefix.value = prefix.value.slice(0, -1)
					prefix.range[1] = prefix.range[1] - 1
					const node: nodes.ArbitraryClassname = {
						type: nodes.NodeType.ArbitraryClassname,
						prefix,
						expr: undefined,
						important: exclamationLeft,
						range: [start, regexp.lastIndex],
						closed: false,
					}
					return { expr: node, lastIndex: regexp.lastIndex }
				}

				// color[
				const shortcss: nodes.ShortCss = {
					type: nodes.NodeType.ShortCss,
					prefix,
					expr,
					important: exclamationLeft,
					range: [start, regexp.lastIndex],
					closed: false,
				}
				return { expr: shortcss, lastIndex: regexp.lastIndex }
			}

			// Does it end with separator?
			let hasSeparator = true
			for (let i = 0; i < separator.length; i++) {
				if (text.charCodeAt(ar_rb + 1 + i) !== separator.charCodeAt(i)) {
					hasSeparator = false
					break
				}
			}

			if (hasSeparator) {
				if (exclamationLeft) {
					const classname: nodes.Classname = {
						type: nodes.NodeType.ClassName,
						important: false,
						range: [start, start + 1],
						value: text.slice(start, start + 1),
					}
					return { expr: classname, lastIndex: start + 1 }
				}

				// any-[]:
				const prefix: nodes.Identifier = {
					type: nodes.NodeType.Identifier,
					range: [start, regexp.lastIndex - 1],
					value: text.slice(start, regexp.lastIndex - 1),
				}

				start = ar_rb + 1 + separator.length
				const variant: nodes.ArbitraryVariant = {
					type: nodes.NodeType.ArbitraryVariant,
					range: [match.index, start],
					prefix,
					selector: {
						type: nodes.NodeType.CssSelector,
						range: [regexp.lastIndex, ar_rb],
						value: text.slice(regexp.lastIndex, ar_rb),
					},
				}
				regexp.lastIndex = start

				if (isSpace(text.charCodeAt(start)) || isComment(start)) {
					const span: nodes.VariantSpan = {
						type: nodes.NodeType.VariantSpan,
						variant,
						range: [match.index, regexp.lastIndex],
					}
					return { expr: span, lastIndex: regexp.lastIndex }
				}

				const { expr, lastIndex } = parseExpression({ text, start })
				const span: nodes.VariantSpan = {
					type: nodes.NodeType.VariantSpan,
					variant,
					range: [match.index, lastIndex],
					child: expr,
				}
				return { expr: span, lastIndex }
			}

			if (exclamationLeft) start++
			const expr: nodes.CssExpression = {
				type: nodes.NodeType.CssExpression,
				range: [regexp.lastIndex, ar_rb],
				value: text.slice(regexp.lastIndex, ar_rb),
			}
			regexp.lastIndex = ar_rb + 1

			// shortcss
			if (!slash && !hyphen) {
				const exclamationRight = text.charCodeAt(regexp.lastIndex) === 33
				if (exclamationRight) regexp.lastIndex += 1
				const shortcss: nodes.ShortCss = {
					type: nodes.NodeType.ShortCss,
					prefix,
					expr,
					important: exclamationLeft || exclamationRight,
					range: [start, exclamationRight ? regexp.lastIndex - 1 : regexp.lastIndex],
					closed: true,
				}
				return { expr: shortcss, lastIndex: regexp.lastIndex }
			}

			let e: nodes.WithOpacity | nodes.EndOpacity | undefined
			let exclamationRight = false

			// text-[]/xxx
			if (hyphen) {
				if (text.charCodeAt(regexp.lastIndex) === 47) {
					regexp.lastIndex += 1
					if (text.charCodeAt(regexp.lastIndex) === 91) {
						const rb = findRightBracket({
							text,
							start: regexp.lastIndex,
							end,
							brackets: [91, 93],
						})
						if (rb != undefined) {
							e = {
								type: nodes.NodeType.WithOpacity,
								range: [regexp.lastIndex, rb + 1],
								opacity: {
									type: nodes.NodeType.Identifier,
									range: [regexp.lastIndex + 1, rb],
									value: text.slice(regexp.lastIndex + 1, rb),
								},
								closed: true,
							}
							regexp.lastIndex = rb + 1

							if (text.charCodeAt(regexp.lastIndex) === 33) {
								exclamationRight = true
								regexp.lastIndex += 1
							}
						} else {
							e = {
								type: nodes.NodeType.WithOpacity,
								range: [regexp.lastIndex, end],
								opacity: {
									type: nodes.NodeType.Identifier,
									range: [regexp.lastIndex + 1, end],
									value: text.slice(regexp.lastIndex + 1, end),
								},
								closed: false,
							}
							regexp.lastIndex = end
						}
					} else {
						let k = regexp.lastIndex
						for (; k < end; k++) {
							if (isSpace(text.charCodeAt(k))) {
								break
							}
						}

						let b = k
						if (text.charCodeAt(k - 1) === 33) {
							exclamationRight = true
							b--
						}
						e = {
							type: nodes.NodeType.EndOpacity,
							range: [regexp.lastIndex, b],
							value: text.slice(regexp.lastIndex, b),
						}
						regexp.lastIndex = k
					}
				} else if (text.charCodeAt(regexp.lastIndex) === 33) {
					exclamationRight = true
					regexp.lastIndex += 1
				}
			} else if (slash) {
				e = {
					type: nodes.NodeType.WithOpacity,
					range: [regexp.lastIndex, ar_rb + 1],
					opacity: {
						...expr,
						type: nodes.NodeType.Identifier,
					},
					closed: true,
				}

				if (text.charCodeAt(regexp.lastIndex) === 33) {
					exclamationRight = true
					regexp.lastIndex += 1
				}
			}

			const node: nodes.ArbitraryClassname = {
				type: nodes.NodeType.ArbitraryClassname,
				important: exclamationLeft || exclamationRight,
				prefix,
				expr: slash ? undefined : expr,
				e,
				closed: true,
				range: [start, exclamationRight ? regexp.lastIndex - 1 : regexp.lastIndex],
			}

			if (slash) {
				prefix.value = prefix.value.slice(0, -1)
				prefix.range[1] = prefix.range[1] - 1
			}
			return { expr: node, lastIndex: regexp.lastIndex }
		}

		let exclamationLeft = false
		if (text.charCodeAt(start) === 33) {
			exclamationLeft = true
			start += 1
		}

		if (classnames) {
			let exclamationRight = false
			let _end = regexp.lastIndex
			if (text.charCodeAt(regexp.lastIndex - 1) === 33) {
				exclamationRight = true
				_end -= 1
			}

			const classname: nodes.Classname = {
				type: nodes.NodeType.ClassName,
				range: [start, _end],
				value: text.slice(start, _end),
				important: exclamationLeft || exclamationRight,
			}

			return { expr: classname, lastIndex: regexp.lastIndex }
		}

		if (lineComment) {
			return { lastIndex: regexp.lastIndex }
		}

		if (blockComment) {
			const closeComment = findRightBlockComment(text, match.index)
			if (closeComment != undefined) {
				regexp.lastIndex = closeComment + 1
			} else {
				regexp.lastIndex = end
			}
			return { lastIndex: regexp.lastIndex }
		}

		if (group) {
			let exclamationRight = false
			const rb = findRightBracket({ text, start, end })
			if (rb != undefined) {
				regexp.lastIndex = rb + 1
				if (text.charCodeAt(rb + 1) === 33) {
					exclamationRight = true
					regexp.lastIndex += 1
				}
			} else {
				regexp.lastIndex = end
			}

			const _end = rb != undefined ? rb : end

			const lastIndex = regexp.lastIndex
			const expressions = parseExpressions({ text, start: start + 1, end: _end })

			const group: nodes.Group = {
				type: nodes.NodeType.Group,
				closed: rb != undefined,
				important: exclamationLeft || exclamationRight,
				range: [match.index, lastIndex],
				expressions,
			}

			return { expr: group, lastIndex }
		}

		if (others) {
			const classname: nodes.Classname = {
				type: nodes.NodeType.ClassName,
				important: false,
				range: [match.index, regexp.lastIndex],
				value: text.slice(match.index, regexp.lastIndex),
			}
			return { expr: classname, lastIndex: regexp.lastIndex }
		}
	}

	return { lastIndex: regexp.lastIndex }

	function isComment(i: number) {
		if (text.charCodeAt(i) === 47) {
			return text.charCodeAt(i) === 47 || text.charCodeAt(i) === 42
		}
		return false
	}
}
