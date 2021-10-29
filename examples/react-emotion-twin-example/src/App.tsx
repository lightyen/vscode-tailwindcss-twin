import { Global, ThemeProvider } from "@emotion/react"
import FiraCodeFont from "assets/fonts/FiraCode-Regular.woff2"
import tw, { screen, css, GlobalStyles } from "twin.macro"

import Button from "./components/Button"
import Logo from "./components/Logo"

const globalStyle = css`
	@font-face {
		font-family: Fira Code;
		src: local("Fira Code"), url(${FiraCodeFont}) format("woff2");
	}
	body {
		${tw`m-0 leading-normal overflow-hidden fill-current bg-gray-900`}
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

export const screenHelper = <div css={screen`sm`({ fontSize: "52px" })} />

function BaseButton(props: JSX.IntrinsicElements["button"]) {
	return <button {...props} />
}

const StyledButton = tw(BaseButton)`bg-red-500 rounded-3xl ring-4 hover:ring-red-300/70`

// for React Fast Refresh, need a name here
export default function App() {
	return (
		<>
			<GlobalStyles />
			<Global styles={globalStyle} />
			<ThemeProvider theme={{ colors: { primary: "#abcaca9f" } }}>
				<div
					css={[
						tw`flex flex-col items-center justify-center h-screen font-family[Fira Code]`,
						tw`bg-gradient-to-b from-blue-900 to-blue-400`,
					]}
				>
					<svg />
					<div tw="flex flex-col justify-center h-full space-y-5">
						<Button isPrimary>Submit</Button>
						<Button isSecondary>Cancel</Button>
						<Button isSmall>Close</Button>
						<StyledButton>Styled</StyledButton>
					</div>
					<Logo />
				</div>
			</ThemeProvider>
		</>
	)
}
