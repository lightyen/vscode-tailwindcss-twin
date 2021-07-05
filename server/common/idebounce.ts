const m: Record<string, NodeJS.Timeout | null> = {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function idebounce<T>(key: string, callback: (...args: any[]) => T, ...args: any[]) {
	const timeout = 16
	const h = m[key]
	if (h) {
		clearTimeout(h)
	}
	return new Promise<T>(resolve => {
		m[key] = setTimeout(() => {
			resolve(callback(...args))
			m[key] = null
		}, timeout)
	})
}
