declare module "twin.macro" {
	import React from "react"

	export type TwStyle = Record<string, string | number | TwStyle>

	export interface TemplateFn<R> {
		(template: Readonly<TemplateStringsArray>): R
	}

	export type StyledTags = {
		[Tag in keyof JSX.IntrinsicElements]: TemplateFn<React.ComponentType<JSX.IntrinsicElements[Tag]>>
	}

	export interface AdditionalProps {}

	interface TwComponentWrapper {
		<ComponentProps extends {}>(component: React.ComponentType<ComponentProps>): TemplateFn<
			React.ComponentType<ComponentProps>
		>

		<Tag extends keyof JSX.IntrinsicElements>(tag: Tag): TemplateFn<
			React.ComponentType<AdditionalProps & JSX.IntrinsicElements[Tag]>
		>
	}

	export interface Tw extends StyledTags, TwComponentWrapper {
		(template: Readonly<TemplateStringsArray>): TwStyle
	}

	declare const tw: Tw
	export default tw

	declare module "react" {
		interface Attributes {
			/** twin.macro */
			tw?: string
			/** twin.macro */
			cs?: string
		}
	}

	export function GlobalStyles(): React.ReactElement

	export declare function theme(template: string | Readonly<TemplateStringsArray>): any

	export declare function screen<T = string>(
		screenValue: string | TemplateStringsArray,
	): (styles?: string | TemplateStringsArray | TwStyle | TwStyle[]) => T

	export declare const globalStyles: Record<string, unknown>
}
