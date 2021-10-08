export default function isArbitraryValue(value: string) {
	return value.charCodeAt(0) === 91 && value.charCodeAt(value.length - 1) === 93
}
