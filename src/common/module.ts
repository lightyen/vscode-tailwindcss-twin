import Module from "module"
import path from "path"
import ts from "typescript"
import * as tp from "typescript-paths"
import { defaultLogger as console } from "./logger"
import type { PnpApi } from "./pnp"

interface resolveModuleNameOptions {
	filename?: string
	paths?: string[] | string | undefined
	pnp?: PnpApi | undefined
}

export function resolveModuleName(
	moduleName: string,
	options: string | resolveModuleNameOptions = {},
): string | undefined {
	let pnp: PnpApi | undefined
	let paths: string | string[] | undefined
	let filename = ""
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
			// @ts-ignore TS/7016
			paths = Module["_nodeModulePaths"](paths)
		}
	}
	if (!paths) {
		// @ts-ignore TS/7016
		paths = Module["_nodeModulePaths"](process.cwd()) as string[]
	}
	// @ts-ignore TS/7016
	return Module["_resolveFilename"](moduleName, { paths })
}

interface requireModuleOptions {
	paths?: string[] | string | undefined
	pnp?: PnpApi | undefined
	cache?: boolean | undefined
	filename?: string | undefined
}

export function requireModule(moduleName: string, options: string | requireModuleOptions = {}) {
	let pnp: PnpApi | undefined
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
		if (!path.isAbsolute(filename)) filename = path.resolve(filename)
		moduleName = pnp.resolveRequest(moduleName, filename)
	}
	if (typeof paths === "string") {
		// @ts-ignore TS/7016
		paths = Module["_nodeModulePaths"](paths) as string[]
	}
	if (!paths) {
		// @ts-ignore TS/7016
		paths = Module["_nodeModulePaths"](process.cwd()) as string[]
	}
	if (!cache) {
		if (pnp) {
			// @ts-ignore TS/7016
			delete Module["_cache"][moduleName]
		} else {
			// @ts-ignore TS/7016
			moduleName = Module["_resolveFilename"](moduleName, {
				paths,
				filename,
			})
			// @ts-ignore TS/7016
			delete Module["_cache"][moduleName]
		}
	}

	const __module = new Module(filename)
	__module.paths = paths
	if (process.env.NODE_ENV === "test") return require(moduleName)
	return __module.require(moduleName)
}

export function transpile(compilerOptions: ts.CompilerOptions, moduleName: string): string {
	const code = ts.sys.readFile(moduleName)
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const { outputText: transpiledCode, diagnostics } = ts.transpileModule(code!, {
		moduleName,
		compilerOptions,
	})

	if (diagnostics) {
		for (const diagnostic of diagnostics) {
			console.info(diagnostic.messageText)
		}
	}

	return transpiledCode
}

type Mappings = ReturnType<typeof tp.createMappings>

function requireModuleFromCode(
	compilerOptions: ts.CompilerOptions,
	code: string,
	filename: string,
	host: ts.ModuleResolutionHost,
	pnp?: PnpApi | undefined,
	mappings?: Mappings | undefined,
	base = path.dirname(filename),
) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const interopExport = (obj: any) => (obj && obj.default ? obj.default : obj)
	const __module = new Module(filename)
	// @ts-ignore TS/7016
	__module.paths = Module["_nodeModulePaths"](base)
	__module.require = function __require(moduleName: string) {
		if (mappings) {
			const resolved = tp.resolveModuleName({
				mappings,
				compilerOptions,
				host,
				request: moduleName,
				importer: "empty",
			})
			if (resolved) {
				moduleName = resolved
			}
		}

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
					return interopExport(
						requireModuleFromCode(
							compilerOptions,
							transpile(compilerOptions, moduleName),
							moduleName,
							host,
							pnp,
							mappings,
						),
					)
				default: {
					const { resolvedModule } = ts.resolveModuleName(moduleName, filename, compilerOptions, host)
					if (!resolvedModule?.resolvedFileName) return requireModule(moduleName, { filename, cache: false })
					moduleName = resolvedModule.resolvedFileName
					return interopExport(
						requireModuleFromCode(
							compilerOptions,
							transpile(compilerOptions, moduleName),
							moduleName,
							host,
							pnp,
							mappings,
						),
					)
				}
			}
		}

		return requireModule(moduleName, { filename, cache: false, paths: __module.paths, pnp })
	} as NodeJS.Require
	// @ts-ignore TS/7016
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
	pnp?: PnpApi | undefined
}

