import fs from "fs"
import path from "path"
import Module from "module"

export const __dynamic_require__ =
	process.env.NODE_ENV === "production" ? __non_webpack_require__ : __non_webpack_require__

export function resolveModule({
	base,
	moduleId,
	silent,
}: {
	base: string
	moduleId: string
	silent?: boolean
}): string {
	if (!base) {
		return __dynamic_require__.resolve(moduleId)
	}
	try {
		base = fs.realpathSync(base)
	} catch (error) {
		if (error.code === "ENOENT") {
			base = path.resolve(base)
		} else {
			if (silent) {
				return undefined
			}
			throw error
		}
	}

	const resolve = () =>
		Module["_resolveFilename"](moduleId, {
			id: null,
			filename: null,
			paths: Module["_nodeModulePaths"](base),
		})

	try {
		return resolve()
	} catch (err) {
		if (silent) {
			return undefined
		}
		throw err
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function requireModule<T = any>({
	base,
	moduleId,
	removeCache,
	silent,
}: {
	base?: string
	moduleId: string
	removeCache?: boolean
	silent?: boolean
}): T {
	const m = resolveModule({ base, moduleId, silent })
	if (!m) {
		return undefined
	}
	if (removeCache === true) {
		delete __dynamic_require__.cache[m]
	}
	return __dynamic_require__(m)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function requirePnpModule<T = any>({
	base,
	moduleId,
	removeCache,
	silent,
	pnp,
}: {
	base: string
	moduleId: string
	removeCache?: boolean
	silent?: boolean
	pnp: {
		resolveRequest(id: string, from: string): string
		setup(): void
	}
}): T {
	if (!base || !moduleId) {
		return undefined
	}
	try {
		const m = __dynamic_require__(pnp.resolveRequest(moduleId, base))
		if (!m) {
			return undefined
		}
		if (removeCache === true) {
			delete __dynamic_require__.cache[m]
		}
		return __dynamic_require__(m)
	} catch (err) {
		if (silent) {
			return undefined
		}
		throw err
	}
}
