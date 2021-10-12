export enum CodeKind {
	CSS = "css",
	SCSS = "scss",
}

export function createFencedCodeBlock(code: string, kind: CodeKind, beginNewLine = false) {
	switch (kind) {
		case CodeKind.CSS:
			return "```css" + (beginNewLine ? "\n\n" : "\n") + code + "\n```"
		case CodeKind.SCSS:
			return "```scss" + (beginNewLine ? "\n\n" : "\n") + code + "\n```"
	}
}
