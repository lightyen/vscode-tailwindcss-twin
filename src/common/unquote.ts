export function unquote(value: string) {
	if (value.length < 2) return value
	const quote = value[0]
	if (quote !== value[value.length - 1]) return value
	if (quote != '"' && quote != "'") return value
	return value.slice(1, -1)
}
