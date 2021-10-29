// eslint-disable-next-line spaced-comment
/// <reference types="@emotion/react/types/css-prop" />

import "@emotion/react"

declare module "@emotion/react" {
	export interface Theme {
		colors: {
			primary: string
		}
	}
}
