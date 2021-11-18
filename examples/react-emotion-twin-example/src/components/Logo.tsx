import "twin.macro"

export default function Logo() {
	return (
		<a
			tw="w-32 mb-10 p-5 block opacity-100 transition hover:opacity-60"
			href="https://github.com/ben-rogerson/twin.macro"
			target="_blank"
			rel="noopener noreferrer"
		>
			<Icon />
		</a>
	)
}

function Icon() {
	return (
		<svg fill="url(#lgrad)" viewBox="0 0 32 35" xmlns="http://www.w3.org/2000/svg">
			<defs>
				<linearGradient id="lgrad" x1="50%" y1="100%" x2="50%" y2="0%">
					<stop offset="0%" style={{ stopColor: "rgb(0,71,255)", stopOpacity: 1 }} />
					<stop offset="100%" style={{ stopColor: "rgb(0,255,255)", stopOpacity: 1 }} />
				</linearGradient>
			</defs>
			<path d="m31.839 11.667c0-6.2223-3.3515-10.111-10.054-11.667 3.3514 2.3333 4.6082 5.0556 3.7704 8.1667-0.4781 1.7751-1.8653 3.0438-3.4009 4.4481-2.5016 2.2877-5.3968 4.9354-5.3968 10.718 0 6.2223 3.3515 10.111 10.054 11.667-3.3515-2.3333-4.6083-5.0556-3.7704-8.1667 0.478-1.775 1.8653-3.0438 3.4009-4.4481 2.5015-2.2877 5.3967-4.9354 5.3967-10.718z" />
			<path d="m-2.7803e-7 11.667c1.4828e-7 -6.2223 3.3515-10.111 10.055-11.667-3.3515 2.3333-4.6083 5.0556-3.7705 8.1667 0.47806 1.7751 1.8653 3.0438 3.4009 4.4481 2.5016 2.2877 5.3968 4.9354 5.3968 10.718 0 6.2223-3.3515 10.111-10.054 11.667 3.3515-2.3333 4.6083-5.0556 3.7704-8.1667-0.47805-1.775-1.8653-3.0438-3.4009-4.4481-2.5015-2.2877-5.3967-4.9354-5.3967-10.718z" />
		</svg>
	)
}
