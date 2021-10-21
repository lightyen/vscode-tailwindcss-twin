import { importFrom } from "@/module"
import { SuggestionResult } from "@/twin-parser"
import Fuse from "fuse.js"
import { CompletionItemKind } from "vscode"
import { URI } from "vscode-uri"
import { ICompletionItem } from "~/typings/completion"
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

/**
 * Completion item tags are extra annotations that tweak the rendering of a completion
 * item.
 */
export enum CompletionItemTag {
	/**
	 * Render a completion as obsolete, usually using a strike-out.
	 */
	Deprecated = 1,
}

export function createTailwindLoader(configPath: URI, extensionUri: URI, extensionMode: ExtensionMode) {
	const postcss = importFrom("postcss", { base: extensionUri.fsPath })
	const {
		applyStateToMarker,
		updateLastClasses,
		updateAllClasses,
		transformAllSelectors,
		transformAllClasses,
		transformLastClasses,
	}: Tailwind.pluginUtils = importFrom("tailwindcss/lib/util/pluginUtils", { base: extensionUri.fsPath })
	const prefixSelector: Tailwind.prefixSelector = importFrom("tailwindcss/lib/util/prefixSelector", {
		base: extensionUri.fsPath,
	})
	const plugin: Tailwind.createPlugin = importFrom("tailwindcss/plugin", { base: extensionUri.fsPath })
	const resolveConfig: Tailwind.resolveConfig = importFrom("tailwindcss/resolveConfig", {
		base: extensionUri.fsPath,
	})

	let utilitiesCompletionItems: ICompletionItem[] | undefined

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
	let variants: Fuse<string>
	let classnames: Fuse<string>

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
		get variants() {
			return variants
		},
		get classnames() {
			return classnames
		},
		readTailwindConfig,
		createContext,
		provideUtilities: createUtilitiesCompletionItemsProvider(),
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
			cache: false,
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
		utilitiesCompletionItems = undefined
		variants = new Fuse(tw.variants.flat(), { includeScore: true })
		classnames = new Fuse(tw.classnames, { includeScore: true })
	}

	function createUtilitiesCompletionItemsProvider() {
		return (suggestion: SuggestionResult): ICompletionItem[] => {
			if (utilitiesCompletionItems != undefined) {
				for (let i = 0; i < utilitiesCompletionItems.length; i++) {
					utilitiesCompletionItems[i].range = undefined
				}
				return utilitiesCompletionItems
			}

			utilitiesCompletionItems = tw.classnames.map(value => {
				const item: ICompletionItem = {
					label: value,
					data: { type: "utility" },
					kind: CompletionItemKind.Constant,
					sortText: (value.startsWith("-") ? "~~" : "~") + formatLabel(value),
				}

				const colorDesc = tw.getColorDesc(value)
				if (colorDesc) {
					item.kind = CompletionItemKind.Color
					item.data = { type: "color" }

					if (value.endsWith("-transparent")) {
						item.documentation = "rgba(0, 0, 0, 0.0)"
						return item
					}
					if (value.endsWith("-current")) {
						return item
					}
					if (value.endsWith("-inherit")) {
						return item
					}
					item.documentation = colorDesc.backgroundColor || colorDesc.color || colorDesc.borderColor
				}

				return item
			})

			return utilitiesCompletionItems

			function formatLabel(label: string) {
				const reg = /((?:[\w-]+-)+)+([\d/.]+)/
				const m = label.match(reg)
				if (!m) {
					return label
				}
				try {
					const val = eval(m[2])
					if (typeof val !== "number") {
						return label
					}
					const prefix = m[1] + (/^[\d.]+$/.test(m[2]) ? "@" : "_")
					return prefix + val.toFixed(3).padStart(7, "0")
				} catch {
					return label
				}
			}
		}
	}
}
