import { dlv } from "../get_set"
import * as nodes from "./nodes"
import { findRightBracket } from "./parse_regexp"

export enum TwThemeElementKind {
	Unknown,
	Identifier,
	BracketIdentifier,
	Dot,
	Bracket,
}

interface TwThemeUnknownElement {
	kind: TwThemeElementKind.Unknown
	token: nodes.TokenString
}

interface TwThemeIdentifierElement {
	kind: TwThemeElementKind.Identifier
	token: nodes.TokenString
}

interface TwThemeBracketIdentifierElement {
	kind: TwThemeElementKind.BracketIdentifier
	token: nodes.TokenString
}

interface TwThemeDotElement {
	kind: TwThemeElementKind.Dot
	token: nodes.TokenString
}

interface TwThemeBracketElement {
	kind: TwThemeElementKind.Bracket
	token: nodes.TokenString
}

export interface Error {
	message: string
	start: number
	end: number
}

type Block =
	| TwThemeUnknownElement
	| TwThemeIdentifierElement
	| TwThemeBracketIdentifierElement
	| TwThemeDotElement
	| TwThemeBracketElement

interface Result {
	blocks: Block[]
	errors: Error[]
	keys(): string[]
	hit(index: number): Block | undefined
}

export function parseThemeValue(input: string): Result {
	let init = false

	const blocks: Block[] = []
	const errors: Error[] = []

	const reg = /(\.[\w-/]*)|(\[[\w-./]*)|([\w-/]+)/g
	const start = 0
	const end = input.length
	reg.lastIndex = start
	input = input.slice(0, end)
	let match: RegExpExecArray | null
	let x = 0

	while ((match = reg.exec(input))) {
		const [value, dotId, bracId, Id] = match
		if (match.index !== x) {
			errors.push({
				message: "Syntax Error (invalid space)",
				start: x,
				end: match.index,
			})
		} else {
			x = x + value.length
		}

		if (!init) {
			if (!Id) {
				errors.push({
					message: "Syntax Error (not an identifier)",
					start: match.index,
					end: match.index + 1,
				})
				break
			}
			blocks.push({
				kind: TwThemeElementKind.Identifier,
				token: { range: [match.index, reg.lastIndex], value: Id },
			})
			init = true
			continue
		} else if (Id) {
			errors.push({
				message: "Syntax Error (access expression)",
				start: match.index,
				end: match.index + 1,
			})
			break
		}

		if (dotId) {
			blocks.push({
				kind: TwThemeElementKind.Dot,
				token: { range: [match.index, match.index + 1], value: input.slice(match.index, match.index + 1) },
			})

			let hasId = false
			if (match.index + 1 < reg.lastIndex) {
				blocks.push({
					kind: TwThemeElementKind.Identifier,
					token: {
						range: [match.index + 1, reg.lastIndex],
						value: input.slice(match.index + 1, reg.lastIndex),
					},
				})
				hasId = true
			}

			if (hasId) {
				const char = input.charCodeAt(reg.lastIndex)
				if (char && char !== 46 && char !== 91) {
					errors.push({
						message: "Syntax Error (access expression)",
						start: reg.lastIndex,
						end: reg.lastIndex + 1,
					})
					break
				}
			} else {
				errors.push({
					message: "Syntax Error (access expression)",
					start: reg.lastIndex,
					end: reg.lastIndex + 1,
				})
				break
			}
		} else if (bracId) {
			blocks.push({
				kind: TwThemeElementKind.Bracket,
				token: { range: [match.index, match.index + 1], value: input.slice(match.index, match.index + 1) },
			})

			const closedBracket = findRightBracket({ text: input, start: match.index, end, brackets: [91, 93] })
			if (typeof closedBracket !== "number") {
				errors.push({
					message: "except to find a ']' to match the '['",
					start: match.index,
					end,
				})
				break
			}

			if (match.index + 1 < closedBracket) {
				blocks.push({
					kind: TwThemeElementKind.Identifier,
					token: {
						range: [match.index + 1, closedBracket],
						value: input.slice(match.index + 1, closedBracket),
					},
				})
			} else {
				errors.push({
					message: "Syntax Error (empty)",
					start: match.index,
					end: closedBracket + 1,
				})
			}

			blocks.push({
				kind: TwThemeElementKind.Bracket,
				token: {
					range: [closedBracket, closedBracket + 1],
					value: input.slice(closedBracket, closedBracket + 1),
				},
			})

			reg.lastIndex = closedBracket + 1
			x = reg.lastIndex
		}
	}

	return {
		blocks,
		errors,
		keys() {
			return this.blocks
				.filter(
					block =>
						block.kind === TwThemeElementKind.Identifier ||
						block.kind === TwThemeElementKind.BracketIdentifier,
				)
				.map(v => v.token.value)
		},
		hit(index: number) {
			for (const block of this.blocks) {
				if (
					block.kind !== TwThemeElementKind.Identifier &&
					block.kind !== TwThemeElementKind.BracketIdentifier
				) {
					continue
				}
				if (index >= block.token.range[0] && index <= block.token.range[1]) {
					return block
				}
			}
			return undefined
		},
	}
}

export function findThemeValueKeys(
	input: string,
	position: number,
): {
	keys: string[]
	hit: nodes.TokenString | undefined
} {
	const keys: string[] = []
	let hit: nodes.TokenString | undefined

	let init = false
	const reg = /(\.[\w-/]*)|(\[[\w-./]*)|([\w-/]+)/g
	const start = 0
	const end = input.length
	reg.lastIndex = start
	input = input.slice(0, end)
	let match: RegExpExecArray | null

	while ((match = reg.exec(input))) {
		const [, dotId, bracId, Id] = match
		if (!init) {
			if (!Id) {
				break
			}
			if (position >= match.index && position <= reg.lastIndex) {
				hit = { range: [match.index, reg.lastIndex], value: Id }
				break
			}
			if (position > reg.lastIndex) {
				keys.push(Id)
			}
			init = true
			continue
		} else if (Id) {
			if (position >= match.index && position <= reg.lastIndex) {
				hit = { range: [match.index, reg.lastIndex], value: Id }
			}
			break
		}

		if (dotId) {
			let hasId = false
			if (position >= match.index && position <= reg.lastIndex) {
				hit = { range: [match.index, reg.lastIndex], value: input.slice(match.index, reg.lastIndex) }
				break
			}
			if (match.index + 1 < reg.lastIndex) {
				if (position > reg.lastIndex) {
					keys.push(input.slice(match.index + 1, reg.lastIndex))
				}
				hasId = true
			}

			if (hasId) {
				const char = input.charCodeAt(reg.lastIndex)
				if (char && char !== 46 && char !== 91) {
					break
				}
			} else {
				break
			}
		} else if (bracId) {
			const closedBracket = findRightBracket({ text: input, start: match.index, end, brackets: [91, 93] })
			if (typeof closedBracket !== "number") {
				if (position === match.index + 1) {
					hit = { range: [match.index, match.index + 1], value: input.slice(match.index, match.index + 1) }
				}
				break
			}

			if (position >= match.index && position <= closedBracket) {
				hit = { range: [match.index, closedBracket + 1], value: input.slice(match.index, closedBracket + 1) }
				break
			}

			if (match.index + 1 < closedBracket) {
				if (position > closedBracket) {
					keys.push(input.slice(match.index + 1, closedBracket))
				}
			} else {
				// empty
				break
			}

			reg.lastIndex = closedBracket + 1
		}
	}

	return { keys, hit }
}

export function resolveTheme(config: Tailwind.ResolvedConfigJS, value: string, resolve = false): string {
	const regex = /\btheme\(/gs
	const match = regex.exec(value)
	if (match == null) {
		if (resolve) return theme(config, value)
		return value
	}
	let end = value.length
	const rb = findRightBracket({
		text: value,
		start: regex.lastIndex - 1,
		end: value.length,
	})
	let b = end
	if (rb != undefined) {
		end = rb + 1
		b = rb
	}
	return (
		value.slice(0, match.index) +
		resolveTheme(config, value.slice(regex.lastIndex, b), rb != undefined) +
		value.slice(end)
	)
}

export function theme(config: Tailwind.ResolvedConfigJS, value: string, useDefault = false): string {
	try {
		const [path, alpha] = splitAlpha(value)
		return applyOpacity(resolveConfig(config, path, useDefault), alpha)
	} catch (err) {
		return ""
	}
}

function resolveConfig(config: Tailwind.ResolvedConfigJS, path: string, useDefault = false) {
	const result = parseThemeValue(path)
	if (result.errors.length > 0) {
		throw Error("invalid path")
	}

	return getTheme(result.keys())

	function getTheme(keys: string[]) {
		let value = dlv(config.theme, keys)
		if (useDefault && value?.["DEFAULT"] != undefined) {
			value = value["DEFAULT"]
		}
		return value
	}
}

export function splitAlpha(value: string): [path: string, alpha?: string] {
	value = value.trim()
	const index = value.lastIndexOf("/")
	if (index === -1) return [value]
	const num = value.slice(index + 1).trim()
	if (!num || Number.isNaN(Number(num.replace(/%$/, "0")))) {
		throw Error("invalid alpha")
	}
	return [value.slice(0, index).trim(), num]
}

function applyOpacity(value: unknown, opacityValue = "1") {
	if (value == null) return ""
	if (typeof value === "object") {
		if (Array.isArray(value)) return `Array(${value.join(", ")})`
		return (
			`Object{\n` +
			Object.keys(value)
				.map(k => `\t"${k}": _,\n`)
				.join("") +
			"}\n"
		)
	}
	if (typeof value === "function") {
		value = String(value({ opacityValue }))
	}
	if (typeof value === "string") {
		let replaced = false
		const result = value.replace("<alpha-value>", match => {
			replaced = true
			return opacityValue
		})
		if (replaced) return result
		else {
			const match =
				/(\w+)\(\s*([\d.]+(?:%|deg|rad|grad|turn)?\s*,?\s*)([\d.]+(?:%|deg|rad|grad|turn)?\s*,?\s*)([\d.]+(?:%|deg|rad|grad|turn)?)/.exec(
					value,
				)
			if (match == null) {
				const rgb = parseHexColor(value)
				if (rgb == null) return value
				const r = (rgb >> 16) & 0xff
				const g = (rgb >> 8) & 0xff
				const b = rgb & 0xff
				return `rgb(${r} ${g} ${b} / ${opacityValue})`
			}
			const [, fn, a, b, c] = match
			return `${fn}(${a.replaceAll(" ", "")} ${b.replaceAll(" ", "")} ${c.replaceAll(" ", "")}${
				(a.indexOf(",") === -1 ? " / " : ", ") + opacityValue
			})`
		}
	}
	return String(value)
}

function parseHexColor(value: string): number | null {
	const result = /(?:^#?([A-Fa-f0-9]{6})(?:[A-Fa-f0-9]{2})?$)|(?:^#?([A-Fa-f0-9]{3})[A-Fa-f0-9]?$)/.exec(value)
	if (result !== null) {
		if (result[1]) {
			const v = parseInt(result[1], 16)
			return Number.isNaN(v) ? null : v
		} else if (result[2]) {
			const v = parseInt(result[2], 16)
			if (!Number.isNaN(v)) {
				let r = v & 0xf00
				let g = v & 0xf0
				let b = v & 0xf
				r = (r << 12) | (r << 8)
				g = (g << 8) | (g << 4)
				b = (b << 4) | b
				return r | g | b
			}
		}
	}
	return null
}
