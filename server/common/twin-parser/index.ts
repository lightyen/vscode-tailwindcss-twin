export * from "./parse_regexp"
export * from "./token"
export * from "./twNodes"
export * from "./hover"
export * from "./suggest"
export * from "./spread"

export function removeComments(text: string) {
	return text.replace(/(\/\/[^\n]*\n?)|(\/\*[\S\s]*?\*\/)/gs, "")
}

export function formatCssValue(text: string) {
	const fields = text.replace(/[\s;]+/g, " ").split(",")
	return fields.map(v => v.trim()).join(", ")
}
