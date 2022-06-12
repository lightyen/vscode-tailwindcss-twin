import resolveConfig from "tailwindcss/resolveConfig"
import { createTwContext } from "../tw"

it("tw render classname", () => {
	const tw = createTwContext(resolveConfig({}))
	expect(tw.renderClassname({ classname: "text-green-300" })).toMatchSnapshot()
	expect(tw.renderClassname({ classname: "p-3", rootFontSize: 16 })).toMatchSnapshot()
	expect(tw.renderClassname({ classname: "bg-[rgb(3, 3, 3)]" })).toMatchSnapshot()
	expect(tw.renderClassname({ classname: "bg-[image:url(https://example.png)]" })).toMatchSnapshot()
	expect(tw.renderClassname({ classname: "divide-black", important: true })).toMatchSnapshot()
	expect(tw.renderClassname({ classname: "text-xl", tabSize: 2 })).toMatchSnapshot()
})

it("tw render css declaration", () => {
	const tw = createTwContext(resolveConfig({}))
	expect(tw.renderCssProperty({ prop: "background", value: "rgb(3 3 3 / .2)" })).toMatchSnapshot()
	expect(tw.renderCssProperty({ prop: "background", value: "rgb(3 3 3 / .2)", important: true })).toMatchSnapshot()
	expect(tw.renderCssProperty({ prop: "padding", value: "2.5rem", rootFontSize: 12 })).toMatchSnapshot()
})

it("tw render arbitrary classname", () => {
	const tw = createTwContext(resolveConfig({}))
	expect(tw.renderClassname({ classname: "text-[2px]" })).toMatchSnapshot()
	expect(tw.renderClassname({ classname: "text-[red]" })).toMatchSnapshot()
	expect(tw.renderClassname({ classname: "text-[red]/[.2]" })).toMatchSnapshot()
	expect(tw.renderClassname({ classname: "text-red-300/[.2]" })).toMatchSnapshot()
	expect(tw.renderClassname({ classname: "text-[red]/30" })).toMatchSnapshot()
})

it("tw render decls", () => {
	const tw = createTwContext(resolveConfig({}))
	expect(tw.renderDecls("text-2xl")).toMatchSnapshot()
	expect(tw.renderDecls("from-pink-200")).toMatchSnapshot()
	expect(tw.renderDecls("divide-double")).toMatchSnapshot()
})
