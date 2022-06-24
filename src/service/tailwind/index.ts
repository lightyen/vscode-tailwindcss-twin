import { importFrom } from "@/module"
import { cssDataManager } from "@/vscode-css-languageservice"
import type { PnpApi } from "@yarnpkg/pnp"
import Fuse from "fuse.js"
import postcss from "postcss"
import defaultConfig from "tailwindcss/defaultConfig"
import plugin from "tailwindcss/plugin"
import resolveConfig from "tailwindcss/resolveConfig"
import * as vscode from "vscode"
import { URI } from "vscode-uri"
import { calcFraction } from "~/common"
import { Extractor, isExtrator } from "~/common/extractors"
import { ICompletionItem } from "~/typings/completion"
import { deprecated } from "./data"
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

export function createTailwindLoader(
	configPath: URI | undefined,
	extensionUri: URI,
	isDefaultConfig: boolean,
	extensionMode: ExtensionMode,
) {
	let classCompletionList: ICompletionItem[] | undefined
	let cssPropsCompletionList: ICompletionItem[] | undefined

	const context: ContextModule = {
		plugin,
		postcss,
	}

	let config: Tailwind.ResolvedConfigJS & { extrators?: Extractor[] }
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
		get extractors(): Extractor[] {
			return Array.isArray(config.extrators) ? config.extrators.filter(isExtrator) : []
		},
		readTailwindConfig,
		createContext,
		provideClassCompletionList,
		provideCssPropsCompletionList,
		isDeprecated,
	}

	function preprocessConfig(config: Tailwind.ConfigJS): Tailwind.ConfigJS {
		const cfg = { ...config } as Tailwind.ConfigJS
		delete cfg.content
		delete cfg.purge
		delete cfg.safelist
		delete cfg.important
		if (
			cfg.darkMode !== "media" &&
			cfg.darkMode !== "class" &&
			!(Array.isArray(cfg.darkMode) && cfg.darkMode[0] === "class" && typeof cfg.darkMode[1] === "string")
		) {
			cfg.darkMode = "media"
		}
		cfg.separator = ":"
		return cfg
	}

	function readTailwindConfig(pnp?: PnpApi) {
		let __config: Tailwind.ConfigJS
		if (configPath) {
			__config = importFrom(configPath.fsPath, {
				pnp: isDefaultConfig ? undefined : pnp,
				cache: false,
				header:
					extensionMode === ExtensionMode.Development
						? "process.env.NODE_ENV = 'development';\n"
						: "process.env.NODE_ENV = 'production';\n",
			}) as Tailwind.ConfigJS
		} else {
			__config = defaultConfig
		}

		if (__config) {
			__config = preprocessConfig(__config)
			config = resolveConfig(__config, twin(context))
		}
	}

	function createContext() {
		tw = createTwContext(config)
		classCompletionList = undefined
		variants = new Fuse(tw.variants.flat(), { includeScore: true })
		classnames = new Fuse(tw.classnames, { includeScore: true })
	}

	function formatLabel(label: string) {
		const reg = /([a-zA-Z-]+)([0-9/.]+)/
		const match = label.match(reg)
		if (!match) return label
		let val = Number(match[2])
		if (Number.isNaN(val)) val = calcFraction(match[2])
		if (Number.isNaN(val)) return label
		const prefix = match[1] + (Number.isNaN(Number(match[2])) ? "_" : "@")
		return prefix + val.toFixed(3).padStart(7, "0")
	}

	function provideClassCompletionList() {
		if (classCompletionList != undefined) {
			for (const item of classCompletionList) {
				item.range = undefined
				item.insertText = undefined
			}
			return classCompletionList
		}

		classCompletionList = tw.classnames.map(value => {
			const item: ICompletionItem = {
				label: value,
				data: { type: "utility" },
				kind: vscode.CompletionItemKind.Constant,
				sortText: (value.startsWith("-") ? "~~" : "~") + formatLabel(value),
			}

			const colorDesc = tw.getColorDesc(value)
			if (colorDesc) {
				item.kind = vscode.CompletionItemKind.Color
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

			if (isDeprecated(value)) {
				item.tags = [CompletionItemTag.Deprecated]
			}
			return item
		})
		return classCompletionList
	}

	function provideCssPropsCompletionList() {
		if (cssPropsCompletionList != undefined) {
			for (const item of cssPropsCompletionList) {
				item.range = undefined
				item.insertText = undefined
			}
			return cssPropsCompletionList
		}

		cssPropsCompletionList = cssDataManager
			.getProperties()
			.map<ICompletionItem>(entry => ({
				label: entry.name,
				sortText: "~~~~" + entry.name,
				kind: vscode.CompletionItemKind.Field,
				command: {
					title: "Suggest",
					command: "editor.action.triggerSuggest",
				},
				data: {
					type: "cssProp",
					entry,
				},
			}))
			.concat(
				Array.from(tw.variables).map(label => {
					const item: ICompletionItem = {
						label,
						data: { type: "cssProp" },
						sortText: "~~~~~" + label,
						kind: vscode.CompletionItemKind.Field,
						command: {
							title: "Suggest",
							command: "editor.action.triggerSuggest",
						},
						detail: "variable",
					}
					return item
				}),
			)

		return cssPropsCompletionList
	}

	function isDeprecated(label: string) {
		if (deprecated.has(label)) return true
		const name = tw.getPlugin(label)?.getName()
		if (name) {
			switch (name) {
				case "backgroundOpacity":
				case "borderOpacity":
				case "divideOpacity":
				case "placeholderOpacity":
				case "ringOpacity":
				case "textOpacity":
					return true
			}
		}
		return false
	}
}
