import { ArbitraryClassname, NodeType, TokenString, Variant } from "./nodes"

export function toKebab(value: string) {
	return value.replace(/\B[A-Z][a-z]*/g, s => "-" + s.toLowerCase())
}

export function getVariant(v: Variant): TokenString {
	return {
		range: v.type === NodeType.SimpleVariant ? v.id.range : v.selector.range,
		value: v.type === NodeType.SimpleVariant ? v.id.value : v.selector.value,
	}
}

export function formatArbitraryClassname(node: ArbitraryClassname, defaultValue: string) {
	if (!node.closed) return defaultValue
	let value = `${node.prop.value}[${node.expr?.value.trim()}]`
	if (node.e) {
		if (node.e.type === NodeType.WithOpacity && node.e.closed) {
			value += `/[${node.e.opacity.value.trim()}]`
		} else if (node.e.type === NodeType.EndOpacity) {
			value += `/${node.e.value.trim()}`
		}
	}
	return value
}

/** NOTE: respect quoted string */
export function removeComment(text: string): string {
	let comment = 0
	let string = 0
	const arr: string[] = []
	const start = 0
	const end = text.length

	let base = start
	let i = start
	for (; i < end; i++) {
		const char = text.charCodeAt(i)
		let __comment = comment

		if (comment === 0) {
			if (string === 0) {
				if (char === 47 && text.charCodeAt(i + 1) === 47) {
					__comment = 1
				} else if (char === 47 && text.charCodeAt(i + 1) === 42) {
					__comment = 2
				}
			}
		} else if (comment === 1 && char === 10) {
			__comment = 0
		} else if (comment === 2 && char === 42 && text.charCodeAt(i + 1) === 47) {
			__comment = 0
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

		if (comment === 0 && __comment > 0) {
			if (base < i) {
				arr.push(text.slice(base, i))
				base = i
			}
			if (__comment === 2) i += 1
		} else if (comment > 0 && __comment === 0) {
			base = i
			if (comment === 2) {
				i += 1
				base += 2
			}
		}

		comment = __comment
	}

	if (comment === 0 && base < i) {
		arr.push(text.slice(base, i))
	}

	return arr.join("").trim()
}
