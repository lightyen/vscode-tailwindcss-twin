export * from "./hover"
export * from "./parse_regexp"
export * from "./spread"
export * from "./suggest"
export * from "./token"
export * from "./twNodes"

export function removeCommentsInCss(text: string, start = 0, end = text.length) {
	let comment = 0
	let string = 0
	let url = 0
	let b = 0
	const results: Array<[number, number]> = []
	for (let i = start; i < end; i++) {
		const char = text.charCodeAt(i)
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
					results.push([b, i])
				} else if (char === 47 && text.charCodeAt(i + 1) === 42) {
					comment = 2
					results.push([b, i])
				}
			}
		} else if (comment === 1 && char === 10) {
			comment = 0
			b = i + 1
		} else if (comment === 2 && char === 42 && text.charCodeAt(i + 1) === 47) {
			comment = 0
			i += 1
			b = i + 1
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

	if (comment === 0 && b < end) {
		results.push([b, end])
	}

	return results.map(v => text.slice(...v)).join("")
}

export function formatCssValue(text: string) {
	const fields = text.replace(/[\s;]+/g, " ").split(",")
	return fields.map(v => v.trim()).join(", ")
}
