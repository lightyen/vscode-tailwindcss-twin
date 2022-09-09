import ts from "typescript"
import type { ExtractedToken, ExtractedTokenKind, Extractor } from "./types"

const twinLabel = "twin.macro"

interface Features {
	jsxProp: boolean
	twTemplate: Set<string>
	themeTemplate: Set<string>
	screenTemplate: Set<string>
}

function transfromToken(
	result: { kind: ExtractedTokenKind; token: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral },
	source: ts.SourceFile,
): ExtractedToken {
	const value = result.token.text
	const start = result.token.getStart(source) + 1
	const end = result.token.getEnd()
	return { kind: result.kind, start, end, value }
}

function findNode(
	source: ts.SourceFile,
	node: ts.Node,
	position: number,
	features: Features,
	includeEnd: boolean,
): { token: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral; kind: ExtractedTokenKind } | undefined {
	if (position < node.getStart(source) || position >= node.getEnd()) {
		return undefined
	}

	if (ts.isJsxAttribute(node)) {
		const attrName = node.name.text
		if (features.jsxProp && node.initializer) {
			if (attrName === "tw") {
				let token: ts.StringLiteral | undefined
				if (ts.isStringLiteral(node.initializer)) {
					token = node.initializer
				} else if (ts.isJsxExpression(node.initializer)) {
					const { expression } = node.initializer
					if (expression && ts.isStringLiteral(expression)) {
						token = expression
					}
				}
				if (token && position >= token.getStart(source) + 1 && !greaterThenEnd(token)) {
					return { token, kind: "tw" }
				}
			} else if (attrName === "cs") {
				let token: ts.StringLiteral | undefined
				if (ts.isStringLiteral(node.initializer)) {
					token = node.initializer
				} else if (ts.isJsxExpression(node.initializer)) {
					const { expression } = node.initializer
					if (expression && ts.isStringLiteral(expression)) {
						token = expression
					}
				}
				if (token && position >= token.getStart(source) + 1 && !greaterThenEnd(token)) {
					return { token, kind: "cs" }
				}
			}
		}
	} else if (ts.isTaggedTemplateExpression(node)) {
		const { tag, template } = node
		if (ts.isNoSubstitutionTemplateLiteral(template)) {
			let id: ts.Identifier | undefined
			let e = tag
			while (ts.isCallExpression(e) || ts.isPropertyAccessExpression(e)) {
				e = e.expression
			}
			if (ts.isIdentifier(e)) {
				id = e
			}
			if (id) {
				if (features.twTemplate.has(id.text)) {
					if (position < template.getStart(source) + 1 || greaterThenEnd(template)) {
						return undefined
					}
					return { token: template, kind: "tw" }
				}
				if (features.screenTemplate.has(id.text)) {
					if (position < template.getStart(source) + 1 || greaterThenEnd(template)) {
						return undefined
					}
					return { token: template, kind: "screen" }
				} else if (features.themeTemplate.has(id.text)) {
					if (position < template.getStart(source) + 1 || greaterThenEnd(template)) {
						return undefined
					}
					return { token: template, kind: "theme" }
				}
			}
		}
	}

	return ts.forEachChild(node, child => findNode(source, child, position, features, includeEnd))

	function greaterThenEnd(node: ts.Node): boolean {
		return includeEnd ? position >= node.getEnd() : position >= node.getEnd() - 1
	}
}

function findAllNode(
	source: ts.SourceFile,
	node: ts.Node,
	features: Features,
): Array<{ token: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral; kind: ExtractedTokenKind }> {
	if (ts.isJsxAttribute(node)) {
		const attrName = node.name.text
		if (features.jsxProp && node.initializer) {
			if (attrName === "tw") {
				let token: ts.StringLiteral | undefined
				if (ts.isStringLiteral(node.initializer)) {
					token = node.initializer
				} else if (ts.isJsxExpression(node.initializer)) {
					const { expression } = node.initializer
					if (expression && ts.isStringLiteral(expression)) {
						token = expression
					}
				}
				if (token) {
					return [{ token, kind: "tw" }]
				}
			} else if (attrName === "cs") {
				let token: ts.StringLiteral | undefined
				if (ts.isStringLiteral(node.initializer)) {
					token = node.initializer
				} else if (ts.isJsxExpression(node.initializer)) {
					const { expression } = node.initializer
					if (expression && ts.isStringLiteral(expression)) {
						token = expression
					}
				}
				if (token) {
					return [{ token, kind: "cs" }]
				}
			}
		}
	} else if (ts.isTaggedTemplateExpression(node)) {
		const { tag, template } = node
		if (ts.isNoSubstitutionTemplateLiteral(template)) {
			let id: ts.Identifier | undefined
			let e = tag
			while (ts.isCallExpression(e) || ts.isPropertyAccessExpression(e)) {
				e = e.expression
			}
			if (ts.isIdentifier(e)) {
				id = e
			}
			if (id) {
				if (features.twTemplate.has(id.text)) {
					return [{ token: template, kind: "tw" }]
				} else if (features.screenTemplate.has(id.text)) {
					return [{ token: template, kind: "screen" }]
				} else if (features.themeTemplate.has(id.text)) {
					return [{ token: template, kind: "theme" }]
				}
			}
		}
	}

	return node
		.getChildren(source)
		.map(c => findAllNode(source, c, features))
		.flat()
}

