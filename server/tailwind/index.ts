import path from "path"
import type { Plugin, Postcss } from "postcss"
import { requireModule, resolveModule } from "~/common/module"
import { extractClassNames, __INNER_TAILWIND_SEPARATOR__ } from "./classnames"
import { dlv } from "./common"

export interface TailwindOptions {
	workspaceFolder: string
	configPath: string
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
	prefix: string
	important: boolean
	variants: {
		extend: Record<string, string[]>
	}

	// ...
}

export class Tailwind {
	constructor(options: Partial<TailwindOptions>) {
		this.load(options)
	}

	private load({ configPath, workspaceFolder, fallbackDefaultConfig = false }: Partial<TailwindOptions>) {
		this.configPath = configPath
		this.workspaceFolder = workspaceFolder
		configPath = configPath || ""
		const isAbs = configPath && path.isAbsolute(configPath)
		configPath = isAbs ? configPath : path.resolve(workspaceFolder, configPath)

		this.prepare()

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
		this.separator = ":"
		this.config.purge = { enabled: false, content: [] }
		if (!this.config.darkMode) {
			this.config.darkMode = "media"
		}
		if (typeof this.config.prefix !== "string") {
			this.config.prefix = ""
		}
		this.config.important = undefined
	}

	async reload(params?: Partial<TailwindOptions>) {
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
	tailwindcssVersion: string
	resolveConfig: (config: TailwindConfigJS) => TailwindConfigJS
	defaultConfig: TailwindConfigJS
	defaultConfigPath: string
	separator: string

	// postcss
	postcss: Postcss
	postcssVersion: string

	private prepare() {
		this.tailwindcss = requireModule("tailwindcss", false)
		this.resolveConfig = requireModule("tailwindcss/resolveConfig", false)
		this.tailwindcssVersion = requireModule("tailwindcss/package.json", false).version
		this.defaultConfigPath = resolveModule("tailwindcss/defaultConfig")
		this.defaultConfig = requireModule("tailwindcss/defaultConfig", false)
		this.postcss = requireModule("postcss", false)
		this.postcssVersion = requireModule("postcss/package.json", false).version
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
		try {
			result.config = requireModule(configPath)
			result.configPath = configPath
		} catch (err) {
			console.log(err)
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
		this.classnames = extractClassNames(results, this.config.darkMode, this.config.prefix)
	}

	/**
	 * get theme value.
	 *
	 * example: ```getTheme(["colors", "blue", "500"])```
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
