const fs = require("fs")
const Module = require("module")
const path = require("path")

let pnp
if (!pnp) {
	pnp = tryPnP(process.cwd())
}

function isExist(filename) {
	try {
		fs.accessSync(filename)
		return true
	} catch {
		return false
	}
}

/**
 * @typedef { { setup?(): void, resolveRequest(moduleName: string, issuer: string): string } } PnpEntry
 */

/**
 * @param {string} ws workspace directory
 */
function tryPnP(ws) {
	let __pnp
	try {
		let pnpJs = path.resolve(ws, ".pnp")
		if (!path.isAbsolute(pnpJs) && !pnpJs.startsWith("." + path.sep) && !pnpJs.startsWith(".." + path.sep)) {
			pnpJs = "." + path.sep + pnpJs
		}

		if (isExist(pnpJs + ".js")) {
			pnpJs = ".js"
		} else if (isExist(pnpJs + ".cjs")) {
			pnpJs += ".cjs"
		}

		const moduleName = Module["_resolveFilename"](pnpJs, {
			paths: Module["_nodeModulePaths"](ws),
		})

		__pnp = requireModule(moduleName)
	} catch (err) {}

	if (__pnp && __pnp.setup) {
		__pnp.setup()
	}
	return __pnp
}

const ts = require("typescript")

/**
 *
 * @param {string} moduleName
 * @param { { paths?: string[] | string | undefined, pnp?: PnpEntry | undefined } | string | undefined } param1
 * @return { string }
 */
function resolveModuleName(moduleName, options = {}) {
	let pnp
	let paths
	let filename
	if (typeof options === "string") {
		paths = options
	} else {
		pnp = options.pnp
		paths = options.paths
		filename = options.filename || ""
	}

	if (pnp) {
		if (!path.isAbsolute(filename)) filename = path.resolve(filename)
		moduleName = pnp.resolveRequest(moduleName, filename)
	}
	if (paths) {
		if (typeof paths === "string") {
			paths = Module["_nodeModulePaths"](paths)
		}
	}
	if (!paths) {
		paths = Module["_nodeModulePaths"](process.cwd())
	}
	return Module["_resolveFilename"](moduleName, { paths })
}
exports.resolveModuleName = resolveModuleName

/**
 * @param { string } moduleName
 * @param { { filename?: string | undefined; cache?: boolean | undefined; paths?: string | undefined; pnp?: PnpEntry | string | undefined } | undefined } options
 */
function requireModule(moduleName, options = {}) {
	let pnp
	let paths
	let cache = true
	let filename
	if (typeof options === "string") {
		paths = options
	} else {
		pnp = options.pnp
		paths = options.paths
		cache = options.cache || false
		filename = options.filename || ""
	}

	if (pnp) {
		if (!path.isAbsolute(filename)) filename = path.resolve(filename)
		moduleName = pnp.resolveRequest(moduleName, filename)
	}
	if (typeof paths === "string") {
		paths = Module["_nodeModulePaths"](paths)
	}
	if (!paths) {
		paths = Module["_nodeModulePaths"](process.cwd())
	}

	if (!cache) {
		if (pnp) {
			delete Module["_cache"][moduleName]
		} else {
			moduleName = Module["_resolveFilename"](moduleName, {
				paths,
				filename,
			})
			delete Module["_cache"][moduleName]
		}
	}

	const __module = new Module(filename)
	__module.paths = paths
	if (process.env.NODE_ENV === "test") return require(moduleName)
	return __module.require(moduleName)
}
exports.requireModule = requireModule

function transpile(compilerOptions, moduleName) {
	const code = fs.readFileSync(moduleName, { encoding: "utf-8" }).toString()
	const { outputText: transpiledCode, diagnostics } = ts.transpileModule(code, {
		moduleName,
		compilerOptions,
	})
	if (diagnostics) {
		for (const diagnostic of diagnostics) {
			console.log(diagnostic.messageText)
		}
	}
	return transpiledCode
}

