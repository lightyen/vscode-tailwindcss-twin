import path from "path"
import type { Postcss, Plugin, Result } from "postcss"
import { extractClassNames, __INNER_TAILWIND_SEPARATOR__ } from "./classnames"
import { requireModule, requirePnpModule, resolveModule } from "./module"

export interface TailwindConfig {
	purge: string[]
	darkMode: false | "media" | "class"
	theme: unknown
	plugins: unknown[]
	separator: string
	corePlugins: unknown
	prefix: string
	important: boolean
	variants: {
		extend: Record<string, string[]>
	}

	// ...
}

export interface ConfigPath {
	base: string
	filename: string
}

interface _Payload {
	tailwindcss?: (config: string | TailwindConfig) => Plugin
	tailwindRoot?: string
	tailwindInstalled: boolean
	postcss?: Postcss
	versions: {
		tailwindcss?: string
		postcss?: string
	}
	separator: string // user separator
	userConfig: boolean
	configPath?: string
	config: TailwindConfig
	darkMode: false | "media" | "class" // user darkMode
}

function getConfig(payload: _Payload, { base, filename }: { base: string; filename: string }) {
	try {
		const moduleId = "./" + filename
		payload.config = requireModule({ base, moduleId, removeCache: true })
		payload.configPath = resolveModule({ base, moduleId })
		payload.userConfig = true
	} catch (err) {
		if (!payload.tailwindInstalled) {
			base = ""
		}
		const moduleId = "tailwindcss/defaultConfig"
		payload.config = requireModule({ base, moduleId, removeCache: true })
		payload.configPath = resolveModule({ base, moduleId })
	}
	const userSeparator = payload.config.separator
	payload.separator = userSeparator && typeof userSeparator === "string" ? userSeparator : ":"
	payload.config.separator = __INNER_TAILWIND_SEPARATOR__
	payload.darkMode = payload.config.darkMode
}

function findTailwind(payload: _Payload) {
	const tailwindRoot = path.dirname(resolveModule({ base: "./", moduleId: "tailwindcss/package.json", silent: true }))
	if (!tailwindRoot) {
		const pnp = requireModule({ base: "./", moduleId: "./.pnp.js", silent: true })
		if (pnp) {
			pnp.setup()
		}
		const info = requirePnpModule({ pnp, base: "./", moduleId: "tailwindcss/package.json" })
		if (info) {
			console.log(info)
		}
	}
}

function prepareTailwind(payload: _Payload, base: string, exceptInstalled: boolean) {
	if (!exceptInstalled) {
		base = ""
	}
	const tailwindRoot = path.dirname(resolveModule({ base, moduleId: "tailwindcss/package.json" }))
	payload.tailwindcss = requireModule({ base, moduleId: "tailwindcss", removeCache: true })
	payload.versions.tailwindcss = requireModule({
		base,
		moduleId: "tailwindcss/package.json",
		removeCache: true,
	}).version
	try {
		payload.postcss = requireModule<Postcss>({ base, moduleId: "postcss", removeCache: true })
		payload.versions.postcss = requireModule({
			base,
			moduleId: "postcss/package.json",
			removeCache: true,
		}).version
	} catch {
		try {
			payload.postcss = requireModule<Postcss>({ base: tailwindRoot, moduleId: "postcss", removeCache: true })
			payload.versions.postcss = requireModule({
				base: tailwindRoot,
				moduleId: "postcss/package.json",
				removeCache: true,
			}).version
		} finally {
			// postcss is not found
		}
	}
	payload.tailwindRoot = tailwindRoot
}

interface Params extends ConfigPath {
	twin: boolean
}

export async function processTailwindConfig({ base, filename, twin }: Params) {
	const payload: _Payload = {
		versions: {},
		separator: ":",
		tailwindInstalled: false,
		userConfig: false,
		config: undefined,
		darkMode: undefined,
	}

	try {
		const packageJSON = requireModule({ base, moduleId: "./package.json", removeCache: true })
		if (!packageJSON?.dependencies?.tailwindcss && !packageJSON?.devDependencies?.tailwindcss) {
			throw Error("tailwindcss is not installed")
		}
		if (!packageJSON?.dependencies?.postcss && !packageJSON?.devDependencies?.postcss) {
			throw Error("postcss is not installed")
		}
		prepareTailwind(payload, base, true)
		payload.tailwindInstalled = true
	} catch (err) {
		prepareTailwind(payload, base, false)
	}

	let postcssResults: [Result, Result, Result]
	getConfig(payload, { base, filename })

	// TODO: apply plugin

	// change config for twin
	if (twin) {
		payload.config.darkMode = "media"
		payload.config.corePlugins = undefined
		payload.config.prefix = undefined
		payload.config.important = undefined
		payload.separator = ":" // always use ":" in twin
	}

	try {
		if (payload.postcss && payload.tailwindcss) {
			const processer = payload.postcss([payload.tailwindcss(payload.config)])
			postcssResults = await Promise.all([
				processer.process(`@tailwind base;`, { from: undefined }),
				processer.process(`@tailwind components;`, { from: undefined }),
				processer.process(`@tailwind utilities;`, { from: undefined }),
			])
		} else {
			throw Error("tailwindcss is not found.")
		}
	} finally {
		//
	}

	return {
		...payload,
		classnames: extractClassNames(postcssResults, twin),
		__INNER_TAILWIND_SEPARATOR__,
	}
}
