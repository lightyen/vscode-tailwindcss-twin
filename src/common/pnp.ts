import type { PnpApi } from "@yarnpkg/pnp"
import fs from "fs"
import Module from "module"
import path from "path"
import { fileURLToPath, URL } from "url"
export interface PackageLocator {
	name: string
	reference: string
}

export interface PackageInformation {
	packageLocation: string
	packageDependencies: Map<string, null | string | [string, string]>
	packagePeers: Set<string>
	linkType: "HARD" | "SOFT"
}

export function findPnpApi(lookupSource: URL | string):
	| (PnpApi & {
			setup: () => void
	  })
	| undefined {
	const lookupPath = lookupSource instanceof URL ? fileURLToPath(lookupSource) : lookupSource
	return findContext(lookupPath)

	function findContext(workspace: string):
		| (PnpApi & {
				setup: () => void
		  })
		| undefined {
		try {
			let pnpPath = path.resolve(workspace, ".pnp")

			if (
				!path.isAbsolute(pnpPath) &&
				!pnpPath.startsWith("." + path.sep) &&
				!pnpPath.startsWith(".." + path.sep)
			) {
				pnpPath = "." + path.sep + pnpPath
			}

			if (isExist(pnpPath + ".cjs")) pnpPath += ".cjs"
			else if (isExist(pnpPath + ".js")) pnpPath += ".js"

			// @ts-ignore TS/7016
			const filename = Module["_resolveFilename"](pnpPath, { paths: Module["_nodeModulePaths"](workspace) })
			const module = new Module("")
			return module.require(filename)
		} catch {}

		return undefined
	}
}

export function isExist(filename: string) {
	try {
		fs.accessSync(filename)
		return true
	} catch {
		return false
	}
}
