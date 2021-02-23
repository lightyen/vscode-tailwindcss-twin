import "twin.macro"
import styledComponent from "@emotion/styled"
import { css as cssProperty } from "@emotion/react"

declare module "twin.macro" {
	const css: typeof cssProperty
	const styled: typeof styledComponent
}

declare module "react" {
	interface DOMAttributes {
		/**
		 * short css property
		 *
		 * **twin.macro**
		 */
		cs?: string

		/**
		 * tw property
		 *
		 * **twin.macro**
		 */
		tw?: string
	}
}
