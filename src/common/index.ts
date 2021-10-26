import crypto from "crypto"

export function md5(value: string) {
	return crypto.createHash("md5").update(value, "utf-8").digest("hex")
}

export function escapeRegexp(expression: string) {
	return expression.replace(/[/\\^$*+?.()|[\]{}]/g, "\\$&")
}

/** accept strings: `1/4` */
export function calcFraction(value: string): number {
	const i = value.indexOf("/")
	if (i === -1) return NaN
	const a = Number(value.slice(0, i))
	const b = Number(value.slice(i + 1))
	if (Number.isNaN(a) || Number.isNaN(b)) return NaN
	return a / b
}
