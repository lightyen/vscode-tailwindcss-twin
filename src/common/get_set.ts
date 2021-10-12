// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function dlv(cur: any, paths: string[]): any {
	if (cur == undefined) {
		return undefined
	}
	for (let i = 0; i < paths.length; ++i) {
		if (cur[paths[i]] == undefined) {
			return undefined
		} else {
			cur = cur[paths[i]]
		}
	}
	return cur
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function dset(cur: any, paths: Array<string | number>, value: unknown) {
	if (cur == undefined || paths.length === 0) {
		return
	}
	for (let i = 0; i < paths.length - 1; ++i) {
		const key = paths[i]
		if (cur[key] == undefined) {
			// if next key is digit number
			cur[key] = +paths[i + 1] > -1 ? new Array(0) : {}
		}
		cur = cur[key]
	}
	const last = paths[paths.length - 1]
	cur[last] = value
}
