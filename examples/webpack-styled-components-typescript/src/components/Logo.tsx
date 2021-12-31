import "twin.macro"
import LogoIcon from "~/assets/logo.svg"

export function Logo() {
	return (
		<a
			tw="w-32 mb-10 p-5 block opacity-100 transition hover:opacity-60"
			href="https://github.com/ben-rogerson/twin.macro"
			target="_blank"
			rel="noopener noreferrer"
		>
			<LogoIcon />
		</a>
	)
}
