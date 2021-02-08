import * as tw from "./types"

type Result = [keys: string[], error?: tw.Error]

export default function parseObjectKeys(str: string, start = 0, end = str.length): Result {
	const keys: string[] = []
	let flag = false
	let b = start
	let err: tw.Error
	let i = start

	for (; i < end; i++) {
		if (str[i] === ".") {
			if (b < i) {
				keys.push(str.slice(b, i))
				b = i + 1
			} else {
				err = { message: "error", start: i, end: i + 1 }
				break
			}
		} else if (str[i] === "[") {
			if (i === end - 1) {
				err = { message: "error", start: i, end: i + 1 }
				break
			}
			flag = true
			b = i + 1
		} else if (str[i] === "]") {
			if (!flag) {
				err = { message: "error", start: i, end: i + 1 }
				break
			}
			if (b < i) {
				keys.push(str.slice(b, i))
				b = i + 1
			} else {
				err = { message: "error", start: i, end: i + 1 }
				break
			}
		}
	}

	if (b < i) {
		keys.push(str.slice(b, i))
	}
	return [keys, err]
}
