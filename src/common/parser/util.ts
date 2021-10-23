import { NodeType, TokenString, Variant } from "./nodes"

export function toKebab(value: string) {
	return value.replace(/\B[A-Z][a-z]*/g, s => "-" + s.toLowerCase())
}

export function getVariant(v: Variant): TokenString {
	return {
		range: v.type === NodeType.SimpleVariant ? v.id.range : v.selector.range,
		value: v.type === NodeType.SimpleVariant ? v.id.value : v.selector.value,
	}
}
