// https://github.com/Microsoft/vscode/issues/32813
export const ColorProps_Foreground = new Set<string>([])
export const ColorProps_Border = new Set<string>([])
export const ColorProps_Background = new Set<string>([
	"color",
	"outline-color",
	"border-color",
	"border-top-color",
	"border-right-color",
	"border-bottom-color",
	"border-left-color",
	"background-color",
	"text-decoration-color",
	"accent-color",
	"caret-color",
	"fill",
	"stroke",
	"stop-color",
	"column-rule-color",
	"--tw-ring-color",
	"--tw-ring-offset-color",
	"--tw-gradient-from",
	"--tw-gradient-to",
	"--tw-gradient-stops",
	"--tw-shadow-color",
])

export const ColorProps = new Set([...ColorProps_Foreground, ...ColorProps_Border, ...ColorProps_Background])

export const deprecated = new Map<string, string>([
	["content", "The utility 'content' is now deprecated, remove it."],
	["overflow-ellipsis", "The utility 'overflow-ellipsis' is now deprecated, replace it with 'text-ellipsis'."],
	["flex-grow", "The utility 'flex-grow' is now deprecated, replace it with 'grow'."],
	["flex-grow-0", "The utility 'flex-grow-0' is now deprecated, replace it with 'grow-0'."],
	["flex-shrink", "The utility 'flex-shrink' is now deprecated, replace it with 'shrink'."],
	["flex-shrink-0", "The utility 'flex-shrink-0' is now deprecated, replace it with 'shrink-0'."],
	["decoration-slice", "The utility 'decoration-slice' is now deprecated, replace it with 'box-decoration-slice'."],
	["decoration-clone", "The utility 'decoration-clone' is now deprecated, replace it with 'box-decoration-clone'."],
])
