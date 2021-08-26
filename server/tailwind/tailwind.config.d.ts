type Value = string | number
type ThemeFunc = (key: string) => string
type Style = Value | ((options: Options) => Value)
type Options = { opacityValue?: Value; opacityVariable?: Value }
type WithThemeFunc<T> = T | ((themeFunc: ThemeFunc, theme: unknown) => T)
type CSSProp = WithThemeFunc<Record<Value, Value>>
type ColorProp = Record<Value, Record<Value, Style>>

interface Theme {
	extend?: Theme
	fontSize?: Record<Value, [string, { lineHeight: Value }]>
	keyframes?: Record<Value, Record<Value, Value>>
	dropShadow?: Record<Value, Value | Value[]>
	fontFamily?: Record<Value, Value | Value[]>
	outline?: Record<Value, [string, string]>
	colors?: ColorProp
	backgroundColor?: ColorProp
	borderColor?: ColorProp
	caretColor?: ColorProp
	divideColor?: ColorProp
	gradientColorStops?: CSSProp
	placeholderColor?: CSSProp
	ringColor?: CSSProp
	ringOffsetColor?: CSSProp
	textColor?: CSSProp
	borderWidth?: CSSProp
	screens?: CSSProp
	spacing?: CSSProp
	animation?: CSSProp
	backdropBlur?: CSSProp
	backdropBrightness?: CSSProp
	backdropContrast?: CSSProp
	backdropGrayscale?: CSSProp
	backdropHueRotate?: CSSProp
	backdropInvert?: CSSProp
	backdropOpacity?: CSSProp
	backdropSaturate?: CSSProp
	backdropSepia?: CSSProp
	backgroundImage?: CSSProp
	backgroundOpacity?: CSSProp
	backgroundPosition?: CSSProp
	backgroundSize?: CSSProp
	blur?: CSSProp
	brightness?: CSSProp
	borderOpacity?: CSSProp
	borderRadius?: CSSProp
	boxShadow?: CSSProp
	contrast?: CSSProp
	container?: CSSProp
	content?: CSSProp
	cursor?: CSSProp
	divideOpacity?: CSSProp
	divideWidth?: CSSProp
	fill?: CSSProp
	grayscale?: CSSProp
	hueRotate?: CSSProp
	invert?: CSSProp
	flex?: CSSProp
	flexGrow?: CSSProp
	flexShrink?: CSSProp
	fontWeight?: CSSProp
	gap?: CSSProp
	gridAutoColumns?: CSSProp
	gridAutoRows?: CSSProp
	gridColumn?: CSSProp
	gridColumnEnd?: CSSProp
	gridColumnStart?: CSSProp
	gridRow?: CSSProp
	gridRowStart?: CSSProp
	gridRowEnd?: CSSProp
	gridTemplateColumns?: CSSProp
	gridTemplateRows?: CSSProp
	height?: CSSProp
	inset?: CSSProp
	letterSpacing?: CSSProp
	lineHeight?: CSSProp
	listStyleType?: CSSProp
	margin?: CSSProp
	maxHeight?: CSSProp
	maxWidth?: CSSProp
	minHeight?: CSSProp
	minWidth?: CSSProp
	objectPosition?: CSSProp
	opacity?: CSSProp
	order?: CSSProp
	padding?: CSSProp
	placeholderOpacity?: CSSProp
	ringOffsetWidth?: CSSProp
	ringOpacity?: CSSProp
	ringWidth?: CSSProp
	rotate?: CSSProp
	saturate?: CSSProp
	scale?: CSSProp
	sepia?: CSSProp
	skew?: CSSProp
	space?: CSSProp
	stroke?: CSSProp
	strokeWidth?: CSSProp
	textOpacity?: CSSProp
	transformOrigin?: CSSProp
	transitionDelay?: CSSProp
	transitionDuration?: CSSProp
	transitionProperty?: CSSProp
	transitionTimingFunction?: CSSProp
	translate?: CSSProp
	width?: CSSProp
	zIndex?: CSSProp
}

