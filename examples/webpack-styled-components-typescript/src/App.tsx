import CascadiaCode from "assets/fonts/CascadiaCode.ttf"
import CascadiaCodeItalic from "assets/fonts/CascadiaCodeItalic.ttf"
import { useRef } from "react"
import { createGlobalStyle, ThemeProvider } from "styled-components/macro"
import tw, { css, GlobalStyles } from "twin.macro"
import { v4 } from "uuid"
import { Button } from "./components/Button"
import { Logo } from "./components/Logo"
import { Switch } from "./components/Switch"

const Cascadia = css`
	@font-face {
		font-family: "Cascadia Code";
		font-style: normal;
		font-display: swap;
		src: local("Cascadia Code"), url(${CascadiaCode}) format("opentype");
		unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074,
			U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
	}
	@font-face {
		font-family: "Cascadia Code";
		font-style: italic;
		font-display: swap;
		src: local("Cascadia Code"), url(${CascadiaCodeItalic}) format("opentype");
		unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074,
			U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
	}
`

const globalStyle = css`
	body {
		${tw`m-0 leading-normal overflow-hidden bg-gray-900 font-sans`}
	}
	button:-moz-focusring,
	[type="button"]:-moz-focusring,
	[type="reset"]:-moz-focusring,
	[type="submit"]:-moz-focusring {
		outline: none;
	}
`

const Global = createGlobalStyle`${Cascadia} ${globalStyle}`

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
			<Global />
			<ThemeProvider theme={{ colors: { primary: "#abcaca9f" } }}>
				<div
					css={[
						tw`flex flex-col items-center justify-center h-screen`,
						tw`bg-gradient-to-b from-blue-900 to-blue-400`,
					]}
				>
					<svg />
					<div css={[]} tw="flex flex-col justify-center h-full space-y-5">
						<Button isPrimary>Submit</Button>
						<Button isSecondary>Cancel</Button>
						<Button isSmall>Close</Button>
						<StyledButton>Styled</StyledButton>
						<Control />
					</div>
					<Logo />
				</div>
			</ThemeProvider>
		</>
	)
}

function Control() {
	const idRef = useRef(v4())
	return (
		<div tw="flex items-center justify-between">
			<label htmlFor={idRef.current} tw="select-none text-white font-bold mr-3">
				Enabled
			</label>
			<Switch id={idRef.current} />
		</div>
	)
}
