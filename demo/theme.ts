import tw, { theme } from "twin.macro"
theme`colors.foo-5 / 0.1`
theme`colors.foo-5/10 /10%`
theme`colors.foo-5/10 /10%`
theme`colors.foo-5/10   0.2`
theme`colors.foo-5/10   10%`
tw`accent-[theme(colors.foo-5 / 0.1)]`
tw`accent-[theme(colors.foo-5/10 /10%)]`
tw`accent-[theme(colors.foo-5/10 /10%)]`
tw`accent-[theme(colors.foo-5/10   0.2)]`
tw`accent-[theme(colors.foo-5/10   10%)]`

theme`width.1/2`
tw`
// bug from tailwindcss
accent-[calc(theme(width.1/2))]
`
