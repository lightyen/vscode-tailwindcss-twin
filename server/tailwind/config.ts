import path from "path"
import type { Postcss, Plugin, Result } from "postcss"
import { extractClassNames, __INNER_TAILWIND_SEPARATOR__ } from "./classnames"
import { TModule } from "./module"

export interface TailwindConfig {
	purge: string[]
	darkMode: false | "media" | "class"
	theme: Record<string, unknown>
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

interface _Payload {
	tailwindcss?: (config: string | TailwindConfig) => Plugin
	tailwindcssResolveConfig?: (config: TailwindConfig) => TailwindConfig
	tailwindRoot?: string
	postcssRoot?: string
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

function getConfig(
	payload: _Payload,
	{
		base,
		filename,
		m,
		fallbackDefaultConfig,
	}: { base: string; filename: string; m: TModule; fallbackDefaultConfig: boolean },
) {
	try {
		const moduleId = "./" + filename
		payload.config = TModule.require({ base, moduleId, removeCache: true })
		payload.configPath = TModule.resolve({ base, moduleId })
		payload.userConfig = true
	} catch (err) {
		if (!fallbackDefaultConfig) {
			throw Error("tailwind config is not found.")
		}
		if (err.code !== "MODULE_NOT_FOUND") {
			throw err
		}
		if (!payload.tailwindRoot) {
			// use extension embedded lib
			base = ""
		}
		const moduleId = "tailwindcss/defaultConfig"
		payload.config = m.require({ base, moduleId, removeCache: true })
		payload.configPath = m.resolve({ base, moduleId })
	}
	const userSeparator = payload.config.separator
	payload.separator = userSeparator && typeof userSeparator === "string" ? userSeparator : ":"
	payload.config.separator = __INNER_TAILWIND_SEPARATOR__
	payload.darkMode = payload.config.darkMode
}

function prepareTailwind(payload: _Payload, base: string) {
	const m = new TModule(base)
	const tailwindRoot = path.dirname(m.resolve({ base, moduleId: "tailwindcss/package.json" }))
	payload.tailwindcss = m.require({ base, moduleId: "tailwindcss", removeCache: true })
	payload.tailwindcssResolveConfig = m.require({ base, moduleId: "tailwindcss/resolveConfig", removeCache: true })
	payload.versions.tailwindcss = m.require({
		base,
		moduleId: "tailwindcss/package.json",
		removeCache: true,
	}).version
	payload.tailwindRoot = tailwindRoot
	try {
		const postcssRoot = path.dirname(m.resolve({ base, moduleId: "postcss" }))
		payload.postcss = m.require<Postcss>({ base, moduleId: "postcss", removeCache: true })
		payload.versions.postcss = m.require({
			base,
			moduleId: "postcss/package.json",
			removeCache: true,
		}).version
		payload.postcssRoot = postcssRoot
	} catch {
		try {
			const postcssRoot = path.dirname(m.resolve({ base: tailwindRoot, moduleId: "postcss" }))
			payload.postcss = m.require<Postcss>({ base: tailwindRoot, moduleId: "postcss", removeCache: true })
			payload.versions.postcss = m.require({
				base: tailwindRoot,
				moduleId: "postcss/package.json",
				removeCache: true,
			}).version
			payload.postcssRoot = postcssRoot
		} finally {
			// postcss is not found
		}
	}
	return m
}

interface Params {
	workspaceFoloder: string
	tailwindConfigPath: string
	twin: boolean
	fallbackDefaultConfig: boolean
}

export async function processTailwindConfig({
	workspaceFoloder = "",
	tailwindConfigPath = "",
	twin = false,
	fallbackDefaultConfig = false,
}: Partial<Params>) {
	const base = workspaceFoloder
	const filename = path.relative(workspaceFoloder, tailwindConfigPath)
	const payload: _Payload = {
		versions: {},
		separator: ":",
		userConfig: false,
		config: undefined,
		darkMode: undefined,
	}
	let m: TModule
	try {
		const packageJSON = TModule.require({ base, moduleId: "./package.json", removeCache: true })
		if (!packageJSON?.dependencies?.tailwindcss && !packageJSON?.devDependencies?.tailwindcss) {
			throw Error("tailwindcss is not installed")
		}
		if (!packageJSON?.dependencies?.postcss && !packageJSON?.devDependencies?.postcss) {
			throw Error("postcss is not installed")
		}
		m = prepareTailwind(payload, base)
	} catch (err) {
		m = prepareTailwind(payload, "")
	}

	let postcssResults: [Result, Result, Result]
	getConfig(payload, { base, filename, m, fallbackDefaultConfig })

	// TODO: apply plugin?

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
			payload.config = payload.tailwindcssResolveConfig(payload.config)
		} else {
			throw Error("tailwindcss is not found.")
		}
	} finally {
		//
	}

	return {
		...payload,
		classnames: extractClassNames(postcssResults, payload.darkMode, twin),
		__INNER_TAILWIND_SEPARATOR__,
	}
}
