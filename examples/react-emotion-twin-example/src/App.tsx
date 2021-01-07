import { Global } from "@emotion/react"
import FiraCodeFont from "assets/fonts/FiraCode-Regular.woff2"
import tw, { css, GlobalStyles } from "twin.macro"

import Button from "./components/Button"
import Logo from "./components/Logo"

const globalStyle = css`
	@font-face {
		font-family: Fira Code;
		src: local("Fira Code"), url(${FiraCodeFont}) format("woff2");
	}
	body {
		${tw`m-0 leading-normal overflow-hidden bg-gray-900`}
		font-family: Roboto, 微軟正黑體, Microsoft JhengHei, Helvetica Neue,
		Helvetica, Arial, PingFang TC, 黑體-繁, Heiti TC, 蘋果儷中黑,
		Apple LiGothic Medium, sans-serif;
	}
	/* ::selection {
		background: rgb(115, 80, 196);
		${tw`text-gray-100`}
	} */
	button:-moz-focusring,
	[type="button"]:-moz-focusring,
	[type="reset"]:-moz-focusring,
	[type="submit"]:-moz-focusring {
		outline: none;
	}
`

// for React Fast Refresh, need a name here
export default function App() {
	return (
		<>
			<GlobalStyles />
			<Global styles={globalStyle} />
			<div
				css={[
					tw`flex flex-col items-center justify-center h-screen`,
					tw`bg-gradient-to-b from-electric to-ribbon`,
				]}
			>
				<div tw="flex flex-col justify-center h-full space-y-5">
					<Button isPrimary>Submit</Button>
					<Button isSecondary>Cancel</Button>
					<Button isSmall>Close</Button>
				</div>
				<Logo />
			</div>
		</>
	)
}