function checkImportTwin(source: ts.SourceFile, jsxPropChecking = true): Features {
	let jsxProp = !jsxPropChecking
	const twTemplate = new Set<string>()
	const themeTemplate = new Set<string>()
	const screenTemplate = new Set<string>()

	source.forEachChild(node => {
		if (ts.isImportDeclaration(node)) {
			const { moduleSpecifier } = node
			if (ts.isStringLiteral(moduleSpecifier) && moduleSpecifier.text === twinLabel) {
				jsxProp = true
				const clause = node.importClause
				if (clause) {
					const { name, namedBindings } = clause
					if (name) {
						const localName = name.text
						twTemplate.add(localName)
					}

					if (namedBindings && namedBindings.kind === ts.SyntaxKind.NamedImports) {
						namedBindings.elements.forEach(node => {
							const localName = node.name?.text
							if (!localName) return

							const importedName = node.propertyName?.text ?? localName
							switch (importedName) {
								case "theme":
									themeTemplate.add(localName)
									break
								case "screen":
									screenTemplate.add(localName)
									break
								case "default":
									twTemplate.add(localName)
									break
							}
						})
					}
				}
			}
		}
	})

	return { jsxProp, twTemplate, themeTemplate, screenTemplate } as const
}

export function findToken(
	source: ts.SourceFile,
	position: number,
	includeEnd: boolean,
	jsxPropChecking = true,
): ExtractedToken | undefined {
	const features = checkImportTwin(source, jsxPropChecking)
	const node = findNode(source, source, position, features, includeEnd)
	if (node == undefined) {
		return undefined
	}
	return transfromToken(node, source)
}

export function findAllToken(source: ts.SourceFile, jsxPropChecking = true): ExtractedToken[] {
	const features = checkImportTwin(source, jsxPropChecking)
	return findAllNode(source, source, features)?.map(node => transfromToken(node, source))
}

const typescriptExtractor: Extractor = {
	acceptLanguage(languageId) {
		switch (languageId) {
			case "javascript":
			case "javascriptreact":
			case "typescript":
			case "typescriptreact":
				return true
		}
		return false
	},
	findAll(languageId, code, jsxPropImportChecking) {
		let scriptKind: ts.ScriptKind | undefined
		switch (languageId) {
			case "typescript":
				scriptKind = ts.ScriptKind.TS
				break
			case "javascript":
				scriptKind = ts.ScriptKind.JS
				break
			case "typescriptreact":
				scriptKind = ts.ScriptKind.TSX
				break
			case "javascriptreact":
				scriptKind = ts.ScriptKind.JSX
				break
			default:
				scriptKind = undefined
		}
		if (scriptKind) {
			const source = ts.createSourceFile("", code, ts.ScriptTarget.Latest, false, scriptKind)
			try {
				return findAllToken(source, jsxPropImportChecking)
			} catch {
				return []
			}
		}
		return []
	},
	find(languageId, code, position, includeEnd, jsxPropImportChecking) {
		let scriptKind: ts.ScriptKind | undefined
		switch (languageId) {
			case "typescript":
				scriptKind = ts.ScriptKind.TS
				break
			case "javascript":
				scriptKind = ts.ScriptKind.JS
				break
			case "typescriptreact":
				scriptKind = ts.ScriptKind.TSX
				break
			case "javascriptreact":
				scriptKind = ts.ScriptKind.JSX
				break
			default:
				scriptKind = undefined
		}
		if (scriptKind) {
			const source = ts.createSourceFile("", code, ts.ScriptTarget.Latest, false, scriptKind)
			const token = findToken(source, position, includeEnd, jsxPropImportChecking)
			if (!token) {
				return undefined
			}
			return token
		}
		return undefined
	},
}
export default typescriptExtractor