const logger = tp.createLogger({ logLevel: tp.LogLevel.Error })

/**
 * @param moduleName module ID
 * @param options default cache = true
 */
// @ts-ignore TS/7016
export function importFrom(moduleName: string, options: string | importFromOptions = {}) {
	let base = ""
	let header = ""
	let cache = true
	let pnp: PnpApi | undefined
	if (typeof options === "string") {
		base = options
	} else if (options && typeof options === "object") {
		header = options.header || ""
		base = options.base || ""
		cache = options.cache || true
		pnp = options.pnp
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

	const host: ts.ModuleResolutionHost = {
		...ts.sys,
		fileExists(filename) {
			if (filename.endsWith(ts.Extension.Dts)) return false
			return ts.sys.fileExists(filename)
		},
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const interopExport = (obj: any) => (obj && obj.default ? obj.default : obj)

	function loadTsConfig(ws: string) {
		let mappings: Mappings | undefined
		const tsConfigPath = ts.findConfigFile(ws, ts.sys.fileExists)
		if (tsConfigPath) {
			const { error, config } = ts.readConfigFile(tsConfigPath, host.readFile)
			if (!error) {
				const { options, errors } = ts.parseJsonConfigFileContent(config, ts.sys, path.resolve(ws))
				if (errors.length === 0 && options.paths) {
					const ms = tp.createMappings({ paths: options.paths, log: logger })
					if (ms.length > 0) {
						mappings = ms
					}
				}
				for (const error of errors) {
					console.info(error.messageText)
				}
			}
		}
		return mappings
	}

	const isAbs = path.isAbsolute(moduleName)
	if (isAbs || moduleName.startsWith("./") || moduleName.startsWith("../")) {
		const currentDirectory = path.dirname(moduleName)
		const mappings = loadTsConfig(currentDirectory)
		if (mappings) compilerOptions.baseUrl = currentDirectory
		switch (path.extname(moduleName)) {
			case ".json":
				return requireModule(moduleName, { cache, paths: currentDirectory })
			case ".ts":
			case ".js":
			case ".cjs":
			case ".mjs": {
				if (pnp) compilerOptions.strict = false
				return interopExport(
					requireModuleFromCode(
						compilerOptions,
						insertHeader(header, transpile(compilerOptions, moduleName)),
						moduleName,
						host,
						pnp,
						mappings,
					),
				)
			}
			default: {
				if (pnp) compilerOptions.strict = false
				const containingFile = path.resolve(currentDirectory, "empty")
				const { resolvedModule } = ts.resolveModuleName(moduleName, containingFile, compilerOptions, host)
				if (resolvedModule?.resolvedFileName) moduleName = resolvedModule.resolvedFileName
				return interopExport(
					requireModuleFromCode(
						compilerOptions,
						insertHeader(header, transpile(compilerOptions, moduleName)),
						moduleName,
						host,
						pnp,
						mappings,
					),
				)
			}
		}
	}

	if (base) {
		const mappings = loadTsConfig(base)
		if (mappings) {
			compilerOptions.baseUrl = base
			const resolved = tp.resolveModuleName({
				mappings,
				compilerOptions,
				host,
				request: moduleName,
				importer: "empty",
			})
			if (resolved) {
				if (typeof options === "string") {
					return importFrom(resolved)
				}
				return importFrom(resolved, { ...options, base: "" })
			}
		}

		const containingFile = path.resolve(base, "empty")
		const { resolvedModule } = ts.resolveModuleName(moduleName, containingFile, compilerOptions, host)
		if (resolvedModule?.resolvedFileName) moduleName = resolvedModule.resolvedFileName
		return interopExport(requireModule(moduleName, { cache, paths: base, pnp }))
	}

	const { resolvedModule } = ts.resolveModuleName(moduleName, "./empty", compilerOptions, host)
	if (resolvedModule?.resolvedFileName) moduleName = resolvedModule.resolvedFileName
	return interopExport(requireModule(moduleName, { cache }))
}
