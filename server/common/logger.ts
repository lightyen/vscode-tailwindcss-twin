enum LogLevel {
	None,
	Error,
	Warning,
	Info,
	Debug,
	Trace,
}

export type LogLevelString = "none" | "error" | "warning" | "info" | "debug" | "trace"

interface Options {
	logLevel: LogLevel | LogLevelString
	colors?: boolean
	getPrefix?(): string
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
}

const Reset = "\x1b[0m"
const FgRed = "\x1b[31m"
const FgYellow = "\x1b[33m"
const FgBlue = "\x1b[34m"
const FgCyan = "\x1b[36m"
const FgMagenta = "\x1b[35m"

export function createLogger({
	logLevel = LogLevel.Info,
	colors = false,
	getPrefix = () => `[${new Date().toLocaleString()}]`,
}: Partial<Options> = {}): Logger {
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
		if (colors) {
			args = args.map(a => {
				if (typeof a !== "string") return a
				switch (level) {
					case LogLevel.Error:
						return FgRed + a + Reset
					case LogLevel.Warning:
						return FgYellow + a + Reset
					case LogLevel.Info:
						return FgBlue + a + Reset
					case LogLevel.Debug:
						return FgCyan + a + Reset
					case LogLevel.Trace:
						return FgMagenta + a + Reset
				}
			})
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
