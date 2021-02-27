/** Try to find right bracket from left bracket, return `undefind` if not found. */
export default function findRightBracket({
	input,
	start = 0,
	end = input.length,
	brackets = ["(", ")"],
}: {
	input: string
	start?: number
	end?: number
	/** brackets, default is `["(", ")"]` */
	brackets?: [string, string]
}) {
	const stack = []
	let comment = 0
	for (let index = start; index < end; index++) {
		if (comment === 0) {
			if (input[index] === brackets[0]) {
				stack.push(index)
			} else if (input.slice(index, index + 2) === "//") {
				comment = 1
			} else if (input.slice(index, index + 2) === "/*") {
				comment = 2
			} else if (input[index] === brackets[1]) {
				if (stack.length === 0) {
					return undefined
				}

				if (stack.length === 1) {
					return index
				}

				stack.pop()
			}
		} else {
			if (comment === 1 && input[index] === "\n") {
				comment = 0
			} else if (comment === 2 && input.slice(index, index + 2) === "*/") {
				comment = 0
				index += 1
			}
		}
	}
	return undefined
}
