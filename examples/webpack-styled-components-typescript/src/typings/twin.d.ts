/// <reference types="styled-components/cssprop" />

declare module "twin.macro" {
	import {
		AnyStyledComponent,
		CSSObject,
		DefaultTheme,
		Interpolation,
		InterpolationFunction,
		StyledComponent,
		StyledComponentInnerAttrs,
		StyledComponentInnerComponent,
		StyledComponentInnerOtherProps,
		StyledComponentPropsWithRef,
		StyledConfig,
		StyledInterface,
		ThemedStyledProps,
	} from "styled-components"
	export { css } from "styled-components"

	declare module "react" {
		interface Attributes {
			/** **twin.macro** */
			tw?: string

			/**
			 * **twin.macro**
			 * @deprecated NOT recommended.
			 */
			cs?: string
		}
	}

	interface ThemedStyledFunctionBase<
		C extends keyof JSX.IntrinsicElements | React.ComponentType<any>,
		T extends object,
		O extends object = {},
		A extends keyof any = never,
	> {
		(first: TemplateStringsArray): StyledComponent<C, T, O, A>
		(
			first:
				| TemplateStringsArray
				| CSSObject
				| InterpolationFunction<ThemedStyledProps<StyledComponentPropsWithRef<C> & O, T>>,
		): StyledComponent<C, T, O, A>
		<U extends object>(
			first:
				| TemplateStringsArray
				| CSSObject
				| InterpolationFunction<ThemedStyledProps<StyledComponentPropsWithRef<C> & O & U, T>>,
		): StyledComponent<C, T, O & U, A>
	}

	type Attrs<P, A extends Partial<P>, T> = ((props: ThemedStyledProps<P, T>) => A) | A

	interface ThemedStyledFunction<
		C extends keyof JSX.IntrinsicElements | React.ComponentType<any>,
		T extends object,
		O extends object = {},
		A extends keyof any = never,
	> extends ThemedStyledFunctionBase<C, T, O, A> {
		attrs<
			U,
			NewA extends Partial<StyledComponentPropsWithRef<C> & U> & {
				[others: string]: any
			} = {},
		>(
			attrs: Attrs<StyledComponentPropsWithRef<C> & U, NewA, T>,
		): ThemedStyledFunction<C, T, O & NewA, A | keyof NewA>

		withConfig: <Props extends O = O>(
			config: StyledConfig<StyledComponentPropsWithRef<C> & Props>,
		) => ThemedStyledFunction<C, T, Props, A>
	}

	interface ThemedBaseStyledInterface<T extends object> {
		<C extends AnyStyledComponent>(component: C): ThemedStyledFunction<
			StyledComponentInnerComponent<C>,
			T,
			StyledComponentInnerOtherProps<C>,
			StyledComponentInnerAttrs<C>
		>
		<C extends keyof JSX.IntrinsicElements | React.ComponentType<any>>(component: C): ThemedStyledFunction<C, T>
	}

	type StyledTags<T extends object = DefaultTheme> = {
		[Tag in keyof JSX.IntrinsicElements]: ThemedStyledFunction<Tag, T>
	}

	interface Tw {
		(arr: TemplateStringsArray): CSSObject
	}

	type ThemedStyledInterface<T> = ThemedBaseStyledInterface<keyof T extends never ? any : T>

	const tw: Tw & StyledTags & ThemedStyledInterface<DefaultTheme>
	export default tw
	export declare const styled: StyledInterface

	/**
	 * **NOTE: `Screen as a key` is a bad style.**
	 *
	 * Use `screen` like this:
	 *
	 * ```tsx
	 * <div css={screen`sm`({ display: 'block', ...tw`inline` })} />
	 * ```
	 */
	export function screen(arr: TemplateStringsArray): (arg: Interpolation<{}>) => CSSObject

	/** @deprecated NOT recommended. */
	export function screen(str: string): (arg: Interpolation<{}>) => CSSObject

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export function theme(arr: TemplateStringsArray): any

	/** @deprecated NOT recommended. */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export function theme(str: string): any

	export function GlobalStyles(): React.ReactElement
}
