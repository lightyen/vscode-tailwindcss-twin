import path from "path"
import type { Plugin, Postcss } from "postcss"
import { dlv } from "~/common/get_set"
import { requireModule, resolveModule } from "~/common/module"
import { Twin, __INNER_TAILWIND_SEPARATOR__ } from "./twin"

const twinPlugin: Tailwind.Plugin = ({ addUtilities }) => {
	addUtilities({
		".content": {
			content: '""',
		},
	})
}

function preprocessConfig(config: Tailwind.ConfigJS): Tailwind.ConfigJS {
	const cfg = { ...config } as Tailwind.ConfigJS
	cfg.separator = __INNER_TAILWIND_SEPARATOR__
	cfg.purge = { enabled: false, content: [] }
	cfg.mode = "aot"
	cfg.important = false
	cfg.darkMode = "media"
	if (typeof cfg?.prefix !== "string") {
		cfg.prefix = ""
	}
	return cfg
}

export interface TailwindOptions {
	workspaceFolder: string
	configPath: string
	fallbackDefaultConfig: boolean
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
			const config = preprocessConfig(result.config)
			if (!(config.plugins instanceof Array)) config.plugins = []
			config.plugins.push(this.plugin(twinPlugin))
			this.config = this.resolveConfig(config)
			this.distConfigPath = result.configPath
			this.hasConfig = true
		} else {
			if (!fallbackDefaultConfig) {
				throw Error("Error: resolve config " + configPath)
			}
			this.config = this.resolveConfig(this.defaultConfig)
			this.distConfigPath = this.defaultConfigPath
		}
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
	tailwindcss!: (config: string | Tailwind.ConfigJS) => Plugin
	tailwindcssVersion!: string
	resolveConfig!: (config: Tailwind.ConfigJS) => Tailwind.ResolvedConfigJS
	plugin!: (plugin: Tailwind.Plugin) => Tailwind.Plugin
	defaultConfig!: Tailwind.DefaultConfig
	defaultConfigPath!: string
	separator!: string

	// postcss
	postcss!: Postcss
	postcssVersion!: string

	private prepare() {
		this.tailwindcss = requireModule("tailwindcss", false)
		this.resolveConfig = requireModule("tailwindcss/resolveConfig", false)
		this.plugin = requireModule("tailwindcss/plugin", false)
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
	config!: Tailwind.ResolvedConfigJS
	fallbackDefaultConfig = false

	private findConfig(configPath: string) {
		const result: { configPath?: string; config?: Tailwind.ConfigJS } = {}
		try {
			result.config = requireModule(configPath)
			result.configPath = configPath
		} catch (err) {
			console.log(err)
		}
		return result
	}

	twin!: Twin

	private getColorNames(resloved: Tailwind.ResolvedConfigJS): string[] {
		const colors = resloved.theme.colors
		const names: string[] = []
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		function pr(c: any, prefix = "") {
			for (const key in c) {
				if (key === "DEFAULT") {
					names.push(prefix.slice(0, -1))
					continue
				}

				if (typeof c[key] === "string" || typeof c[key] === "number" || typeof c[key] === "function") {
					if (prefix) {
						names.push(`${prefix}${key}`)
					} else {
						names.push(key)
					}
				} else if (c[key] instanceof Array) {
					//
				} else if (typeof c[key] === "object") {
					pr(c[key], key + "-")
				}
			}
		}
		pr(colors)
		return names
	}

	async process() {
		this.separator = ":"
		const processer = this.postcss([this.tailwindcss(this.config)])

		const bs = ["border-t", "border-b", "border-l", "border-r"]
		const tmp = { ...this.config }
		tmp.mode = "jit"
		tmp.purge = { content: [] }
		tmp.purge.safelist = bs
			.map(b => this.getColorNames(this.config).map(c => `${this.config.prefix}${b}-${c}`))
			.flat()
		tmp.purge.safelist.push("transform-cpu")

		const processerJIT = this.postcss([this.tailwindcss(tmp)])
		const results = await Promise.all([
			processer.process(`@tailwind base;@tailwind components;`, { from: undefined }),
			processer.process(`@tailwind utilities;`, { from: undefined }),
			processerJIT.process(`@tailwind utilities;`, { from: undefined }),
		])

		this.twin = new Twin(
			this.config,
			{ result: results[0], source: "components" },
			{ result: results[1], source: "utilities" },
			{ result: results[2], source: "utilities" },
		)
	}

	async jit(className: string) {
		className = className.replace(/\s/g, "")
		const tmp = { ...this.config }
		tmp.mode = "jit"
		tmp.purge = { enabled: false, content: [], safelist: [className] }
		const processer = this.postcss([this.tailwindcss(tmp)])
		const results = await Promise.all([
			processer.process("@tailwind base;@tailwind components;", { from: undefined }),
			processer.process("@tailwind utilities;", { from: undefined }),
		])

		return new Twin(tmp, { result: results[0], source: "components" }, { result: results[1], source: "utilities" })
	}

	async jitColor(className: string) {
		className = className.replace(/\s/g, "")
		const tmp = { ...this.config }
		tmp.mode = "jit"
		tmp.purge = { enabled: false, content: [], safelist: [className] }
		const processer = this.postcss([this.tailwindcss(tmp)])
		const result = await processer.process("@tailwind utilities;", { from: undefined })
		return new Twin(tmp, { result, source: "utilities" })
	}

	/**
	 * get theme value.
	 *
	 * example: ```getTheme(["colors", "blue", "500"])```
	 * @param keys
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	getTheme(keys: string[], useDefault = false): any {
		if (!this.config) {
			return undefined
		}
		let value = dlv(this.config.theme, keys)
		if (useDefault && value?.["DEFAULT"] != undefined) {
			value = value["DEFAULT"]
		}
		return value
	}

	getConfig(keys: string[]) {
		if (!this.config) {
			return undefined
		}
		return dlv(this.config, keys)
	}
}
