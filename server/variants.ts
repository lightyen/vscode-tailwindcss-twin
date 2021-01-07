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

function spreadVariantGroups(classes: string, context = "", start = 0, end?: number) {
	classes = classes.slice(start, end).trim()
	const results: string[] = []
	if (classes == "") {
		return results
	}
	if (classes[0] == "(") {
		const closeBracket = findRightBracket(classes)
		if (typeof closeBracket != "number") {
			throw `${classes} except to find a ')' to match the '('`
		} else {
			results.push(...spreadVariantGroups(classes, context, 1, closeBracket))
			if (closeBracket < classes.length) {
				results.push(...spreadVariantGroups(classes, context, closeBracket + 1))
			}
			return results
		}
	}
	// variant: /[\w-]+:/
	const reg = /([\w-]+:)|\S+/g
	let match: RegExpExecArray
	const baseContext = context
	while ((match = reg.exec(classes))) {
		const [, variant] = match
		if (variant) {
			context += variant

			// skip space
			while (/\s/.test(classes[reg.lastIndex])) {
				reg.lastIndex++
			}
			if (classes[reg.lastIndex] == "(") {
				const closeBracket = findRightBracket(classes, reg.lastIndex)
				if (typeof closeBracket == "number") {
					results.push(...spreadVariantGroups(classes, context, reg.lastIndex + 1, closeBracket))
					reg.lastIndex = closeBracket + 1
					context = baseContext
				} else {
					throw `except to find a ')' to match the '('`
				}
			}
		} else {
			results.push(context + match[0])
			context = baseContext
		}
	}

	if (results.length == 0) {
		throw `except non-empty variant group`
	}
	return results
}

const handleVariantGroups = (classes: string) => spreadVariantGroups(classes).join(" ")

export { handleVariantGroups }
