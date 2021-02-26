// unused module

function findRightBracket(classes: string, start = 0, end = classes.length, brackets = ["(", ")"]) {
	const stack = []
	let comment = 0
	for (let index = start; index < end; index++) {
		if (comment === 0) {
			if (classes[index] === brackets[0]) {
				stack.push(index)
			} else if (classes.slice(index, index + 2) === "//") {
				comment = 1
			} else if (classes.slice(index, index + 2) === "/*") {
				comment = 2
			} else if (classes[index] === brackets[1]) {
				if (stack.length === 0) {
					return undefined
				}

				if (stack.length === 1) {
					return index
				}

				stack.pop()
			}
		} else {
			if (comment === 1 && classes[index] === "\n") {
				comment = 0
			} else if (comment === 2 && classes.slice(index, index + 2) === "*/") {
				comment = 0
				index += 1
			}
		}
	}
	return undefined
}

function removeComments(text: string) {
	return text.replace(/(\/\/[^\n]*\n?)|(\/\*.*?\*\/)/gs, "")
}

function spreadVariantGroups(classes: string, context = "", importantContext = false, start = 0, end?: number) {
	if (classes === "") {
		return []
	}
	const results: string[] = []
	classes = classes.slice(start, end).trim()

	const reg = /(\/\/[^\n]*\n?)|(\/\*.*?\*\/)|([\w-]+:)|(\w+)\[|([\w-./]+!?)|\(|(\S+)/gs
	let match: RegExpExecArray
	const baseContext = context
	while ((match = reg.exec(classes))) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const [, lineComment, blockComment, variant, cssProperty, className, notHandled] = match
		if (variant) {
			context += variant

			if (/\s/.test(classes[reg.lastIndex])) {
				context = baseContext
				continue
			}

			if (classes[reg.lastIndex] === "(") {
				const closeBracket = findRightBracket(classes, reg.lastIndex)
				if (typeof closeBracket !== "number") {
					throw `"${classes}" except to find a ')' to match the '(' at ${reg.lastIndex}`
				}

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
		} else if (cssProperty) {
			const closeBracket = findRightBracket(classes, reg.lastIndex - 1, classes.length, ["[", "]"])
			if (typeof closeBracket !== "number") {
				throw `"${classes}" except to find a ']' to match the '[' at ${reg.lastIndex - 1}`
			}
			const importantGroup = classes[closeBracket + 1] === "!"
			const css = removeComments(classes.slice(match.index, closeBracket + 1))
			results.push(context + css + (importantGroup || importantContext ? "!" : ""))
			reg.lastIndex = closeBracket + (importantGroup ? 2 : 1)
			context = baseContext
		} else if (className) {
			const tail = !className.endsWith("!") && importantContext ? "!" : ""
			results.push(context + className + tail)
			context = baseContext
		} else if (notHandled) {
			throw `${notHandled} unexpected token at ${reg.lastIndex}`
		} else if (lineComment) {
			//
		} else if (blockComment) {
			//
		} else {
			const closeBracket = findRightBracket(classes, match.index)
			if (typeof closeBracket !== "number") {
				throw `"${classes}" except to find a ')' to match the '(' at ${match.index}`
			}

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
	}

	return results
}

export { spreadVariantGroups }
