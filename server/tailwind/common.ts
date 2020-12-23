export function dlv(cur: unknown, paths: string[]) {
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

export function dset(cur: unknown, paths: Array<string | number>, value: unknown) {
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

export function intersection<T = unknown>(arr1: T[], arr2: T[]) {
	return arr1.filter(value => arr2.indexOf(value) !== -1)
}
