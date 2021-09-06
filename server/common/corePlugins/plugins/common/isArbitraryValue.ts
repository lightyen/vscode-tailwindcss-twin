export default function isArbitraryValue(value: string) {
	return value[0] === "[" && value.slice(-1) === "]"
}
