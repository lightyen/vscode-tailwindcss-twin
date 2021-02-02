export default function camel2kebab(str: string) {
	return str.replace(/\B[A-Z][a-z]*/g, value => "-" + value.toLowerCase())
}
