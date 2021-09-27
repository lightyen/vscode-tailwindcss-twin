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
		const pnpJs = path.join(ws, ".pnp.js")
		const filename = Module["_resolveFilename"](pnpJs, { paths: Module["_nodeModulePaths"](ws) })
		const module = new Module("")
		pnp = module.require(filename)
	} catch {}

	pnp?.setup?.()

	return pnp
}

export function resolveModuleName(moduleName: string, paths?: string[] | string): string | undefined {
	if (paths) {
		if (typeof paths === "string") {
			paths = Module["_nodeModulePaths"](paths)
		}
		return Module["_resolveFilename"](moduleName, { paths })
	}

	return __non_webpack_require__.resolve(moduleName)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function requireModule<T = any>(
	moduleName: string,
	{
		cache = true,
		paths,
		pnpLoad,
	}: {
		cache?: boolean
		paths?: string[] | string
		pnpLoad?: ((moduleId: string) => T) | undefined
	} = {},
): T | never {
	if (typeof paths === "string") {
		paths = Module["_nodeModulePaths"](paths) as string[]
	}

	if (!cache) {
		const filename = Module["_resolveFilename"](moduleName, { paths })
		delete Module["_cache"][filename]
	}

	if (pnpLoad) {
		return pnpLoad(moduleName)
	}

	const __module = new Module("")
	if (!paths) return __module.require(moduleName)

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
					return requireModule(moduleName, { cache: false, paths: __module.paths })
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
					if (!resolvedFileName) return requireModule(moduleName, { cache: false })
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

		// NOTE: remove cache
		const pnpLoad = pnp ? (id: string) => Module["_load"](id) : undefined
		return requireModule(moduleName, { cache: false, paths: __module.paths, pnpLoad })
	} as NodeJS.Require
	__module["_compile"](code, "")
	if (__module.exports?.__esModule) return __module.exports.default
	return __module.exports
}

function insertHeader(header: string, code: string) {
	// NOTE: remove #!/usr/bin/env node
	if (code.startsWith("#!")) {
		const i = code.indexOf("\n")
		if (i > 0) code = code.slice(i)
	}
	return header + code
}

/** import module. */
export function importFrom(
	moduleName: string,
	{ header = "", cache = false, base }: { header?: string; cache?: boolean; base?: string } = {},
) {
	const compilerOptions: ts.CompilerOptions = {
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ES2019,
		lib: ["es2019", "es2020.promise", "es2020.bigint", "es2020.string"],
		strict: true,
		esModuleInterop: true,
		skipLibCheck: true,
		allowSyntheticDefaultImports: true,
		removeComments: true,
	}

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
				return requireModuleFromCode(
					compilerOptions,
					insertHeader(header, transpile(compilerOptions, moduleName)),
					moduleName,
					pnp,
					base,
				)
			}
			default: {
				const pnp = tryPnP(path.dirname(moduleName))
				if (pnp) compilerOptions.strict = false
				const resolvedFileName = tryAddExtensions(moduleName)
				if (resolvedFileName) moduleName = resolvedFileName
				return requireModuleFromCode(
					compilerOptions,
					insertHeader(header, transpile(compilerOptions, moduleName)),
					moduleName,
					pnp,
					base,
				)
			}
		}
	}

	if (base) return requireModule(moduleName, { cache, paths: base })

	return requireModule(moduleName, { cache })
}
