import fs from "fs"
import path from "path"
import Module from "module"

interface PnpEntry {
	resolveRequest?(moduleId: string, base: string): string
	setup?(): void
}

type ResolveParams = {
	moduleId: string
	base?: string
	silent?: boolean
}

type RequireParams = ResolveParams & {
	removeCache?: boolean
}

export class TModule {
	static resolve({ moduleId, base = "", silent = true }: ResolveParams): string {
		try {
			if (!base) {
				return __non_webpack_require__.resolve(moduleId)
			}
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
	static require<T = any>({ moduleId, base = "", silent = true, removeCache = true }: RequireParams): T {
		const m = TModule.resolve({ base, moduleId, silent })
		if (!m) {
			return undefined
		}
		if (removeCache === true) {
			delete __non_webpack_require__.cache[m]
		}
		return __non_webpack_require__(m)
	}

	private _base: string
	private _isPnp: boolean
	private pnp: PnpEntry

	get base() {
		return this._base
	}

	get isPnp() {
		return this._isPnp
	}

	constructor(userSpace = "") {
		this._isPnp = false
		this._base = userSpace
		if (this._base !== "") {
			try {
				this.pnp = TModule.require({
					base: this._base,
					moduleId: "./.pnp.js",
					silent: true,
					removeCache: true,
				})
				if (this.pnp) {
					this.pnp.setup?.()
					this._isPnp = true
				}
			} catch (err) {}
		}
	}

	private pnpResolve({ moduleId, base = this._base, silent = true }: ResolveParams): string {
		try {
			return this.pnp.resolveRequest?.(moduleId, base)
		} catch (err) {
			if (silent) {
				return undefined
			}
			throw err
		}
	}

	resolve({ moduleId, base = this._base, silent = true }: ResolveParams) {
		return this._isPnp ? this.pnpResolve({ moduleId, base, silent }) : TModule.resolve({ moduleId, base, silent })
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	require<T = any>({ moduleId, base = this._base, silent = true, removeCache = true }: RequireParams): T {
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
