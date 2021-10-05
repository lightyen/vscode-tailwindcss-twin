import { URI } from "vscode-uri"
import { importFrom } from "~/common/module"
import { createTwContext, TwContext } from "./tw"
import { ContextModule, twin } from "./twin"

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
	const postcss = importFrom("postcss", { cache: true, base: extensionUri.fsPath })
	const {
		applyStateToMarker,
		updateLastClasses,
		updateAllClasses,
		transformAllSelectors,
		transformAllClasses,
		transformLastClasses,
	} = importFrom("tailwindcss/lib/util/pluginUtils", {
		cache: true,
		base: extensionUri.fsPath,
	})
	const prefixSelector = importFrom("tailwindcss/lib/util/prefixSelector", { cache: true, base: extensionUri.fsPath })
	const plugin = importFrom("tailwindcss/plugin", {
		cache: true,
		base: extensionUri.fsPath,
	})
	const resolveConfig: Tailwind.resolveConfig = importFrom("tailwindcss/resolveConfig", {
		cache: true,
		base: extensionUri.fsPath,
	})

	const context: ContextModule = {
		plugin,
		postcss,
		prefixSelector,
		applyStateToMarker,
		updateLastClasses,
		updateAllClasses,
		transformAllSelectors,
		transformAllClasses,
		transformLastClasses,
	}

	let config: Tailwind.ResolvedConfigJS
	let tw: TwContext

	return {
		get separator() {
			return config.separator
		},
		get tw() {
			return tw
		},
		get config() {
			return config
		},
		readTailwindConfig,
		createContext,
	}

	function preprocessConfig(config: Tailwind.ConfigJS): Tailwind.ConfigJS {
		const cfg = { ...config } as Tailwind.ConfigJS
		delete cfg.content
		delete cfg.purge
		delete cfg.safelist
		delete cfg.important
		if (cfg.darkMode !== "media" && cfg.darkMode !== "class") cfg.darkMode = "media"
		cfg.separator = ":"
		return cfg
	}

	function readTailwindConfig() {
		const moduleName = configPath.fsPath
		let __config = importFrom(moduleName, {
			header:
				extensionMode === ExtensionMode.Development
					? "process.env.NODE_ENV = 'development';\n"
					: "process.env.NODE_ENV = 'production';\n",
		}) as Tailwind.ConfigJS

		if (__config) {
			__config = preprocessConfig(__config)
			config = resolveConfig(__config, twin(context))
		}
	}

	function createContext() {
		tw = createTwContext(config, extensionUri)
	}
}
