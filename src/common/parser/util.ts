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
