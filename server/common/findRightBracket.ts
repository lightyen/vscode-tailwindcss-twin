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
}): number | undefined {
	let stack = 0
	for (let i = start; i < end; i++) {
		if (input[i] === brackets[0]) {
			stack += 1
		} else if (input[i] === brackets[1]) {
			if (stack === 0) {
				return undefined
			}
			if (stack === 1) {
				return i
			}
			stack -= 1
		}
	}
	return undefined
}
