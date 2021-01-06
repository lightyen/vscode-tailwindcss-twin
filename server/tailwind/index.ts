import type { Postcss, Plugin } from "postcss"
import path from "path"
import { TModule } from "./module"
import { extractClassNames, __INNER_TAILWIND_SEPARATOR__ } from "./classnames"
import { dlv } from "./common"
import { readFileSync } from "fs"

interface InitParams {
	workspaceFolder: string
	configPath: string
}

interface Settings {
	fallbackDefaultConfig: boolean
}

type PurgeOption =
	| {
			enabled: boolean
			content: string[]
	  }
	| string[]

interface TailwindConfigJS {
	purge: PurgeOption
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

console.log(
	"tailwindcss version:",
	TModule.require({ moduleId: "tailwindcss/package.json", removeCache: false }).version,
)
console.log("postcss version:", TModule.require({ moduleId: "postcss/package.json", removeCache: false }).version)

export class Tailwind {
	constructor(options: Partial<InitParams & Settings>) {
		this.load(options)
	}

	private load({ configPath, workspaceFolder, fallbackDefaultConfig = false }: Partial<InitParams & Settings>) {
		this.configPath = configPath
		this.workspaceFolder = workspaceFolder
		configPath = configPath || ""
		const isAbs = configPath && path.isAbsolute(configPath)
		configPath = isAbs ? configPath : path.resolve(workspaceFolder, configPath)
		this.lookup(path.dirname(configPath))
		this.fallbackDefaultConfig = fallbackDefaultConfig
		this.hasConfig = false
		let result: ReturnType<Tailwind["findConfig"]> = {}
		if (isAbs) {
			result = this.findConfig(configPath)
		}
		if (!result.config) {
			if (!fallbackDefaultConfig) {
				throw Error("Error: resolve config " + configPath)
			}
			this.config = this.defaultConfig
			this.distConfigPath = this.defaultConfigPath
		} else {
			this.config = result.config
			this.distConfigPath = result.configPath
			this.hasConfig = true
		}
		this.separator = this.config.separator || ":"
		this.config.separator = __INNER_TAILWIND_SEPARATOR__

		// change config for twin
		this.separator = ":" // always use ":" in twin
		this.config.purge = { enabled: false, content: [] }
		if (!this.config.darkMode) {
			this.config.darkMode = "media"
		}
		this.config.corePlugins = undefined
		this.config.prefix = undefined
		this.config.important = undefined
	}

	async reload(params?: Partial<InitParams & Settings>) {
		const {
			workspaceFolder = this.workspaceFolder,
			configPath = this.configPath,
			fallbackDefaultConfig = this.fallbackDefaultConfig,
		} = params || {}
		this.load({
			workspaceFolder,
			configPath,
			fallbackDefaultConfig,
		})
		await this.process()
	}

	jsonTwin?: { config?: string }

	// tailwindcss
	tailwindcss: (config: string | TailwindConfigJS) => Plugin
	tailwindcssPath: string
	tailwindcssVersion: string
	resolveConfig: (config: TailwindConfigJS) => TailwindConfigJS
	defaultConfig: TailwindConfigJS
	defaultConfigPath: string
	separator: string

	// postcss
	postcss: Postcss
	postcssPath: string
	postcssVersion: string

	private lookup(base: string) {
		this.tailwindcssPath = TModule.resolve({ moduleId: "tailwindcss/package.json" })
		this.tailwindcss = TModule.require({ moduleId: "tailwindcss", removeCache: false })
		this.resolveConfig = TModule.require({ moduleId: "tailwindcss/resolveConfig", removeCache: false })
		this.tailwindcssVersion = TModule.require({ moduleId: "tailwindcss/package.json", removeCache: false }).version
		this.defaultConfigPath = TModule.resolve({ moduleId: "tailwindcss/defaultConfig" })
		this.defaultConfig = TModule.require({ moduleId: "tailwindcss/defaultConfig", removeCache: false })
		this.postcssPath = TModule.resolve({ moduleId: "postcss/package.json" })
		this.postcss = TModule.require({ moduleId: "postcss", removeCache: false })
		this.postcssVersion = TModule.require({ moduleId: "postcss/package.json", removeCache: false }).version
	}

	// user config
	configPath: string
	distConfigPath: string
	workspaceFolder: string
	hasConfig: boolean
	config: TailwindConfigJS
	fallbackDefaultConfig: boolean

	private findConfig(configPath: string) {
		const result: { configPath?: string; config?: TailwindConfigJS } = {}
		let err: Error
		try {
			const _configPath = TModule.resolve({
				base: path.dirname(configPath),
				moduleId: "./" + path.basename(configPath),
				silent: false,
			})
			if (path.resolve(configPath) === _configPath) {
				result.config = TModule.require({
					base: path.dirname(configPath),
					moduleId: "./" + path.basename(configPath),
					silent: false,
				})
				result.configPath = _configPath
			}
		} catch (error) {
			err = error
		}
		try {
			if (!result.config) {
				const _configPath = path.resolve(configPath)
				const str = readFileSync(_configPath, { encoding: "utf-8" })
				const config = eval(str)
				result.configPath = _configPath
				result.config = config
			}
		} catch (error) {
			err = error
		}
		if (err instanceof Error) console.log("[Error] resolving config:\n", err)
		return result
	}

	classnames: ReturnType<typeof extractClassNames>

	async process() {
		const processer = this.postcss([this.tailwindcss(this.config)])
		const results = await Promise.all([
			processer.process(`@tailwind base;`, { from: undefined }),
			processer.process(`@tailwind components;`, { from: undefined }),
			processer.process(`@tailwind utilities;`, { from: undefined }),
		])
		this.config = this.resolveConfig(this.config)
		this.classnames = extractClassNames(results, this.config.darkMode)
	}

	/**
	 * get theme value.
	 *
	 * example: ```getTheme("colors.blue.500")```
	 * @param keys
	 */
	getTheme(keys: string[]) {
		if (!this.config) {
			return undefined
		}
		return dlv(this.config.theme, keys)
	}

	getConfig(keys: string[]) {
		if (!this.config) {
			return undefined
		}
		return dlv(this.config, keys)
	}
}
