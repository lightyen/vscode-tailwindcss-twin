import { CSSRuleItem, state } from "~/tailwind"
import { dlv } from "./tailwind/classnames"

/* eslint-disable @typescript-eslint/no-explicit-any */
export function useDebounce<T extends (...args: any[]) => void>(timeout: number, cb: T) {
	let t: NodeJS.Timer
	return (...params: Parameters<T>) => {
		if (t) {
			clearTimeout(t)
			t = undefined
		}
		t = setTimeout(() => cb(...params), timeout)
	}
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function isDarkMode(label: string, twin: boolean) {
	if (twin) {
		return label === "dark" || label === "light"
	} else {
		return label === "dark"
	}
}

export function hasDarkMode(labels: string[], twin: boolean) {
	return labels.some(v => isDarkMode(v, twin))
}

export function getBreakingPoint(label: string) {
	return state.classnames.breakingPoints[label]
}

export function hasBreakingPoint(labels: string[]) {
	return labels.some(v => getBreakingPoint(v))
}

export function isCommonVariant(label: string, twin: boolean) {
	if (getBreakingPoint(label)) {
		return false
	}
	if (isDarkMode(label, twin)) {
		return false
	}
	return !!getVariants(twin)[label]
}

export function isVariant(label: string, twin: boolean) {
	return !!getVariants(twin)[label]
}

export function getVariants(twin: boolean) {
	if (twin) {
		return state.classnames.variants
	} else {
		return state.classnames.baseVariants
	}
}

export function getValidVariantNames(twin: boolean) {
	const vs = getVariants(twin)
	return Object.keys(vs)
}

export function getClassNames(variants: string[], twin: boolean): Record<string, CSSRuleItem | CSSRuleItem[]> {
	if (variants.length > 0) {
		const keys: string[] = []
		const bp = variants.find(b => getBreakingPoint(b))
		if (bp) keys.push(bp)
		const i = variants.findIndex(x => isDarkMode(x, twin))
		if (i !== -1) {
			variants[i] = "dark"
			keys.push("dark")
		}
		return dlv(state.classnames.dictionary, [...keys]) as Record<string, CSSRuleItem | CSSRuleItem[]>
	} else {
		return state.classnames.dictionary
	}
}

export function getClassNameRules(variants: string[], label: string, twin: boolean): CSSRuleItem | CSSRuleItem[] {
	const names = getClassNames(variants, twin)
	return names?.[label]
}

export function isValidClassName(variants: string[], label: string, twin: boolean) {
	const data = getClassNameRules(variants, label, twin)
	if (!data) {
		return false
	}
	if (isDarkMode(label, twin)) {
		return false
	}
	if (twin) {
		if (label === "group") {
			return false
		}
		if (variants.length > 0 && label === "container") {
			return false
		}
	}
	return true
}

export function getValidClassNames(variants: string[], twin: boolean) {
	const result: string[] = []
	if (variants.length > 0) {
		const keys: string[] = []
		const bp = variants.find(b => getBreakingPoint(b))
		if (bp) keys.push(bp)
		const i = variants.findIndex(x => isDarkMode(x, twin))
		if (i !== -1) {
			variants[i] = "dark"
			keys.push("dark")
		}
		result.push(...Object.keys(dlv(state.classnames.dictionary, [...keys])))
	} else {
		result.push(...Object.keys(state.classnames.dictionary))
	}
	let index = result.findIndex(v => v === "dark")
	if (index >= 0) {
		result.splice(index, 1)
	}
	if (twin) {
		index = result.findIndex(v => v === "group")
		if (index >= 0) {
			result.splice(index, 1)
		}
		if (variants.length > 0) {
			index = result.findIndex(v => v === "container")
			if (index >= 0) {
				result.splice(index, 1)
			}
		}
	}
	return result
}

export function getSeparator() {
	return state.separator
}

export function getDarkMode() {
	return state.darkMode
}

export function getColors() {
	return state.classnames.colors
}
