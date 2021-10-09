import fs from "fs"
import { SourceMapConsumer } from "source-map"

export function transformSourceMap(serverSourceMapPath: string, stack: string): string {
	const consumer = new SourceMapConsumer(JSON.parse(fs.readFileSync(serverSourceMapPath, { encoding: "utf8" })))
	const escape = (value: string) => value.replace(/[/\\^$*+?.()|[\]{}]/g, "\\$&")
	if (serverSourceMapPath.endsWith(".map")) serverSourceMapPath = serverSourceMapPath.slice(0, -4)
	const regexp = new RegExp(`at (.*?)(\\()?(${escape(serverSourceMapPath)}:(\\d+):(\\d+))(\\))?`, "g")

	return stack.replace(regexp, (match, oldName, lb, oldSource, oldLine, oldColumn, rb) => {
		const { source, line, column } = consumer.originalPositionFor({
			line: parseInt(oldLine),
			column: parseInt(oldColumn),
		})

		if (lb || rb) {
			return `at ${oldName}(${source || oldSource}:${line || oldLine}:${column || oldColumn})`
		}

		return `at ${oldName}${source || oldSource}:${line || oldLine}:${column || oldColumn}`
	})
}
