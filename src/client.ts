import { deepStrictEqual } from "assert"
import { defaultLogger as console } from "co/logger"
import path from "path"
import vscode, { CodeAction } from "vscode"
import { URI, Utils } from "vscode-uri"
import { createTailwindLanguageService } from "./service"
import { IDiagnostic } from "./service/diagnostics"
import { SECTION_ID, Settings } from "./shared"
import { ICompletionItem } from "./typings/completion"

const DEFAULT_SUPPORT_LANGUAGES = ["javascript", "javascriptreact", "typescript", "typescriptreact"]

const triggerCharacters = [
	'"',
	"'",
	"`",
	" ",
	"(",
	":",
	"-",
	"/",
	".",
	"0",
	"1",
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9",
	"[",
]

const priority = [".ts", ".js", ".cjs"]

const prioritySorter = (a: URI, b: URI) => {
	if (a.toString().length === b.toString().length) {
		return priority.indexOf(Utils.extname(a)) - priority.indexOf(Utils.extname(b))
	}
	return b.toString().length - a.toString().length
}

function matchService(uri: string, services: Map<string, ReturnType<typeof createTailwindLanguageService>>) {
	const arr = Array.from(services)
		.filter(([workingDir]) => {
			const rel = path.relative(workingDir, uri)
			return !rel.startsWith("..")
		})
		.sort((a, b) => b[0].localeCompare(a[0]))
	return arr[0]?.[1]
}

export interface WorkspaceClient {
	dispose(): void
}

