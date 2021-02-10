export default function toKebab(str: string) {
	return str.replace(/\B[A-Z][a-z]*/g, value => "-" + value.toLowerCase())
}
