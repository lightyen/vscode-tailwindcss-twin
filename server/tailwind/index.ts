import path from "path"
import type { Plugin, Postcss } from "postcss"
import type { TailwindConfig } from "tailwindcss/tailwind-config"
import { dlv } from "~/common/get_set"
import { requireModule, resolveModule } from "~/common/module"
import { Options, Twin, __INNER_TAILWIND_SEPARATOR__ } from "./twin"

export interface TailwindOptions {
	workspaceFolder: string
	configPath: string
	fallbackDefaultConfig: boolean
}

type DeepMutable<T> = {
	-readonly [P in keyof T]: DeepMutable<T[P]>
}

type Purge =
	| {
			enabled: boolean
			content: string[]
	  }
	| string[]

type DarkMode = false | "media" | "class"

type TailwindConfigJS = Omit<DeepMutable<TailwindConfig>, "purge" | "darkMode"> & {
	darkMode: DarkMode
	purge: Purge
}

export class Tailwind {
	constructor(options: Partial<TailwindOptions>) {
		this.load(options)
	}

	private load({ configPath = "", workspaceFolder = "", fallbackDefaultConfig = false }: Partial<TailwindOptions>) {
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
		if (result.config && result.configPath) {
			this.config = result.config
			this.distConfigPath = result.configPath
			this.hasConfig = true
		} else {
			if (!fallbackDefaultConfig) {
				throw Error("Error: resolve config " + configPath)
			}
			this.config = this.defaultConfig
			this.distConfigPath = this.defaultConfigPath
		}

		this.config.separator = this.config.separator ?? ":"
		if (this.config.separator != ":") {
			console.info("Option: `separator` forced to be set ':'.")
		}
		this.config.separator = __INNER_TAILWIND_SEPARATOR__
		this.separator = ":"
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
	tailwindcss!: (config: string | TailwindConfigJS) => Plugin
	tailwindcssVersion!: string
	resolveConfig!: (config: TailwindConfigJS) => TailwindConfigJS
	defaultConfig!: TailwindConfigJS
	defaultConfigPath!: string
	separator!: string

	// postcss
	postcss!: Postcss
	postcssVersion!: string

	private prepare() {
		this.tailwindcss = requireModule("tailwindcss", false)
		this.resolveConfig = requireModule("tailwindcss/resolveConfig", false)
		this.tailwindcssVersion = requireModule("tailwindcss/package.json", false).version
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		this.defaultConfigPath = resolveModule("tailwindcss/defaultConfig")!
		this.defaultConfig = requireModule("tailwindcss/defaultConfig", false)
		this.postcss = requireModule("postcss", false)
		this.postcssVersion = requireModule("postcss/package.json", false).version
	}

	// user config
	configPath = ""
	distConfigPath = ""
	workspaceFolder = ""
	hasConfig = false
	config!: TailwindConfigJS
	fallbackDefaultConfig = false

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

	twin!: Twin

	async process() {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const processer = this.postcss([this.tailwindcss(this.config!)])
		const results = await Promise.all([
			processer.process(`@tailwind components;`, { from: undefined }),
			processer.process(`@tailwind utilities;`, { from: undefined }),
		])
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		this.config = this.resolveConfig(this.config!)

		if (this.config.purge instanceof Array) {
			if (this.config.purge.length > 0) {
				console.info("Option: `purge` is ignored.")
			}
		} else if (this.config?.purge?.content != null || this.config?.purge?.enabled) {
			console.info("Option: `purge` is ignored.")
		}
		this.config.purge = { enabled: false, content: [] }
		if (this.config?.darkMode != "media" && this.config?.darkMode != "class") {
			console.info("Option: `darkMode` is not found, it will force to be set 'media'.")
			this.config.darkMode = "media"
		}

		this.config.prefix = this.config.prefix ?? ""
		if (typeof this.config.prefix !== "string") {
			console.info("Option: `prefix` forced to be set empty string.")
			this.config.prefix = ""
		}

		if (this.config.important) {
			console.info("Option: `important` forced to be set false.")
			this.config.important = false
		}

		this.twin = new Twin(
			this.config as Options,
			{ result: results[0], source: "components" },
			{ result: results[1], source: "utilities" },
		)
	}

	/**
	 * get theme value.
	 *
	 * example: ```getTheme(["colors", "blue", "500"])```
	 * @param keys
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	getTheme(keys: string[]): any {
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
