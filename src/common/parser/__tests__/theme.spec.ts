import { NodeType, ThemePathNode } from "../nodes"
import { tryOpacityValue } from "../theme"

it("tryOpacityValue 1", () => {
	// "colors.foo-5 / 0.1"
	// -> "colors.foo-5", "0.1"
	const pathRaw: ThemePathNode[] = [
		{
			type: NodeType.ThemePath,
			closed: true,
			value: "colors",
			range: [0, 6],
			toString() {
				return "colors"
			},
		},
		{
			type: NodeType.ThemePath,
			closed: true,
			value: "foo-5",
			range: [6, 12],
			toString() {
				return ".foo-5"
			},
		},
		{
			type: NodeType.ThemePath,
			closed: true,
			value: "/",
			range: [13, 14],
			toString() {
				return "/"
			},
		},
		{
			type: NodeType.ThemePath,
			closed: true,
			value: "0",
			range: [15, 16],
			toString() {
				return "0"
			},
		},
		{
			type: NodeType.ThemePath,
			closed: true,
			value: "1",
			range: [16, 18],
			toString() {
				return ".1"
			},
		},
	]

	const { opacityValue, path } = tryOpacityValue(pathRaw)
	expect(opacityValue).toEqual("0.1")
	expect(path.map(p => p.value)).toEqual(["colors", "foo-5"])
})

it("tryOpacityValue 2", () => {
	// "colors.foo-5/10 /10%"
	// -> "colors.foo-5/10", "10%"
	const pathRaw: ThemePathNode[] = [
		{
			type: NodeType.ThemePath,
			closed: true,
			value: "colors",
			range: [0, 6],
			toString() {
				return "colors"
			},
		},
		{
			type: NodeType.ThemePath,
			closed: true,
			value: "foo-5/10",
			range: [6, 15],
			toString() {
				return ".foo-5/10"
			},
		},
		{
			type: NodeType.ThemePath,
			closed: true,
			value: "/10%",
			range: [16, 20],
			toString() {
				return "/10%"
			},
		},
	]

	const { opacityValue, path } = tryOpacityValue(pathRaw)
	expect(opacityValue).toEqual("10%")
	expect(path.map(p => p.value)).toEqual(["colors", "foo-5/10"])
})

it("tryOpacityValue 3", () => {
	// "colors.foo-5/10/0.1"
	// -> "colors.foo-5/10", "0.1"
	const pathRaw: ThemePathNode[] = [
		{
			type: NodeType.ThemePath,
			closed: true,
			value: "colors",
			range: [0, 6],
			toString() {
				return "colors"
			},
		},
		{
			type: NodeType.ThemePath,
			closed: true,
			value: "foo-5/10/",
			range: [6, 16],
			toString() {
				return ".foo-5/10/"
			},
		},
		{
			type: NodeType.ThemePath,
			closed: true,
			value: "0",
			range: [16, 17],
			toString() {
				return "0"
			},
		},
		{
			type: NodeType.ThemePath,
			closed: true,
			value: "1",
			range: [17, 19],
			toString() {
				return ".1"
			},
		},
	]

	const { opacityValue, path } = tryOpacityValue(pathRaw)
	expect(opacityValue).toEqual("0.1")
	expect(path.map(p => p.value)).toEqual(["colors", "foo-5/10"])
})

it("tryOpacityValue 4", () => {
	// "colors.foo-5/10/ 0.1"
	// -> "colors.foo-5/10", "0.1"
	const pathRaw: ThemePathNode[] = [
		{
			type: NodeType.ThemePath,
			closed: true,
			value: "colors",
			range: [0, 6],
			toString() {
				return "colors"
			},
		},
		{
			type: NodeType.ThemePath,
			closed: true,
			value: "foo-5/10/",
			range: [6, 16],
			toString() {
				return ".foo-5/10/"
			},
		},
		{
			type: NodeType.ThemePath,
			closed: true,
			value: "0",
			range: [17, 18],
			toString() {
				return "0"
			},
		},
		{
			type: NodeType.ThemePath,
			closed: true,
			value: "1",
			range: [18, 20],
			toString() {
				return ".1"
			},
		},
	]

	const { opacityValue, path } = tryOpacityValue(pathRaw)
	expect(opacityValue).toEqual("0.1")
	expect(path.map(p => p.value)).toEqual(["colors", "foo-5/10"])
})
