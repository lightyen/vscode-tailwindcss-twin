import docs from "./docs.yaml"

export interface Reference {
	name: string
	url: string
}

export function getReferenceLinks(keyword: string) {
	const value = keyword.replace(":", "")
	const originUrl = docs[value]
	const twinUrl = docs["tw." + value]
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

export function getClassification(keyword: string) {
	const value = keyword.replace(":", "")
	const originUrl = docs[value]
	const twinUrl = docs["tw." + value]
	const url = originUrl || twinUrl
	if (url) {
		const match = /[\w-]+$/.exec(originUrl)
		const text = match?.[0] || ""
		if (!originUrl || text) {
			return originUrl ? `${text}` : "twin.macro"
		}
	}
	return undefined
}
