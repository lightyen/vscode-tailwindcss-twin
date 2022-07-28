// https://utopia.fyi/type/calculator/?c=480,14,1.125,1300,16,1.125,10,3,&s=0.75%7C0.5%7C0.25,1.5%7C2%7C3%7C4%7C6,s-l

export default function utopia(config: Array<[string, number, number, number]>, rootFontSize = 16): Tailwind.Plugin {
	const fontSize: Record<string, Tailwind.FontSizeValue> = {}
	function variableName(minValue: number, maxValue: number) {
		return `--step-${minValue}〰️${maxValue}`.replace(/\./g, "_")
	}
	for (const [key, minValue, maxValue, lineHeight] of config) {
		fontSize[key] = [`var(${variableName(minValue, maxValue)})`, { lineHeight }]
	}
	const minWidth = 480
	const maxWidth = 1300
	return {
		config: {
			theme: {
				extend: {
					fontSize,
				},
			},
		},
		handler({ addBase }) {
			config.forEach(([, minValue, maxValue]) => {
				generateVariable(minValue, maxValue)
			})
			return
			function generateVariable(minValue: number, maxValue: number) {
				const style = {}
				style[variableName(minValue, maxValue)] = `clamp(${getStep(minValue, maxValue)})`
				addBase({ ":root": style })
				function getStep(minFontSize: number, maxFontSize: number) {
					const m = minFontSize / rootFontSize
					const n = maxFontSize / rootFontSize
					const a = (maxFontSize - minFontSize) / (maxWidth - minWidth)
					const c = minFontSize - minWidth * a
					return `${m}rem, ${c / rootFontSize}rem + ${100 * a}vw, ${n}rem`
				}
			}
		},
	}
}

export function fontSize(
	[mobileBaseSize, desktopBaseSize]: [number, number] = [14, 16],
): Array<[string, number, number, number]> {
	const ret: Array<[number, number, number]> = [[mobileBaseSize, desktopBaseSize, 1.5]]
	for (let i = 1; i <= 5; i++) {
		let [a, b] = ret[2 * (i - 1)]
		a += 2 ** i
		b += 2 ** i
		ret.push([a, b, lineHeight(b, desktopBaseSize - 2, desktopBaseSize)])
		a += 2 ** i
		b += 2 ** i
		ret.push([a, b, lineHeight(b, desktopBaseSize - 2, desktopBaseSize)])
	}

	ret.unshift([mobileBaseSize - 2, desktopBaseSize - 2, 1.3], [mobileBaseSize - 1, desktopBaseSize - 1, 1.4])

	const labels = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl"]

	return labels.map((label, i) => [label, ...ret[i]])
}

function lineHeight(fontSize: number, desktopMinSize: number, desktopBaseSize: number) {
	const h = 1.5 - (0.03 * (fontSize - desktopMinSize)) / (desktopBaseSize - desktopMinSize)
	if (h < 1) return 1
	return h
}
