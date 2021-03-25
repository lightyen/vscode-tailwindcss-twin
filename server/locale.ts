import { createIntl, createIntlCache, IntlConfig } from "@formatjs/intl"
import en from "../package.nls.json"
import zhTW from "../package.nls.zh-tw.json"

interface NLSConfig {
	locale: "en" | "zh-tw"
}

const nlsConfig = JSON.parse(process.env.VSCODE_NLS_CONFIG ?? "") as NLSConfig

const cache = createIntlCache()

export let intl: ReturnType<typeof createIntl>

function init() {
	let messages: IntlConfig["messages"]
	switch (nlsConfig.locale) {
		case "zh-tw":
			messages = zhTW
			break
		default:
			messages = en
	}
	intl = createIntl(
		{
			defaultLocale: "en",
			locale: nlsConfig.locale,
			messages,
		},
		cache,
	)
}

init()
