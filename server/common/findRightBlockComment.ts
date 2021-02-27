export default function findRightBlockComment(classes: string, start = 0, end = classes.length): number | undefined {
	for (let index = start + 2; index < end; index++) {
		if (classes.slice(index, index + 2) === "*/") {
			return index + 1
		}
	}
	return undefined
}
