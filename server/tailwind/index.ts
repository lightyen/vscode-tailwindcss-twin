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
	twin: boolean
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

export class Tailwind {
	constructor(options: Partial<InitParams & Settings>) {
		this.load(options)
	}

	private load({
		configPath,
		workspaceFolder,
		twin = false,
		fallbackDefaultConfig = false,
	}: Partial<InitParams & Settings>) {
		this.workspaceFolder = workspaceFolder
		configPath = configPath || ""
		const isAbs = configPath && path.isAbsolute(configPath)
		configPath = isAbs ? configPath : path.resolve(workspaceFolder, configPath)
		this.lookup(path.dirname(configPath))
		this.twin = twin
		this.fallbackDefaultConfig = fallbackDefaultConfig
		this.hasConfig = false
		if (isAbs) {
			const result = this.findConfig(configPath)
			if (result.config) {
				this.config = result.config
				this.configPath = result.configPath
				this.hasConfig = true
			}
		}
		if (!this.config) {
			if (isAbs || !fallbackDefaultConfig) {
				throw Error("not found: " + configPath)
			}
			this.config = this.defaultConfig
			this.configPath = this.defaultConfigPath
		}
		this.separator = this.config.separator || ":"
		this.config.separator = __INNER_TAILWIND_SEPARATOR__

		// change config for twin
		if (twin) {
			this.separator = ":" // always use ":" in twin
			this.config.purge = { enabled: false, content: [] }
			if (!this.config.darkMode) {
				this.config.darkMode = "media"
			}
			this.config.corePlugins = undefined
			this.config.prefix = undefined
			this.config.important = undefined
		}
	}

	async reload(params?: Partial<InitParams & Settings>) {
		const {
			workspaceFolder = this.workspaceFolder,
			configPath = this.configPath,
			twin = this.twin,
			fallbackDefaultConfig = this.fallbackDefaultConfig,
		} = params || {}
		this.load({
			workspaceFolder,
			configPath,
			twin,
			fallbackDefaultConfig,
		})
		await this.process()
	}

	twin: boolean
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
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const hasTailwind = (packageJSON: any) =>
			!!packageJSON?.dependencies?.tailwindcss || !!packageJSON?.devDependencies?.tailwindcss

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let json: any
		try {
			json = JSON.parse(readFileSync(path.join(base, "package.json"), { encoding: "utf-8" }))
		} catch {}

		if (json) {
			this.jsonTwin = json.twin
		}

		if (json && hasTailwind(json)) {
			const m = new TModule(base)
			this.tailwindcssPath = m.resolve({ moduleId: "tailwindcss/package.json" })
			if (this.tailwindcssPath) {
				const tailwindcss = m.require({ moduleId: "tailwindcss" })
				const resolveConfig = m.require({ moduleId: "tailwindcss/resolveConfig" })
				const _json = m.require({ moduleId: "tailwindcss/package.json" })
				if (tailwindcss && resolveConfig && _json) {
					this.tailwindcss = tailwindcss
					this.resolveConfig = resolveConfig
					this.tailwindcssVersion = _json.version
					this.defaultConfigPath = m.resolve({ moduleId: "tailwindcss/defaultConfig" })
					this.defaultConfig = m.require({ moduleId: "tailwindcss/defaultConfig" })
				}
			}
		}

		if (!this.tailwindcss) {
			this.tailwindcssPath = TModule.resolve({ moduleId: "tailwindcss/package.json" })
			this.tailwindcss = TModule.require({ moduleId: "tailwindcss" })
			this.resolveConfig = TModule.require({ moduleId: "tailwindcss/resolveConfig" })
			const _json = TModule.require({ moduleId: "tailwindcss/package.json" })
			this.tailwindcssVersion = _json.version
			this.defaultConfigPath = TModule.resolve({ moduleId: "tailwindcss/defaultConfig" })
			this.defaultConfig = TModule.require({ moduleId: "tailwindcss/defaultConfig" })
		}

		// force postcss version
		this.postcssPath = TModule.resolve({ moduleId: "postcss/package.json" })
		this.postcss = TModule.require({ moduleId: "postcss", removeCache: false })
		const _json = TModule.require({ moduleId: "postcss/package.json", removeCache: false })
		this.postcssVersion = _json.version
	}

	// user config
	configPath: string
	workspaceFolder: string
	hasConfig: boolean
	config: TailwindConfigJS
	fallbackDefaultConfig: boolean

	private findConfig(configPath: string) {
		const result: { configPath?: string; config?: TailwindConfigJS } = {}
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
		} catch {}
		if (!result.config) {
			const _configPath = path.resolve(configPath)
			const str = readFileSync(_configPath, { encoding: "utf-8" })
			const config = eval(str)
			result.configPath = _configPath
			result.config = config
		}
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
		this.classnames = extractClassNames(results, this.config.darkMode, this.twin)
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
