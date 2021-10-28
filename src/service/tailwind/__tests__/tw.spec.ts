import resolveConfig from "tailwindcss/resolveConfig"
import { URI } from "vscode-uri"
import { createTwContext } from "../tw"

it("tw suit", async () => {
	const extensionUri = URI.parse("")
	const tw = await createTwContext(resolveConfig({}), extensionUri)

	expect(tw.renderClassname({ classname: "text-green-300" })).toMatchSnapshot("classname")
	expect(tw.renderClassname({ classname: "p-3", rootFontSize: 16 })).toMatchSnapshot("classname")
	expect(tw.renderClassname({ classname: "bg-[rgb(3, 3, 3)]" })).toMatchSnapshot("classname")
	expect(tw.renderClassname({ classname: "bg-[image:url(https://example.png)]" })).toMatchSnapshot("classname")
	expect(tw.renderClassname({ classname: "divide-black", important: true })).toMatchSnapshot("classname")
	expect(tw.renderClassname({ classname: "text-xl", tabSize: 2 })).toMatchSnapshot("classname")
	expect(tw.renderClassname({ classname: "text-[2px]" })).toMatchSnapshot("classname")
	expect(tw.renderClassname({ classname: "text-[red]" })).toMatchSnapshot("classname")
	expect(tw.renderClassname({ classname: "text-[red]/[.2]" })).toMatchSnapshot("classname")
	expect(tw.renderClassname({ classname: "text-red-300/[.2]" })).toMatchSnapshot("classname")
	expect(tw.renderClassname({ classname: "text-[red]/30" })).toMatchSnapshot("not supported")

	expect(tw.renderCssProperty({ prop: "background", value: "rgb(3 3 3 / .2)" })).toMatchSnapshot("css declaration")
	expect(tw.renderCssProperty({ prop: "background", value: "rgb(3 3 3 / .2)", important: true })).toMatchSnapshot(
		"css declaration",
	)
	expect(tw.renderCssProperty({ prop: "padding", value: "2.5rem", rootFontSize: 12 })).toMatchSnapshot(
		"css declaration",
	)

	expect(tw.renderDecls("text-2xl")).toMatchSnapshot("decls")
	expect(tw.renderDecls("from-pink-200")).toMatchSnapshot("decls")
	expect(tw.renderDecls("divide-double")).toMatchSnapshot("decls")
	expect(tw.renderDecls("text-[red]/30")).toMatchSnapshot("not supported")
})
