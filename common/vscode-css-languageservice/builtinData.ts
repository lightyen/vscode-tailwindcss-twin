import {
	basicShapeFunctions as _basicShapeFunctions,
	boxKeywords as _boxKeywords,
	colorKeywords as _colorKeywords,
	colors as _colors,
	cssWideKeywords as _cssWideKeywords,
	geometryBoxKeywords as _geometryBoxKeywords,
	html5Tags as _html5Tags,
	imageFunctions as _imageFunctions,
	lineStyleKeywords as _lineStyleKeywords,
	lineWidthKeywords as _lineWidthKeywords,
	pageBoxDirectives as _pageBoxDirectives,
	positionKeywords as _positionKeywords,
	repeatStyleKeywords as _repeatStyleKeywords,
	svgElements as _svgElements,
	transitionTimingFunctions as _transitionTimingFunctions,
	units as _units,
	// @ts-ignore TS/7016
} from "vscode-css-languageservice/lib/esm/languageFacts/facts"

export const colors = _colors as Record<string, string>
export const colorKeywords = _colorKeywords as Record<string, string>
export const positionKeywords = _positionKeywords as Record<string, string>
export const repeatStyleKeywords = _repeatStyleKeywords as Record<string, string>
export const lineStyleKeywords = _lineStyleKeywords as Record<string, string>
export const lineWidthKeywords = _lineWidthKeywords as string[]
export const boxKeywords = _boxKeywords as Record<string, string>
export const geometryBoxKeywords = _geometryBoxKeywords as Record<string, string>
export const cssWideKeywords = _cssWideKeywords as Record<string, string>
export const imageFunctions = _imageFunctions as Record<string, string>
export const transitionTimingFunctions = _transitionTimingFunctions as Record<string, string>
export const basicShapeFunctions = _basicShapeFunctions as Record<string, string>
export const units = _units as Record<string, string[]>
export const html5Tags = _html5Tags as string[]
export const svgElements = _svgElements as string[]
export const pageBoxDirectives = _pageBoxDirectives as string[]

export const colorFunctions = [
	{ func: "rgb($red, $green, $blue)", desc: "Creates a Color from red, green, and blue values." },
	{ func: "rgba($red, $green, $blue, $alpha)", desc: "Creates a Color from red, green, blue, and alpha values." },
	{ func: "hsl($hue, $saturation, $lightness)", desc: "Creates a Color from hue, saturation, and lightness values." },
	{
		func: "hsla($hue, $saturation, $lightness, $alpha)",
		desc: "Creates a Color from hue, saturation, lightness, and alpha values.",
	},
]
