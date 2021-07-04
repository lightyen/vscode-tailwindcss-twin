export * from "./hover"
export * from "./parse_regexp"
export * from "./spread"
export * from "./suggest"
export * from "./token"
export * from "./twNodes"

export function removeCommentsInCss(text: string, start = 0, end = text.length) {
	let comment = 0
	let string = 0
	let b = 0
	const results: Array<[number, number]> = []
	for (let i = start; i < end; i++) {
		if (comment === 0) {
			if (string === 0) {
				if (text.slice(i, i + 2) === "//") {
					comment = 1
					results.push([b, i])
				} else if (text.slice(i, i + 2) === "/*") {
					comment = 2
					results.push([b, i])
				}
			}
		} else if (comment === 1 && text[i] === "\n") {
			comment = 0
			b = i + 1
		} else if (comment === 2 && text.slice(i, i + 2) === "*/") {
			comment = 0
			i += 1
			b = i + 1
		}

		if (string === 0) {
			if (comment === 0) {
				if (text[i] === '"') {
					string = 1
				} else if (text[i] === "'") {
					string = 2
				}
			}
		} else if (string === 1 && text[i] === '"') {
			string = 0
		} else if (string === 2 && text[i] === "'") {
			string = 0
		}
	}

	if (comment === 0 && b < end) {
		results.push([b, end])
	}

	return results.map(v => text.slice(...v)).join("")
}

export function formatCssValue(text: string) {
	const fields = text.replace(/[\s;]+/g, " ").split(",")
	return fields.map(v => v.trim()).join(", ")
}