function tryAddExtensions(moduleName, extensions = [".ts", ".js", ".cjs", ".mjs"]) {
	for (const ext of extensions) {
		try {
			fs.accessSync(moduleName + ext)
			return moduleName + ext
		} catch {}
	}
	return undefined
}

function requireModuleFromCode(compilerOptions, code, filename, pnp, base = path.dirname(filename)) {
	const __module = new Module(filename)
	__module.paths = Module["_nodeModulePaths"](base)
	__module.require = function __require(moduleName) {
		const isAbs = path.isAbsolute(moduleName)
		if (isAbs || moduleName.startsWith("./") || moduleName.startsWith("../")) {
			if (!isAbs) moduleName = path.resolve(path.dirname(filename), moduleName)
			switch (path.extname(moduleName)) {
				case ".json":
					return requireModule(moduleName, {
						filename,
						cache: false,
						paths: __module.paths,
					})
				case ".ts":
				case ".js":
				case ".cjs":
				case ".mjs":
					return requireModuleFromCode(
						compilerOptions,
						transpile(compilerOptions, moduleName),
						moduleName,
						pnp,
					)
				default: {
					const resolvedFileName = tryAddExtensions(moduleName)
					if (!resolvedFileName) return requireModule(moduleName, { filename, cache: false })
					moduleName = resolvedFileName
					return requireModuleFromCode(
						compilerOptions,
						transpile(compilerOptions, moduleName),
						moduleName,
						pnp,
					)
				}
			}
		}
		return requireModule(moduleName, {
			filename,
			cache: false,
			paths: __module.paths,
			pnp,
		})
	}
	__module["_compile"](code, "")
	// interopRequireDefault
	if (__module.exports && __module.exports.__esModule) {
		return __module.exports
	}
	return { default: __module.exports }
}

function insertHeader(header, code) {
	if (code.startsWith("#!")) {
		const i = code.indexOf("\n")
		if (i > 0) code = code.slice(i)
	}
	return header + code
}

/**
 * @param { string } moduleName module ID
 * @param { string | { base?: string | undefined; cache?: boolean | undefined; header?: string | undefined } | undefined } options
 * default cache = false
 */
function importFrom(moduleName, options = {}) {
	let base = ""
	let header = ""
	let cache = false
	if (typeof options === "string") {
		base = options
	} else if (options && typeof options === "object") {
		header = options.header || ""
		base = options.base || ""
		cache = options.cache || false
	}
	const compilerOptions = {
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ES2019,
		lib: ["es2019", "es2020.promise", "es2020.bigint", "es2020.string"],
		strict: true,
		esModuleInterop: true,
		skipLibCheck: true,
		removeComments: true,
		allowSyntheticDefaultImports: true,
	}
	const interopExport = obj => (obj && obj.default ? obj.default : obj)

	const isAbs = path.isAbsolute(moduleName)
	if (isAbs || moduleName.startsWith("./") || moduleName.startsWith("../")) {
		switch (path.extname(moduleName)) {
			case ".json":
				return requireModule(moduleName, {
					cache,
					paths: path.dirname(moduleName),
				})
			case ".ts":
			case ".js":
			case ".cjs":
			case ".mjs": {
				const pnp = tryPnP(path.dirname(moduleName))
				if (pnp) compilerOptions.strict = false
				return interopExport(
					requireModuleFromCode(
						compilerOptions,
						insertHeader(header, transpile(compilerOptions, moduleName)),
						moduleName,
						pnp,
					),
				)
			}
			default: {
				const pnp = tryPnP(path.dirname(moduleName))
				if (pnp) compilerOptions.strict = false
				const resolvedFileName = tryAddExtensions(moduleName)
				if (resolvedFileName) moduleName = resolvedFileName
				return interopExport(
					requireModuleFromCode(
						compilerOptions,
						insertHeader(header, transpile(compilerOptions, moduleName)),
						moduleName,
						pnp,
					),
				)
			}
		}
	}
	if (base) {
		const pnp = tryPnP(base)
		return requireModule(moduleName, { cache, paths: base, pnp })
	}
	return requireModule(moduleName, { cache })
}
exports.importFrom = importFrom