export async function workspaceClient(
	context: vscode.ExtensionContext,
	ws: vscode.WorkspaceFolder,
): Promise<WorkspaceClient> {
	const disposes: vscode.Disposable[] = []
	const services: Map<string, ReturnType<typeof createTailwindLanguageService>> = new Map()
	const configFolders: Map<string, URI[]> = new Map()
	const extensionUri = context.extensionUri
	const serverSourceMapUri = Utils.joinPath(context.extensionUri, "dist", "extension.js.map")
	const workspaceFolder = ws.uri
	const extensionMode = context.extensionMode
	const tailwindConfigs = await vscode.workspace.findFiles(
		new vscode.RelativePattern(ws, "**/{tailwind,tailwind.config}.{ts,js,cjs}"),
		new vscode.RelativePattern(ws, "**/{node_modules/,.yarn/}*"),
	)
	let defaultServiceRunning = false
	const workspaceConfiguration = vscode.workspace.getConfiguration("", ws)
	const settings = workspaceConfiguration.get<Settings>(SECTION_ID, {
		enabled: true,
		colorDecorators: "inherit",
		fallbackDefaultConfig: true,
		jsxPropImportChecking: true,
		logLevel: "info",
		preferVariantWithParentheses: false,
		references: true,
		rootFontSize: 16,
		diagnostics: {
			enabled: true,
			conflict: "strict",
			emptyClass: true,
			emptyCssProperty: true,
			emptyGroup: true,
		},
	})
	if (settings.colorDecorators === "inherit") {
		settings.colorDecorators = workspaceConfiguration.get("editor.colorDecorators") ? "on" : "off"
	}

	// backward compatibility
	if (typeof settings.rootFontSize === "boolean") {
		settings.rootFontSize = settings.rootFontSize ? 16 : 0
	}
	if (typeof settings.colorDecorators === "boolean") {
		settings.colorDecorators = settings.colorDecorators ? "on" : "off"
	}

	for (const configPath of tailwindConfigs) {
		addService(URI.parse(configPath.toString()), settings)
	}

	addDefaultService(settings)

	const collection = vscode.languages.createDiagnosticCollection("tw")

	function updateDiagnostics(document: vscode.TextDocument, diagnostics: readonly vscode.Diagnostic[] | undefined) {
		collection.delete(document.uri)
		collection.set(document.uri, diagnostics)
	}

	function renderToEditor(editor = vscode.window.activeTextEditor) {
		if (!editor) return
		const document = editor.document
		if (document.uri.scheme === "output") return
		if (document) {
			collection.clear()
			const srv = matchService(document.uri.toString(), services)
			if (!srv) return
			if (settings.colorDecorators === "on") srv.colorProvider.render(editor)
			if (settings.diagnostics.enabled) {
				updateDiagnostics(document, srv.provideDiagnostics(document))
			} else {
				updateDiagnostics(document, undefined)
			}
		}
	}

	function run() {
		vscode.workspace.textDocuments.forEach(document => {
			const srv = matchService(document.uri.toString(), services)
			if (srv) {
				srv.start()
				renderToEditor()
			}
		})
	}
	run()

	const completionItemProvider: vscode.CompletionItemProvider<ICompletionItem> = {
		provideCompletionItems(document, position, token, context) {
			return matchService(document.uri.toString(), services)?.completionItemProvider.provideCompletionItems(
				document,
				position,
				token,
				context,
			)
		},
		resolveCompletionItem(item, token) {
			return matchService(
				item.data.uri?.toString() ?? "",
				services,
			)?.completionItemProvider.resolveCompletionItem?.(item, token)
		},
	}

	const hoverProvider: vscode.HoverProvider = {
		provideHover(document, position, token) {
			return matchService(document.uri.toString(), services)?.hoverProvider.provideHover(
				document,
				position,
				token,
			)
		},
	}

	disposes.push(
		vscode.languages.registerCompletionItemProvider(
			DEFAULT_SUPPORT_LANGUAGES,
			completionItemProvider,
			...triggerCharacters,
		),
		vscode.languages.registerHoverProvider(DEFAULT_SUPPORT_LANGUAGES, hoverProvider),
		vscode.languages.registerCodeActionsProvider(DEFAULT_SUPPORT_LANGUAGES, {
			provideCodeActions(document, range, context, token) {
				const items = collection.get(document.uri)
				if (!items) return
				const actions: vscode.CodeAction[] = []
				for (let i = 0; i < items.length; i++) {
					const diagnostic = items[i] as IDiagnostic
					if (range.contains(diagnostic.range) && diagnostic.data) {
						const d = items[i] as IDiagnostic
						if (d.data) {
							range.contains(d.range)
							const { text, newText } = d.data
							const a = new CodeAction(
								`Replace '${text}' with '${newText}'`,
								vscode.CodeActionKind.QuickFix,
							)
							const edit = new vscode.WorkspaceEdit()
							edit.replace(document.uri, d.range, newText)
							a.edit = edit
							actions.push(a)
						}
					}
				}
				return actions
			},
		}),
		vscode.window.onDidChangeActiveTextEditor(editor => {
			if (vscode.window.activeTextEditor?.document.uri.scheme === "output") return
			if (editor === vscode.window.activeTextEditor) {
				renderToEditor()
			}
		}),
		vscode.workspace.onDidChangeTextDocument(event => {
			if (vscode.window.activeTextEditor?.document.uri.scheme === "output") return
			if (event.document === vscode.window.activeTextEditor?.document) {
				renderToEditor()
			}
		}),
		vscode.workspace.onDidChangeConfiguration(async event => {
			console.info(`[setting changes were detected]`)
			const workspaceConfiguration = vscode.workspace.getConfiguration("", ws)
			const extSettings = workspaceConfiguration.get(SECTION_ID) as Settings

			let needToUpdate = false
			let needToRenderColors = false
			let needToDiagnostics = false

			if (settings.logLevel !== extSettings.logLevel) {
				settings.logLevel = extSettings.logLevel
				needToUpdate = true
				console.info(`logLevel = ${settings.logLevel}`)
				console.level = settings.logLevel
			}

			if (settings.enabled !== extSettings.enabled) {
				settings.enabled = extSettings.enabled
				needToUpdate = true
				console.info(`enabled = ${settings.enabled}`)
			}

			if (settings.preferVariantWithParentheses !== extSettings.preferVariantWithParentheses) {
				settings.preferVariantWithParentheses = extSettings.preferVariantWithParentheses
				needToUpdate = true
				console.info(`preferVariantWithParentheses = ${settings.preferVariantWithParentheses}`)
			}

			if (settings.references !== extSettings.references) {
				settings.references = extSettings.references
				needToUpdate = true
				console.info(`references = ${settings.references}`)
			}

			if (settings.jsxPropImportChecking !== extSettings.jsxPropImportChecking) {
				settings.jsxPropImportChecking = extSettings.jsxPropImportChecking
				needToUpdate = true
				console.info(`jsxPropImportChecking = ${settings.jsxPropImportChecking}`)
			}

			// backward compatibility
			if (typeof extSettings.rootFontSize === "boolean") {
				extSettings.rootFontSize = extSettings.rootFontSize ? 16 : 0
			}
			if (settings.rootFontSize !== extSettings.rootFontSize) {
				settings.rootFontSize = extSettings.rootFontSize
				needToUpdate = true
				console.info(`rootFontSize = ${settings.rootFontSize}`)
			}

			// backward compatibility
			if (typeof extSettings.colorDecorators === "boolean") {
				extSettings.colorDecorators = extSettings.colorDecorators ? "on" : "off"
			}
			if (extSettings.colorDecorators === "inherit") {
				const editorColorDecorators = vscode.workspace
					.getConfiguration("editor")
					.get("colorDecorators") as boolean
				extSettings.colorDecorators = editorColorDecorators ? "on" : "off"
			}
			if (settings.colorDecorators !== extSettings.colorDecorators) {
				settings.colorDecorators = extSettings.colorDecorators
				needToUpdate = true
				needToRenderColors = true
				console.info(`codeDecorators = ${settings.colorDecorators}`)
			}

			if (settings.fallbackDefaultConfig !== extSettings.fallbackDefaultConfig) {
				settings.fallbackDefaultConfig = extSettings.fallbackDefaultConfig
				console.info(`fallbackDefaultConfig = ${settings.fallbackDefaultConfig}`)
			}

			try {
				deepStrictEqual(settings.diagnostics, extSettings.diagnostics)
			} catch {
				settings.diagnostics = extSettings.diagnostics
				needToUpdate = true
				needToDiagnostics = true
				console.info(`diagnostics = ${JSON.stringify(settings.diagnostics)}`)
			}

			if (needToUpdate) {
				for (const document of vscode.workspace.textDocuments) {
					const service = matchService(document.uri.toString(), services)
					if (service) {
						service.updateSettings(settings)
					}
				}
			}

			if (needToRenderColors) {
				await Promise.all(
					vscode.workspace.textDocuments.map(document => {
						if (!settings.colorDecorators) {
							const srv = matchService(document.uri.toString(), services)
							srv?.colorProvider.dispose()
							return
						}
					}),
				)
			}

			if (needToDiagnostics) {
				run()
			}
		}),
	)

	const watcher = vscode.workspace.createFileSystemWatcher(
		new vscode.RelativePattern(ws, "**/{tailwind,tailwind.config}.{ts,js,cjs}"),
	)
	disposes.push(
		watcher.onDidDelete(uri => {
			removeService(uri, settings, true)
		}),
		watcher.onDidCreate(uri => {
			addService(uri, settings, true)
		}),
		watcher.onDidChange(async uri => {
			reloadService(uri)
		}),
		watcher,
	)

	return {
		dispose() {
			disposes.forEach(obj => obj.dispose())
		},
	}

	function addDefaultService(settings: Settings, startNow = false) {
		if (!settings.fallbackDefaultConfig) {
			return
		}
		if (services.size > 0) {
			return
		}
		if (defaultServiceRunning) {
			console.info("Default service is ready.")
			return
		}

		const srv = createTailwindLanguageService({
			...settings,
			serverSourceMapUri,
			extensionUri,
			workspaceFolder,
			extensionMode,
		})
		services.set(ws.toString(), srv)
		if (startNow) srv.start()
		defaultServiceRunning = true
	}

	function addService(configPath: URI, settings: Settings, startNow = false) {
		if (defaultServiceRunning) {
			services.clear()
			defaultServiceRunning = false
		}

		const folder = Utils.dirname(configPath).toString()
		const set = configFolders.get(folder)
		if (!set) {
			configFolders.set(folder, [configPath])
		} else {
			configFolders.set(folder, [...set, configPath])
		}

		const key = Utils.dirname(configPath).toString()
		const srv = services.get(key)

		if (!srv) {
			const srv = createTailwindLanguageService({
				...settings,
				configPath,
				serverSourceMapUri,
				extensionUri,
				workspaceFolder,
				extensionMode,
			})
			services.set(key, srv)
			if (startNow) srv.start()
		} else {
			const ext = Utils.extname(configPath)
			const srvExt = Utils.extname(srv.configPath)
			if (priority.indexOf(ext) < priority.indexOf(srvExt)) {
				const s = createTailwindLanguageService({
					...settings,
					configPath,
					serverSourceMapUri,
					extensionUri,
					workspaceFolder,
					extensionMode,
				})
				console.info("remove:", path.relative(workspaceFolder.path, srv.configPath.path))
				services.delete(key)
				services.set(key, s)
				if (startNow) s.start()
			} else {
				console.info("abort:", path.relative(workspaceFolder.path, configPath.path))
			}
		}
	}

	function removeService(configPath: URI, settings: Settings, startNow = false) {
		const folder = Utils.dirname(configPath).toString()
		const srv = services.get(folder)
		if (srv && srv.configPath.toString() === configPath.toString()) {
			console.info("remove:", path.relative(workspaceFolder.path, srv.configPath.path))
			services.delete(folder)
			const set = configFolders.get(folder)
			if (set) {
				const index = set.findIndex(p => p.toString() === configPath.toString())
				if (index >= 0) {
					set.splice(index, 1)
					configFolders.set(folder, set)
				}
				if (set.length > 0) {
					const configPath = set.sort(prioritySorter)[0]
					const srv = createTailwindLanguageService({
						...settings,
						configPath,
						serverSourceMapUri,
						extensionUri,
						workspaceFolder,
						extensionMode,
					})
					services.set(folder, srv)
					if (startNow) srv.start()
				}
			}
		}

		if (services.size === 0) {
			addDefaultService(settings, true)
		}
	}

	function reloadService(configPath: URI) {
		const key = Utils.dirname(configPath).toString()
		const srv = services.get(key)
		if (srv && srv.configPath.toString() === configPath.toString()) {
			srv.reload()
		}
	}
}
