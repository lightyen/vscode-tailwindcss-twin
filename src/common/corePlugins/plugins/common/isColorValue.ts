import extractColors from "../../../extractColors"
export default function isColorValue(value: string) {
	if (value.startsWith("color:")) return true
	if (value === "currentColor" || value === "transparent" || value === "inherit") return true
	return extractColors(value).length > 0
}
