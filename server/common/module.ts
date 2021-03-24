import path from "path"

interface PnpEntry {
	resolveRequest?(moduleId: string, base?: string): string
	setup?(): void
}

export function resolveModule(fsPath: string): string | undefined {
	let pnp: PnpEntry | undefined
	const base = path.dirname(fsPath)
	try {
		const fsPath = path.join(base, ".pnp.js")
		pnp = __non_webpack_require__(fsPath)
	} catch {}

	if (pnp) {
		pnp.setup?.()
	}

	try {
		return pnp ? pnp.resolveRequest?.(fsPath) : __non_webpack_require__.resolve(fsPath)
	} catch {
		return undefined
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function requireModule<T = any>(fsPath: string, removeCache = true): T | never {
	if (removeCache) {
		for (const key in __non_webpack_require__.cache) {
			delete __non_webpack_require__.cache[key]
		}
	}

	let pnp: PnpEntry | undefined
	const base = path.dirname(fsPath)
	try {
		const fsPath = path.join(base, ".pnp.js")
		pnp = __non_webpack_require__(fsPath)
	} catch {}

	if (pnp) {
		pnp.setup?.()
	}

	return __non_webpack_require__(fsPath)
}
