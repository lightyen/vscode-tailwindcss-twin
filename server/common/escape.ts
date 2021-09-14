/** escape css classname */
export function escape(value: string) {
	return value
		.replace(/[#|\\/{}()[\]<>^$+.*?=@,!`~"'&%;]/g, "\\$&")
		.replace(/^-\d/, "\\$&")
		.replace(/[ ]/g, "\\$&")
		.replace(/[\f\n\r\t\v]/g, match => {
			const hex = match.codePointAt(0)?.toString(16)
			if (hex) {
				return "\\0000".slice(0, 5 - hex.length) + hex
			}
			return ""
		})
		.replace(/:/g, "\\3A ")
		.replace(/^\d/, "\\3$& ")
}
