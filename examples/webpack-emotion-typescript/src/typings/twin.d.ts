// eslint-disable-next-line spaced-comment
/// <reference types="@emotion/react/types/css-prop" />

declare module "twin.macro" {
	import { CreateStyled } from "@emotion/styled"
	declare const styled: CreateStyled
	export { styled }
}

declare module "twin.macro" {
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

	import { CSSObject, PropsOf, Theme } from "@emotion/react"
	import { Interpolation } from "@emotion/serialize"
	import { StyledComponent, StyledOptions } from "@emotion/styled"
	import { FilteringStyledOptions } from "@emotion/styled/types/base"

	/**
	 * @typeparam ComponentProps  Props which will be included when withComponent is called
	 * @typeparam SpecificComponentProps  Props which will *not* be included when withComponent is called
	 */
	export interface CreateStyledComponent<
		ComponentProps extends {},
		SpecificComponentProps extends {} = {},
		JSXProps extends {} = {},
	> {
		/**
		 * @typeparam AdditionalProps  Additional props to add to your styled component
		 */
		<AdditionalProps extends {} = {}>(
			...styles: Array<
				Interpolation<ComponentProps & SpecificComponentProps & AdditionalProps & { theme: Theme }>
			>
		): StyledComponent<ComponentProps & AdditionalProps, SpecificComponentProps, JSXProps>

		(template: TemplateStringsArray): StyledComponent<ComponentProps, SpecificComponentProps, JSXProps>

		/**
		 * @typeparam AdditionalProps  Additional props to add to your styled component
		 */
		<AdditionalProps extends {}>(template: TemplateStringsArray): StyledComponent<
			ComponentProps & AdditionalProps,
			SpecificComponentProps,
			JSXProps
		>
	}

	export interface CreateStyled {
		/**
		 * @desc
		 * This function accepts a React component or tag ('div', 'a' etc).
		 *
		 * @example tw(MyComponent)`w-full`
		 * @example tw(MyComponent)(myComponentProps => ({ width: myComponentProps.width })
		 * @example tw('div')`w-full`
		 * @example tw('div')<Props>(props => ({ width: props.width })
		 */
		<
			C extends React.ComponentClass<React.ComponentProps<C>>,
			ForwardedProps extends keyof React.ComponentProps<C> = keyof React.ComponentProps<C>,
		>(
			component: C,
			options: FilteringStyledOptions<React.ComponentProps<C>, ForwardedProps>,
		): CreateStyledComponent<
			Pick<PropsOf<C>, ForwardedProps> & {
				theme?: Theme
			},
			{},
			{
				ref?: React.Ref<InstanceType<C>>
			}
		>

		/**
		 * @desc
		 * This function accepts a React component or tag ('div', 'a' etc).
		 *
		 * @example tw(MyComponent)`w-full`
		 * @example tw(MyComponent)(myComponentProps => ({ width: myComponentProps.width })
		 * @example tw('div')`w-full`
		 * @example tw('div')<Props>(props => ({ width: props.width })
		 */
		<C extends React.ComponentClass<React.ComponentProps<C>>>(
			component: C,
			options?: StyledOptions<React.ComponentProps<C>>,
		): CreateStyledComponent<
			PropsOf<C> & {
				theme?: Theme
			},
			{},
			{
				ref?: React.Ref<InstanceType<C>>
			}
		>

		/**
		 * @desc
		 * This function accepts a React component or tag ('div', 'a' etc).
		 *
		 * @example tw(MyComponent)`w-full`
		 * @example tw(MyComponent)(myComponentProps => ({ width: myComponentProps.width })
		 * @example tw('div')`w-full`
		 * @example tw('div')<Props>(props => ({ width: props.width })
		 */
		<
			C extends React.ComponentType<React.ComponentProps<C>>,
			ForwardedProps extends keyof React.ComponentProps<C> = keyof React.ComponentProps<C>,
		>(
			component: C,
			options: FilteringStyledOptions<React.ComponentProps<C>, ForwardedProps>,
		): CreateStyledComponent<
			Pick<PropsOf<C>, ForwardedProps> & {
				theme?: Theme
			}
		>

		/**
		 * @desc
		 * This function accepts a React component or tag ('div', 'a' etc).
		 *
		 * @example tw(MyComponent)`w-full`
		 * @example tw(MyComponent)(myComponentProps => ({ width: myComponentProps.width })
		 * @example tw('div')`w-full`
		 * @example tw('div')<Props>(props => ({ width: props.width })
		 */
		<C extends React.ComponentType<React.ComponentProps<C>>>(
			component: C,
			options?: StyledOptions<React.ComponentProps<C>>,
		): CreateStyledComponent<
			PropsOf<C> & {
				theme?: Theme
			}
		>

		/**
		 * @desc
		 * This function accepts a React component or tag ('div', 'a' etc).
		 *
		 * @example tw(MyComponent)`w-full`
		 * @example tw(MyComponent)(myComponentProps => ({ width: myComponentProps.width })
		 * @example tw('div')`w-full`
		 * @example tw('div')<Props>(props => ({ width: props.width })
		 */
		<
			Tag extends keyof JSX.IntrinsicElements,
			ForwardedProps extends keyof JSX.IntrinsicElements[Tag] = keyof JSX.IntrinsicElements[Tag],
		>(
			tag: Tag,
			options: FilteringStyledOptions<JSX.IntrinsicElements[Tag], ForwardedProps>,
		): CreateStyledComponent<
			{ theme?: Theme; as?: React.ElementType },
			Pick<JSX.IntrinsicElements[Tag], ForwardedProps>
		>

		/**
		 * @desc
		 * This function accepts a React component or tag ('div', 'a' etc).
		 *
		 * @example tw(MyComponent)`w-full`
		 * @example tw(MyComponent)(myComponentProps => ({ width: myComponentProps.width })
		 * @example tw('div')`w-full`
		 * @example tw('div')<Props>(props => ({ width: props.width })
		 */
		<Tag extends keyof JSX.IntrinsicElements>(
			tag: Tag,
			options?: StyledOptions<JSX.IntrinsicElements[Tag]>,
		): CreateStyledComponent<{ theme?: Theme; as?: React.ElementType }, JSX.IntrinsicElements[Tag]>
	}

	/** twin.macro */
	export type StyledTags = {
		[Tag in keyof JSX.IntrinsicElements]: CreateStyledComponent<
			{
				theme?: Theme
				as?: React.ElementType
			},
			JSX.IntrinsicElements[Tag]
		>
	}

	interface Tw extends StyledTags, CreateStyled {
		(arr: TemplateStringsArray): CSSObject
	}

	export { css, keyframes, styled } from "@emotion/react"
	/** twin.macro */
	declare const tw: Tw
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
	export function screen(arr: TemplateStringsArray): (arg: Interpolation) => CSSObject

	/** @deprecated NOT recommended. */
	export function screen(str: string): (arg: Interpolation) => CSSObject

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export function theme<T>(arr: TemplateStringsArray): any

	/** @deprecated NOT recommended. */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export function theme<T>(str: string): any

	export function GlobalStyles(): JSX.Element
}
