import docs from "./docs.yaml"
import references from "./references.yaml"

export interface Reference {
	name: string
	url: string
}

export function getReferenceLinks(keyword: string) {
	const value = keyword.replace(":", "")
	const originUrl = references[value]
	const twinUrl = references["tw." + value]
	const links: Reference[] = []
	const last = /[\w-.]+$/
	if (typeof originUrl === "string") {
		const match = originUrl.match(last)
		links.push({ name: match?.[0] || "", url: originUrl })
	}
	if (typeof twinUrl === "string") {
		const match = twinUrl.match(last)
		if (match) {
			if (match[0] !== "variantConfig.js") {
				links.push({ name: "twin.macro", url: twinUrl })
			}
		}
	}
	return links
}

export function getName(keyword: string): string | undefined {
	keyword = keyword.replace(":", "")
	const originUrl = references[keyword]
	const twinUrl = references["tw." + keyword]
	const url = originUrl || twinUrl
	if (url) {
		if (docs[twinUrl]) {
			return docs[twinUrl].name
		}
		if (docs[originUrl]) {
			return docs[originUrl].name
		}

		const match = /[\w-]+$/.exec(originUrl)
		const text = match?.[0] || ""
		if (!originUrl || text) {
			return originUrl ? `${text}` : "twin.macro"
		}
	}
	return undefined
}

export function getDescription(keyword: string): string | undefined {
	keyword = keyword.replace(":", "")
	const originUrl = references[keyword]
	const twinUrl = references["tw." + keyword]
	const url = originUrl || twinUrl
	if (url) {
		if (docs[twinUrl]) {
			return docs[twinUrl].desc
		}
		if (docs[originUrl]) {
			return docs[originUrl].desc
		}

		const match = /[\w-]+$/.exec(originUrl)
		const text = match?.[0] || ""
		if (!originUrl || text) {
			return originUrl ? `${text}` : "twin.macro"
		}
	}
	return undefined
}
