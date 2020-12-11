import fs from "fs"
import path from "path"
import Module from "module"

export const __dynamic_require__ =
	process.env.NODE_ENV === "production" ? __non_webpack_require__ : __non_webpack_require__

export function resolveModule({ base, moduleId }: { base: string; moduleId: string }): string {
	if (!base) {
		return __dynamic_require__.resolve(moduleId)
	}
	try {
		base = fs.realpathSync(base)
	} catch (error) {
		if (error.code === "ENOENT") {
			base = path.resolve(base)
		} else {
			throw error
		}
	}

	const resolve = () =>
		Module["_resolveFilename"](moduleId, {
			id: null,
			filename: null,
			paths: Module["_nodeModulePaths"](base),
		})

	return resolve()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function requireModule<T = any>({
	base,
	moduleId,
	removeCache,
}: {
	base?: string
	moduleId: string
	removeCache?: boolean
}): T {
	const m = resolveModule({ base, moduleId })
	if (removeCache === true) {
		delete __dynamic_require__.cache[m]
	}
	return __dynamic_require__(m)
}

export class Hook<Exports = unknown> {
	private _origRequire: NodeJS.Require
	private _require: NodeJS.Require
	private _unhooked = false

	unhook() {
		this._unhooked = true
		if (this._require === Module.prototype.require) {
			Module.prototype.require = this._origRequire
		}
	}

	constructor(request: string, onRequire: (exports: Exports) => Exports) {
		const cache: Record<string, Exports> = {}
		const patching: Record<string, boolean> = {}

		this._origRequire = Module.prototype.require
		this._require = Module.prototype.require = ((moduleId: string) => {
			if (this._unhooked) {
				// if the patched require function could not be removed because
				// someone else patched it after it was patched here, we just
				// abort and pass the request onwards to the original require
				return this._origRequire(moduleId)
			}

			const filename: string = Module["_resolveFilename"](moduleId)
			// return known patched modules immediately
			if (Object.prototype.hasOwnProperty.call(cache, filename)) {
				return cache[filename]
			}

			// Check if this module has a patcher in-progress already.
			// Otherwise, mark this module as patching in-progress.
			const patched = patching[filename]
			if (!patched) {
				patching[filename] = true
			}

			const exports = this._origRequire(moduleId)
			if (filename !== request) {
				return exports
			}

			// If it's already patched, just return it as-is.
			if (patched) return exports

			// The module has already been loaded,
			// so the patching mark can be cleaned up.
			delete patching[filename]

			// only call onRequire the first time a module is loaded
			if (!Object.prototype.hasOwnProperty.call(cache, filename)) {
				// ensure that the cache entry is assigned a value before calling
				// onRequire, in case calling onRequire requires the same module.
				cache[filename] = exports
				cache[filename] = onRequire(exports)
			}
			return cache[filename]
		}) as NodeJS.Require
	}
}
