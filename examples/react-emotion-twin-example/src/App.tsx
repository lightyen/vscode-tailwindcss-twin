import { Global, ThemeProvider } from "@emotion/react"
import FiraCodeFont from "assets/fonts/FiraCode-Regular.woff2"
import tw, { css, GlobalStyles, screen } from "twin.macro"
import Button from "./components/Button"
import Logo from "./components/Logo"

const globalStyle = css`
	@font-face {
		font-family: Fira Code;
		src: local("Fira Code"), url(${FiraCodeFont}) format("woff2");
	}
	body {
		${tw`m-0 leading-normal overflow-hidden fill-current bg-gray-900 font-sans`}
	}
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

const StyledButton = tw(BaseButton)`
py-2 rounded-3xl ring-4 transition ring-offset-2
bg-red-700/70 text-white ring-offset-gray-500
hover:(bg-red-500 ring-offset-red-400/50)`

export default function App() {
	return (
		<>
			<GlobalStyles />
			<Global styles={globalStyle} />
			<ThemeProvider theme={{ colors: { primary: "#abcaca9f" } }}>
				<div
					css={[
						tw`flex flex-col items-center justify-center h-screen`,
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
