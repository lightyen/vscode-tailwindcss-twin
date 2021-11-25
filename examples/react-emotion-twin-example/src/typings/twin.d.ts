// eslint-disable-next-line spaced-comment
/// <reference types="@emotion/react/types/css-prop" />

declare module "twin.macro" {
	// TODO: Custom theme
	declare module "@emotion/react" {
		export interface Theme {
			colors: {
				primary: string
			}
		}
	}

	declare module "react" {
		interface Attributes {
			/** **twin.macro** */
			tw?: string

			/**
			 * **twin.macro**
			 * @deprecated useless
			 */
			cs?: string
		}
	}

	import { CSSObject, Theme } from "@emotion/react"
	import { CSSInterpolation } from "@emotion/serialize"
	import { CreateStyled, StyledComponent } from "@emotion/styled"
	import { ReactElement } from "react"
	export const styled: CreateStyled
	export { css, keyframes } from "@emotion/react"

	interface CreateStyledComponent<
		ComponentProps extends {},
		SpecificComponentProps extends {} = {},
		JSXProps extends {} = {},
	> {
		<AdditionalProps extends {} = {}>(arr: TemplateStringsArray): StyledComponent<
			ComponentProps & AdditionalProps,
			SpecificComponentProps,
			JSXProps
		>
	}

	type StyledTags = {
		[Tag in keyof JSX.IntrinsicElements]: CreateStyledComponent<
			{
				theme?: Theme
				as?: React.ElementType
			},
			JSX.IntrinsicElements[Tag]
		>
	}

	interface Tw {
		(arr: TemplateStringsArray): CSSObject
	}

	interface TwComponentWrapper {
		<ComponentProps extends {}>(component: React.ComponentType<ComponentProps>): CreateStyledComponent<
			ComponentProps & {
				theme?: Theme
				as?: React.ElementType
			}
		>
		<Tag extends keyof JSX.IntrinsicElements>(tag: Tag): CreateStyledComponent<
			{
				theme?: Theme
				as?: React.ElementType
			},
			JSX.IntrinsicElements[Tag]
		>
	}

	const tw: Tw & StyledTags & TwComponentWrapper
	export default tw

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

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export function theme(arr: TemplateStringsArray): any

	/** @deprecated NOT recommended. */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export function theme(str: string): any

	export function GlobalStyles(): ReactElement
}
