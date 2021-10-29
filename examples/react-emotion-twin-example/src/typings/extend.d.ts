// eslint-disable-next-line spaced-comment
/// <reference types="@emotion/react/types/css-prop" />

import "@emotion/react"
import { Theme } from "@emotion/react"
import { CSSInterpolation, CSSObject } from "@emotion/serialize"
import { CreateStyled } from "@emotion/styled"
import "twin.macro"

declare module "@emotion/react" {
	export interface Theme {
		colors: {
			primary: string
		}
	}
}

declare module "twin.macro" {
	export const styled: CreateStyled
	export { css } from "@emotion/react"
	export interface AdditionalProps {
		theme?: Theme
		as: React.ElementType
	}

	/**
	 * **NOTE: `Screen as a key` is a bad style.**
	 *
	 * Use `screen` like this:
	 *
	 * ```tsx
	 * <div css={screen`sm`({ display: 'block', ...tw`inline` })} />
	 * ```
	 */
	export function screen(arr: TemplateStringsArray): (arg: CSSInterpolation) => CSSObject

	/** @deprecated NOT recommended. */
	export function screen(str: string): (arg: CSSInterpolation) => CSSObject

	/** @deprecated NOT recommended. */
	export function theme(str: string): any
}