interface Variants {
	accessibility?: string[]
	alignContent?: string[]
	alignItems?: string[]
	alignSelf?: string[]
	animation?: string[]
	appearance?: string[]
	backdropBlur?: string[]
	backdropBrightness?: string[]
	backdropContrast?: string[]
	backdropFilter?: string[]
	backdropGrayscale?: string[]
	backdropHueRotate?: string[]
	backdropInvert?: string[]
	backdropOpacity?: string[]
	backdropSaturate?: string[]
	backdropSepia?: string[]
	backgroundAttachment?: string[]
	backgroundBlendMode?: string[]
	backgroundClip?: string[]
	backgroundColor?: string[]
	backgroundImage?: string[]
	backgroundOpacity?: string[]
	backgroundPosition?: string[]
	backgroundRepeat?: string[]
	backgroundSize?: string[]
	backgroundOrigin?: string[]
	blur?: string[]
	borderCollapse?: string[]
	borderColor?: string[]
	borderOpacity?: string[]
	borderRadius?: string[]
	borderStyle?: string[]
	borderWidth?: string[]
	boxDecorationBreak?: string[]
	boxShadow?: string[]
	boxSizing?: string[]
	brightness?: string[]
	clear?: string[]
	container?: string[]
	contrast?: string[]
	cursor?: string[]
	display?: string[]
	divideColor?: string[]
	divideOpacity?: string[]
	divideStyle?: string[]
	divideWidth?: string[]
	dropShadow?: string[]
	fill?: string[]
	filter?: string[]
	flex?: string[]
	flexDirection?: string[]
	flexGrow?: string[]
	flexShrink?: string[]
	flexWrap?: string[]
	float?: string[]
	fontFamily?: string[]
	fontSize?: string[]
	fontSmoothing?: string[]
	fontStyle?: string[]
	fontVariantNumeric?: string[]
	fontWeight?: string[]
	gap?: string[]
	gradientColorStops?: string[]
	grayscale?: string[]
	gridAutoColumns?: string[]
	gridAutoFlow?: string[]
	gridAutoRows?: string[]
	gridColumn?: string[]
	gridColumnEnd?: string[]
	gridColumnStart?: string[]
	gridRow?: string[]
	gridRowEnd?: string[]
	gridRowStart?: string[]
	gridTemplateColumns?: string[]
	gridTemplateRows?: string[]
	height?: string[]
	hueRotate?: string[]
	inset?: string[]
	invert?: string[]
	isolation?: string[]
	justifyContent?: string[]
	justifyItems?: string[]
	justifySelf?: string[]
	letterSpacing?: string[]
	lineHeight?: string[]
	listStylePosition?: string[]
	listStyleType?: string[]
	margin?: string[]
	maxHeight?: string[]
	maxWidth?: string[]
	minHeight?: string[]
	minWidth?: string[]
	mixBlendMode?: string[]
	objectFit?: string[]
	objectPosition?: string[]
	opacity?: string[]
	order?: string[]
	outline?: string[]
	overflow?: string[]
	overscrollBehavior?: string[]
	padding?: string[]
	placeContent?: string[]
	placeItems?: string[]
	placeSelf?: string[]
	placeholderColor?: string[]
	placeholderOpacity?: string[]
	pointerEvents?: string[]
	position?: string[]
	resize?: string[]
	ringColor?: string[]
	ringOffsetColor?: string[]
	ringOffsetWidth?: string[]
	ringOpacity?: string[]
	ringWidth?: string[]
	rotate?: string[]
	saturate?: string[]
	scale?: string[]
	sepia?: string[]
	skew?: string[]
	space?: string[]
	stroke?: string[]
	strokeWidth?: string[]
	tableLayout?: string[]
	textAlign?: string[]
	textColor?: string[]
	textDecoration?: string[]
	textOpacity?: string[]
	textOverflow?: string[]
	textTransform?: string[]
	transform?: string[]
	transformOrigin?: string[]
	transitionDelay?: string[]
	transitionDuration?: string[]
	transitionProperty?: string[]
	transitionTimingFunction?: string[]
	translate?: string[]
	userSelect?: string[]
	verticalAlign?: string[]
	visibility?: string[]
	whitespace?: string[]
	width?: string[]
	wordBreak?: string[]
	zIndex?: string[]
	extend?: Variants
}

interface PluginOptions {
	addBase
	addComponents
	addUtilities
	addVariant
	config
	theme
	e(classname: string): string
	variants
	prefix
	postcss
	corePlugins
	matchUtilities
}

type Plugin = (pluginOptions: PluginOptions) => void

interface TailwindConfigJS {
	mode?: "jit" | "aot"
	separator?: string
	prefix?: string
	important?: boolean
	darkMode?: false | "media" | "class"
	purge?: {
		enabled?: boolean
		content: string[]
		safelist?: string[]
	}
	theme?: Theme
	variants?: Variants
	plugins?: Plugin[]
}
