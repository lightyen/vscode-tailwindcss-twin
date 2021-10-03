import fs from "fs"
import Module from "module"
import path from "path"
import ts from "typescript"

interface PnpEntry {
	setup?(): void
	resolveRequest(moduleId: string, issuer?: string): string
}

function tryPnP(ws: string) {
	let pnp: PnpEntry | undefined
	try {
		let pnpJs = path.join(ws, ".pnp.js")
		if (!path.isAbsolute(pnpJs) && !pnpJs.startsWith("./") && !pnpJs.startsWith("../")) {
			pnpJs = "./" + pnpJs
		}
		const filename = Module["_resolveFilename"](pnpJs, { paths: Module["_nodeModulePaths"](ws) })
		const module = new Module("")
		pnp = module.require(filename)
	} catch {}

	pnp?.setup?.()

	return pnp
}

let pnp: PnpEntry | undefined
if (!pnp) {
	pnp = tryPnP(process.cwd())
}

interface resolveModuleNameOptions {
	paths?: string[] | string | undefined
	pnp?: PnpEntry | undefined
}

export function resolveModuleName(
	moduleName: string,
	options: string | resolveModuleNameOptions = {},
): string | undefined {
	let pnp: PnpEntry | undefined
	let paths: string | string[] | undefined
	if (typeof options === "string") {
		paths = options
	} else {
		pnp = options.pnp
		paths = options.paths
	}

	if (pnp) {
		return pnp.resolveRequest(moduleName, "empty")
	}
	if (paths) {
		if (typeof paths === "string") {
			paths = Module["_nodeModulePaths"](paths)
		}
	}
	if (!paths) {
		paths = Module["_nodeModulePaths"](process.cwd()) as string[]
	}
	return Module["_resolveFilename"](moduleName, { paths })
}

interface requireModuleOptions {
	paths?: string[] | string | undefined
	pnp?: PnpEntry | undefined
	cache?: boolean | undefined
	filename?: string | undefined
}

export function requireModule(moduleName: string, options: string | requireModuleOptions = {}) {
	let pnp: PnpEntry | undefined
	let paths: string | string[] | undefined
	let cache = true
	let filename = ""
	if (typeof options === "string") {
		paths = options
	} else {
		pnp = options.pnp
		paths = options.paths
		cache = options.cache || false
		filename = options.filename || ""
	}

	if (pnp) {
		moduleName = pnp.resolveRequest(moduleName, filename || "empty")
	}
	if (typeof paths === "string") {
		paths = Module["_nodeModulePaths"](paths) as string[]
	}
	if (!paths) {
		paths = Module["_nodeModulePaths"](process.cwd()) as string[]
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
	return __module.require(moduleName)
}

export function transpile(compilerOptions: ts.CompilerOptions, moduleName: string): string {
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

function tryAddExtensions(moduleName: string, extensions = [".ts", ".js", ".cjs", ".mjs"]) {
	for (const ext of extensions) {
		try {
			fs.accessSync(moduleName + ext)
			return moduleName + ext
		} catch {}
	}
	return undefined
}

function requireModuleFromCode(
	compilerOptions: ts.CompilerOptions,
	code: string,
	filename: string,
	pnp?: PnpEntry | undefined,
	base = path.dirname(filename),
) {
	const __module = new Module(filename)
	__module.paths = Module["_nodeModulePaths"](base)
	__module.require = function __require(moduleName) {
		const isAbs = path.isAbsolute(moduleName)
		if (isAbs || moduleName.startsWith("./") || moduleName.startsWith("../")) {
			if (!isAbs) moduleName = path.resolve(path.dirname(filename), moduleName)
			switch (path.extname(moduleName)) {
				case ".json":
					return requireModule(moduleName, { filename, cache: false, paths: __module.paths })
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

		return requireModule(moduleName, { filename, cache: false, paths: __module.paths, pnp })
	} as NodeJS.Require
	__module["_compile"](code, "")
	// interopRequireDefault
	return __module.exports?.__esModule ? __module.exports : { default: __module.exports }
}

function insertHeader(header: string, code: string) {
	// NOTE: remove #!/usr/bin/env node
	if (code.startsWith("#!")) {
		const i = code.indexOf("\n")
		if (i > 0) code = code.slice(i)
	}
	return header + code
}

interface importFromOptions {
	base?: string | undefined
	cache?: boolean | undefined
	header?: string | undefined
}

/**
 * @param moduleName module ID
 * @param options default cache = false
 */
export function importFrom(moduleName: string, options: string | importFromOptions = {}) {
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

	const compilerOptions: ts.CompilerOptions = {
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ES2019,
		lib: ["es2019", "es2020.promise", "es2020.bigint", "es2020.string"],
		strict: true,
		esModuleInterop: true,
		skipLibCheck: true,
		removeComments: true,
		allowSyntheticDefaultImports: true,
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const interopExport = (obj: any) => (obj && obj.default ? obj.default : obj)

	const isAbs = path.isAbsolute(moduleName)
	if (isAbs || moduleName.startsWith("./") || moduleName.startsWith("../")) {
		switch (path.extname(moduleName)) {
			case ".json":
				return requireModule(moduleName, { cache, paths: path.dirname(moduleName) })
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
