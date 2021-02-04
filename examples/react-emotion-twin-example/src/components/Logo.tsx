import "twin.macro"

import TwinSvg from "~/assets/logo.svg"

export default function Logo() {
	return (
		<a tw="mb-10 block" href="https://github.com/ben-rogerson/twin.macro" target="_blank" rel="noopener noreferrer">
			<TwinSvg tw="w-32 p-5 opacity-70 transition hover:opacity-100 fill-current" cs="color[#041b05]" />
		</a>
	)
}
