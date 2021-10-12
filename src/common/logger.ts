enum LogLevel {
	None,
	Error,
	Warning,
	Info,
	Debug,
	Trace,
}

export type LogLevelString = "none" | "error" | "warning" | "info" | "debug" | "trace"
import { format } from "util"
import type { OutputChannel } from "vscode"

interface Options {
	logLevel: LogLevel | LogLevelString
	colors?: boolean
	getPrefix?(): string
	outputChannel?: OutputChannel
}

export interface Logger {
	error(...args: unknown[]): void
	warn(...args: unknown[]): void
	info(...args: unknown[]): void
	debug(...args: unknown[]): void
	trace(...args: unknown[]): void
	/** @deprecated */
	log(...args: unknown[]): void
	set level(level: LogLevelString)
	get level(): LogLevelString
	set outputChannel(ch: OutputChannel)
	set outputMode(mode: "debugConsole" | "outputChannel" | "all")
}

const Reset = "\x1b[0m"
const FgRed = "\x1b[31m"
const FgYellow = "\x1b[33m"
const FgBlue = "\x1b[34m"
const FgCyan = "\x1b[36m"
const FgMagenta = "\x1b[35m"

export function createLogger({
	logLevel = LogLevel.Info,
	colors = true,
	getPrefix = () => `[${new Date().toLocaleString()}]`,
	outputChannel: _outputChannel,
}: Partial<Options> = {}): Logger {
	let _mode: "debugConsole" | "outputChannel" | "all" = "outputChannel"
	if (typeof logLevel === "string") {
		switch (logLevel) {
			case "none":
				logLevel = LogLevel.None
				break
			case "error":
				logLevel = LogLevel.Error
				break
			case "warning":
				logLevel = LogLevel.Warning
				break
			case "info":
				logLevel = LogLevel.Info
				break
			case "debug":
				logLevel = LogLevel.Debug
				break
			case "trace":
				logLevel = LogLevel.Trace
				break
		}
	}

	return {
		error: (...args: unknown[]) => log(LogLevel.Error, args),
		warn: (...args: unknown[]) => log(LogLevel.Warning, args),
		info: (...args: unknown[]) => log(LogLevel.Info, args),
		debug: (...args: unknown[]) => log(LogLevel.Debug, args),
		trace: (...args: unknown[]) => log(LogLevel.Trace, args),
		log: (...args: unknown[]) => log(LogLevel.Info, args),
		set outputChannel(ch: OutputChannel) {
			_outputChannel = ch
		},
		set outputMode(mode: "debugConsole" | "outputChannel" | "all") {
			_mode = mode
		},
		set level(level: LogLevelString) {
			switch (level) {
				case "none":
					logLevel = LogLevel.None
					break
				case "error":
					logLevel = LogLevel.Error
					break
				case "warning":
					logLevel = LogLevel.Warning
					break
				case "info":
					logLevel = LogLevel.Info
					break
				case "debug":
					logLevel = LogLevel.Debug
					break
				case "trace":
					logLevel = LogLevel.Trace
					break
			}
		},
		get level() {
			switch (logLevel) {
				case LogLevel.None:
					return "none"
				case LogLevel.Error:
					return "error"
				case LogLevel.Warning:
					return "warning"
				case LogLevel.Info:
					return "info"
				case LogLevel.Debug:
					return "debug"
				case LogLevel.Trace:
					return "trace"
				default:
					return "none"
			}
		},
	}

	function log(level: LogLevel, args: unknown[]) {
		if (logLevel < level) {
			return
		}
		const prefix = getPrefix()
		if (prefix) {
			args.unshift(prefix)
		}
		if (_mode === "outputChannel" || _mode === "all") {
			_outputChannel?.appendLine(format(...args))
			if (_mode === "outputChannel") return
		}
		if (colors) {
			args = args.map(arg => {
				if (typeof arg === "string") return arg
				return format(arg)
			})
			switch (level) {
				case LogLevel.Error:
					args.unshift(FgRed)
					args.push(Reset)
					break
				case LogLevel.Warning:
					args.unshift(FgYellow)
					args.push(Reset)
					break
				case LogLevel.Info:
					args.unshift(FgBlue)
					args.push(Reset)
					break
				case LogLevel.Debug:
					args.unshift(FgCyan)
					args.push(Reset)
					break
				case LogLevel.Trace:
					args.unshift(FgMagenta)
					args.push(Reset)
					break
			}
		}
		switch (level) {
			case LogLevel.Error:
				console.error(...args)
				break
			case LogLevel.Warning:
				console.warn(...args)
				break
			case LogLevel.Info:
				console.info(...args)
				break
			case LogLevel.Debug:
				console.log(...args)
				break
			case LogLevel.Trace:
				console.log(...args)
				break
		}
	}
}

export const defaultLogger = createLogger()
