import { URI } from "vscode-uri"
import { dlv } from "~/common/get_set"
import { importFrom } from "~/common/module"
import { createTwin, Twin, __INNER_TAILWIND_SEPARATOR__ } from "./twin"

export type TailwindLoader = ReturnType<typeof createTailwindLoader>

export enum ExtensionMode {
	/**
	 * The extension is installed normally (for example, from the marketplace
	 * or VSIX) in the editor.
	 */
	Production = 1,

	/**
	 * The extension is running from an `--extensionDevelopmentPath` provided
	 * when launching the editor.
	 */
	Development = 2,

	/**
	 * The extension is running from an `--extensionTestsPath` and
	 * the extension host is running unit tests.
	 */
	Test = 3,
}

export function createTailwindLoader(configPath: URI, extensionUri: URI, extensionMode: ExtensionMode) {
	const tailwindcss = importFrom("tailwindcss", { cache: true, base: extensionUri.fsPath })
	const resolveConfig = importFrom("tailwindcss/resolveConfig", { cache: true, base: extensionUri.fsPath })
	const plugin = importFrom("tailwindcss/plugin", { cache: true, base: extensionUri.fsPath })
	const postcss = importFrom("postcss", { cache: true, base: extensionUri.fsPath })

	let config: Tailwind.ResolvedConfigJS
	let twin: Twin
	const separator = ":"

	return {
		get separator() {
			return separator
		},
		get twin() {
			return twin
		},
		get config() {
			return config
		},
		readTailwindConfig,
		runPostCSS,
		jit,
		jitColor,
		getTheme,
		getConfig,
	}

	function preprocessConfig(config: Tailwind.ConfigJS): Tailwind.ConfigJS {
		const cfg = { ...config } as Tailwind.ConfigJS
		cfg.separator = __INNER_TAILWIND_SEPARATOR__
		cfg.purge = { enabled: false, content: [] }
		cfg.mode = "aot"
		cfg.important = false
		if (cfg.darkMode !== "media" && cfg.darkMode !== "class") cfg.darkMode = "media"
		if (typeof cfg?.prefix !== "string") {
			cfg.prefix = ""
		}
		return cfg
	}

	async function readTailwindConfig(): Promise<void | never> {
		const moduleName = configPath.fsPath
		let __config = importFrom(moduleName, {
			header:
				extensionMode === ExtensionMode.Development
					? "process.env.NODE_ENV = 'development';\n"
					: "process.env.NODE_ENV = 'production';\n",
		}) as Tailwind.ConfigJS

		if (__config) {
			__config = preprocessConfig(__config)
			config = resolveConfig(__config, {
				plugins: [
					plugin(({ addUtilities }) => {
						addUtilities({
							".content": {
								content: '""',
							},
						})
					}),
				],
			})
		}
	}

	async function runPostCSS(): Promise<void | never> {
		const processer = postcss([tailwindcss(config)])

		const bs = ["border-t", "border-b", "border-l", "border-r"]
		const tmp = { ...config }
		tmp.mode = "jit"
		tmp.purge = { content: [] }
		tmp.purge.safelist = bs.map(b => getColorNames(config).map(c => `${config.prefix}${b}-${c}`)).flat()
		tmp.purge.safelist.push("transform-cpu")

		const processerJIT = postcss([tailwindcss(tmp)])
		const results = await Promise.all([
			processer.process(`@tailwind base;@tailwind components;`, { from: undefined }),
			processer.process(`@tailwind utilities;`, { from: undefined }),
			processerJIT.process(`@tailwind utilities;`, { from: undefined }),
		])

		twin = createTwin(
			config,
			{ result: results[0], source: "components" },
			{ result: results[1], source: "utilities" },
			{ result: results[2], source: "utilities" },
		)
	}

	function getColorNames(resloved: Tailwind.ResolvedConfigJS): string[] {
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

	async function jit(className: string) {
		className = className.replace(/\s/g, "")
		const tmp = { ...config }
		tmp.mode = "jit"
		tmp.separator = __INNER_TAILWIND_SEPARATOR__
		tmp.purge = { enabled: false, content: [], safelist: [className] }
		const processer = postcss([tailwindcss(tmp)])
		const results = await Promise.all([
			processer.process("@tailwind base;@tailwind components;", { from: undefined }),
			processer.process("@tailwind utilities;", { from: undefined }),
		])

		return createTwin(
			tmp,
			{ result: results[0], source: "components" },
			{ result: results[1], source: "utilities" },
		)
	}

	async function jitColor(className: string) {
		className = className.replace(/\s/g, "")
		const tmp = { ...config }
		tmp.mode = "jit"
		tmp.separator = __INNER_TAILWIND_SEPARATOR__
		tmp.purge = { enabled: false, content: [], safelist: [className] }
		const processer = postcss([tailwindcss(tmp)])
		const result = await processer.process("@tailwind utilities;", { from: undefined })
		return createTwin(tmp, { result, source: "utilities" })
	}

	/**
	 * get theme value.
	 *
	 * example: ```getTheme(["colors", "blue", "500"])```
	 * @param keys
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function getTheme(keys: string[], useDefault = false): any {
		if (!config) {
			return undefined
		}
		let value = dlv(config.theme, keys)
		if (useDefault && value?.["DEFAULT"] != undefined) {
			value = value["DEFAULT"]
		}
		return value
	}

	function getConfig(keys: string[]) {
		if (!config) {
			return undefined
		}
		return dlv(config, keys)
	}
}
