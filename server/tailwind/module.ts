import fs from "fs"
import path from "path"
import Module from "module"

interface PnpEntry {
	resolveRequest?(moduleId: string, base: string): string
	setup?(): void
}

export class TModule {
	static resolve({ base, moduleId, silent }: { base: string; moduleId: string; silent?: boolean }): string {
		if (!base) {
			return __non_webpack_require__.resolve(moduleId)
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
	static require<T = any>({
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
		const m = TModule.resolve({ base, moduleId, silent })
		if (!m) {
			return undefined
		}
		if (removeCache === true) {
			delete __non_webpack_require__.cache[m]
		}
		return __non_webpack_require__(m)
	}

	private userSpace: string
	private isPnp = false // user is using pnp.
	private pnp: PnpEntry

	constructor(userSpace: string) {
		this.userSpace = userSpace || ""
		if (this.userSpace !== "") {
			try {
				this.pnp = TModule.require({
					base: this.userSpace,
					moduleId: "./.pnp.js",
					silent: true,
					removeCache: true,
				})
				if (this.pnp) {
					this.pnp.setup?.()
					this.isPnp = true
				}
			} catch (err) {}
		}
	}

	private pnpResolve({ moduleId, base, silent }: { moduleId: string; base: string; silent?: boolean }): string {
		try {
			return this.pnp.resolveRequest?.(moduleId, base)
		} catch (err) {
			if (silent) {
				return undefined
			}
			throw err
		}
	}

	resolve({ base = "", moduleId, silent }: { base: string; moduleId: string; silent?: boolean }) {
		const { isPnp } = this
		if (isPnp) {
			return this.pnpResolve({ moduleId, base, silent })
		} else {
			return TModule.resolve({ moduleId, base, silent })
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	require<T = any>({
		base = "",
		moduleId,
		removeCache,
		silent,
	}: {
		base: string
		moduleId: string
		removeCache?: boolean
		silent?: boolean
	}): T {
		const m = this.resolve({ base, moduleId, silent })
		if (!m) {
			return undefined
		}
		if (removeCache === true) {
			delete __non_webpack_require__.cache[m]
		}
		return __non_webpack_require__(m)
	}
}
