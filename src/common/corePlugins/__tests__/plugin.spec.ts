import resolveConfig from "tailwindcss/resolveConfig"
import { createGetPluginByName } from "../index"

it("find the plugin name of a classname", () => {
	const getPlugin = createGetPluginByName(resolveConfig({}))
	expect(getPlugin("bg-red-500")?.name).toEqual<keyof Tailwind.CorePluginFeatures>("backgroundColor")
	expect(getPlugin("bg-[red]")?.name).toEqual<keyof Tailwind.CorePluginFeatures>("backgroundColor")
	expect(getPlugin("bg-[custom]")?.name).toBeUndefined()
	expect(getPlugin("bg-[red]/[.3]")?.name).toEqual<keyof Tailwind.CorePluginFeatures>("backgroundColor")
	expect(getPlugin("bg-[ url() ]")?.name).toEqual<keyof Tailwind.CorePluginFeatures>("backgroundImage")
	expect(getPlugin("bg-left")?.name).toEqual<keyof Tailwind.CorePluginFeatures>("backgroundPosition")
	expect(getPlugin("bg-[10% 20%]")?.name).toEqual<keyof Tailwind.CorePluginFeatures>("backgroundSize")
	expect(getPlugin("text-[black]/30")?.name).toEqual<keyof Tailwind.CorePluginFeatures>("textColor")
	expect(getPlugin("text-[3px]")?.name).toEqual<keyof Tailwind.CorePluginFeatures>("fontSize")
	expect(getPlugin("text-xl")?.name).toEqual<keyof Tailwind.CorePluginFeatures>("fontSize")
	expect(getPlugin("font-mono")?.name).toEqual<keyof Tailwind.CorePluginFeatures>("fontFamily")
})
