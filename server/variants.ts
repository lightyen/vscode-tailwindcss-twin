// This is unused module

function findRightBracket(classes: string, start = 0) {
	const stack = []
	for (let index = start; index < classes.length; index++) {
		if (classes[index] === "(") {
			stack.push(index)
		} else if (classes[index] === ")") {
			if (stack.length === 0) {
				return undefined
			}

			if (stack.length === 1) {
				return index
			}

			stack.pop()
		}
	}
	return undefined
}

function spreadVariantGroups(classes: string, context = "", importantContext = false, start = 0, end?: number) {
	classes = classes.slice(start, end).trim()
	const results: string[] = []
	if (classes === "") {
		return results
	}
	if (classes[0] === "(") {
		const closeBracket = findRightBracket(classes)
		if (typeof closeBracket !== "number") {
			throw `"${classes}" except to find a ')' to match the '('`
		} else {
			const isImportant = classes[closeBracket + 1] === "!"
			results.push(...spreadVariantGroups(classes, context, importantContext || isImportant, 1, closeBracket))
			const end = isImportant ? closeBracket + 1 : closeBracket
			if (end < classes.length) {
				results.push(...spreadVariantGroups(classes, context, importantContext, end + 1))
			}
			return results
		}
	}
	// variant format: /[\w-]+:/
	const reg = /([\w-]+:)|\S+/g
	let match: RegExpExecArray
	const baseContext = context
	while ((match = reg.exec(classes))) {
		const [text, variant] = match
		if (variant) {
			context += variant

			if (/\s/.test(classes[reg.lastIndex])) {
				throw "empty variant value"
			}

			if (classes[reg.lastIndex] === "(") {
				const closeBracket = findRightBracket(classes, reg.lastIndex)
				if (typeof closeBracket !== "number") {
					throw `"${classes}" except to find a ')' to match the '('`
				} else {
					const importantGroup = classes[closeBracket + 1] === "!"
					results.push(
						...spreadVariantGroups(
							classes,
							context,
							importantContext || importantGroup,
							reg.lastIndex + 1,
							closeBracket,
						),
					)
					reg.lastIndex = closeBracket + (importantGroup ? 2 : 1)
					context = baseContext
				}
			}
		} else if (text.startsWith("(")) {
			const closeBracket = findRightBracket(classes, match.index)
			if (typeof closeBracket !== "number") {
				throw `"${classes}" except to find a ')' to match the '('`
			} else {
				const importantGroup = classes[closeBracket + 1] === "!"
				results.push(
					...spreadVariantGroups(
						classes,
						context,
						importantContext || importantGroup,
						match.index + 1,
						closeBracket,
					),
				)
				reg.lastIndex = closeBracket + (importantGroup ? 2 : 1)
			}
		} else {
			const tail = !match[0].endsWith("!") && importantContext ? "!" : ""
			results.push(context + match[0] + tail)
			context = baseContext
		}
	}

	if (results.length === 0) {
		throw `except non-empty variant group`
	}
	return results
}

const handleVariantGroups = (classes: string) => spreadVariantGroups(classes).join(" ")

export { handleVariantGroups, spreadVariantGroups }
