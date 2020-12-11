import { Connection } from "vscode-languageserver"
import { serializeError } from "serialize-error"
import { processTailwindConfig } from "./config"

import type { ConfigPath } from "./config"
export type { ConfigPath }
export type { CSSRuleItem } from "./classnames"

/* eslint-disable @typescript-eslint/no-explicit-any */
type Unwrap<T> = T extends Promise<infer U>
	? U
	: T extends (...args: any) => Promise<infer U>
	? U
	: T extends (...args: any) => infer U
	? U
	: T
/* eslint-enable @typescript-eslint/no-explicit-any */

export let state: Unwrap<typeof processTailwindConfig>

export async function init(connection: Connection, params: Parameters<typeof processTailwindConfig>[0]) {
	interface ProgressParam {
		increment: number
		message: string
	}
	try {
		connection.sendNotification("tailwindcss/loading")
		state = await processTailwindConfig(params)
		connection.sendProgress<ProgressParam>({}, "tailwindcss/progress", { increment: 100, message: "Done." })
	} catch (err) {
		state = null
		connection.sendProgress<number>({}, "tailwindcss/progress", undefined)
		const e = serializeError(err)
		e.showNotification = true
		connection.sendNotification("tailwindcss/error", e)
	}
}
