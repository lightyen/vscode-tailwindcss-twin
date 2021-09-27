const units = ["em", "rem", "ex", "px", "cm", "mm", "in", "pt", "pc", "ch", "vw", "vh", "vmin", "vmax"]

export default function isLengthValue(value: string) {
	const match = /^([-+]?[0-9]*\.?[0-9]+)(.*)$/.exec(value)
	if (match == null) {
		return false
	}
	const [, , unit] = match
	return units.indexOf(unit) !== -1
}
