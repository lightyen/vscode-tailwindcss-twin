import * as ast from "@typescript-eslint/types/dist/ast-spec"
import { AST_NODE_TYPES, parse } from "@typescript-eslint/typescript-estree"
import { ExtractedToken, ExtractedTokenKind, Extractor } from "."

const twinLabel = "twin.macro"

export function findAll(code: string, jsxPropImportChecking: boolean) {
	const tokens: ExtractedToken[] = []
	let program: ast.Program
	try {
		program = parse(code, { jsx: true, range: true })
	} catch {
		return tokens
	}

	const ctx = createContext(program, jsxPropImportChecking)
	program.body.forEach(parseStatement)
	return tokens

	function createContext(program: ast.Program, jsxPropChecking = true) {
		let jsxProp = !jsxPropChecking
		const twTemplate = new Set<string>()
		const themeTemplate = new Set<string>()
		const screenTemplate = new Set<string>()

		for (const node of program.body) {
			switch (node.type) {
				case AST_NODE_TYPES.ImportDeclaration:
					if (node.source.value === twinLabel) {
						jsxProp = true
						for (const clause of node.specifiers) {
							switch (clause.type) {
								case AST_NODE_TYPES.ImportDefaultSpecifier:
									twTemplate.add(clause.local.name)
									break
								case AST_NODE_TYPES.ImportSpecifier:
									if (clause.imported.name === "default") {
										twTemplate.add(clause.local.name)
									} else if (clause.imported.name === ExtractedTokenKind.TwinTheme) {
										themeTemplate.add(clause.local.name)
									} else if (clause.imported.name === ExtractedTokenKind.TwinScreen) {
										screenTemplate.add(clause.local.name)
									}
									break
							}
						}
					}
					break
			}
		}

		return { jsxProp, twTemplate, themeTemplate, screenTemplate }
	}

	function parseTaggedTemplateExpression(node: ast.TaggedTemplateExpression) {
		if (node.tag.type !== AST_NODE_TYPES.Identifier) {
			parseExpression(node.tag)
			return
		} else if (ctx.twTemplate.has(node.tag.name)) {
			if (node.quasi.quasis.length === 1) {
				const n: ast.TemplateElement = node.quasi.quasis[0]
				tokens.push({
					kind: ExtractedTokenKind.Twin,
					start: n.range[0] + 1,
					end: n.range[1] - 1,
					value: n.value.cooked,
				})
			}
		} else if (ctx.themeTemplate.has(node.tag.name)) {
			if (node.quasi.quasis.length === 1) {
				const n: ast.TemplateElement = node.quasi.quasis[0]
				tokens.push({
					kind: ExtractedTokenKind.TwinTheme,
					start: n.range[0] + 1,
					end: n.range[1] - 1,
					value: n.value.cooked,
				})
			}
		} else if (ctx.screenTemplate.has(node.tag.name)) {
			if (node.quasi.quasis.length === 1) {
				const n: ast.TemplateElement = node.quasi.quasis[0]
				tokens.push({
					kind: ExtractedTokenKind.TwinScreen,
					start: n.range[0] + 1,
					end: n.range[1] - 1,
					value: n.value.cooked,
				})
			}
		} else {
			parseTemplateLiteral(node.quasi)
		}
	}

	function parseCallExpression(node: ast.CallExpression) {
		parseExpression(node.callee)
		for (const a of node.arguments) {
			switch (a.type) {
				case AST_NODE_TYPES.SpreadElement:
					parseExpression(a.argument)
					break
				default:
					parseExpression(a)
			}
		}
	}

	function parseJSXAttribute(node: ast.JSXAttribute) {
		if (node.name.type === AST_NODE_TYPES.JSXIdentifier) {
			if (ctx.jsxProp && node.name.name === ExtractedTokenKind.Twin) {
				if (node.value) getToken(node.value, ExtractedTokenKind.Twin)
			} else if (ctx.jsxProp && node.name.name === ExtractedTokenKind.TwinCssProperty) {
				if (node.value) getToken(node.value, ExtractedTokenKind.TwinCssProperty)
			} else if (node.value && node.value.type !== AST_NODE_TYPES.Literal) {
				parseJSXExpression(node.value)
			}
		}

		return

		function getToken(node: ast.Literal | ast.JSXExpression, kind: ExtractedTokenKind) {
			switch (node.type) {
				case AST_NODE_TYPES.JSXEmptyExpression:
					break
				case AST_NODE_TYPES.Literal:
					if (typeof node.value === "string") {
						tokens.push({
							kind,
							start: node.range[0] + 1,
							end: node.range[1] - 1,
							value: node.value,
						})
					}
					break
				case AST_NODE_TYPES.JSXExpressionContainer:
					if (node.expression.type === AST_NODE_TYPES.Literal) {
						if (typeof node.expression.value === "string") {
							tokens.push({
								kind,
								start: node.expression.range[0] + 1,
								end: node.expression.range[1] - 1,
								value: node.expression.value,
							})
						}
					} else if (node.expression.type !== AST_NODE_TYPES.JSXEmptyExpression) {
						parseExpression(node.expression)
					}
					break
				case AST_NODE_TYPES.JSXSpreadChild:
					if (node.expression.type !== AST_NODE_TYPES.JSXEmptyExpression) {
						parseExpression(node.expression)
					}
					break
			}
		}
	}

	function parseJSXElement(node: ast.JSXElement) {
		parseJSXOpeningElement(node.openingElement)
		node.children.forEach(parseJSXChild)
	}

	function parseJSXOpeningElement(node: ast.JSXOpeningElement) {
		for (const attr of node.attributes) {
			switch (attr.type) {
				case AST_NODE_TYPES.JSXAttribute:
					parseJSXAttribute(attr)
					break
				default:
					parseJSXSpreadAttribute(attr)
					break
			}
		}
	}

	function parseJSXChild(node: ast.JSXChild) {
		switch (node.type) {
			case AST_NODE_TYPES.JSXElement:
				parseJSXElement(node)
				break
			case AST_NODE_TYPES.JSXFragment:
				parseJSXFragment(node)
				break
			case AST_NODE_TYPES.JSXText:
				break
			default:
				parseJSXExpression(node)
				break
		}
	}

	function parseJSXFragment(node: ast.JSXFragment) {
		node.children.forEach(parseJSXChild)
	}

	function parseJSXSpreadAttribute(node: ast.JSXSpreadAttribute) {
		parseExpression(node.argument)
	}

	function parseJSXExpression(node: ast.JSXExpression) {
		switch (node.type) {
			case AST_NODE_TYPES.JSXEmptyExpression:
				break
			case AST_NODE_TYPES.JSXSpreadChild:
				if (node.expression.type !== AST_NODE_TYPES.JSXEmptyExpression) {
					parseExpression(node.expression)
				}
				break
			case AST_NODE_TYPES.JSXExpressionContainer:
				if (node.expression.type !== AST_NODE_TYPES.JSXEmptyExpression) {
					parseExpression(node.expression)
				}
				break
		}
	}

	function parseExportDefaultDeclaration(node: ast.ExportDefaultDeclaration) {
		parseDeclaration(node.declaration)
	}

	function parseVariableDeclaration(node: ast.VariableDeclaration) {
		node.declarations.forEach(parseVariableDeclarator)
	}

	function parseExpression(node: ast.Expression) {
		// LiteralExpression | LogicalExpression | MemberExpression | MetaProperty | NewExpression | ObjectPattern | Super | ThisExpression | TSAsExpression | TSNonNullExpression | TSTypeAssertion;
		switch (node.type) {
			case AST_NODE_TYPES.TaggedTemplateExpression:
				parseTaggedTemplateExpression(node)
				break
			case AST_NODE_TYPES.TemplateLiteral:
				parseTemplateLiteral(node)
				break
			case AST_NODE_TYPES.SequenceExpression:
				node.expressions.forEach(parseExpression)
				break
			case AST_NODE_TYPES.ArrayExpression:
				parseArrayExpression(node)
				break
			case AST_NODE_TYPES.ArrayPattern:
				parseArrayPattern(node)
				break
			case AST_NODE_TYPES.FunctionExpression:
				parseFunctionExpression(node)
				break
			case AST_NODE_TYPES.ArrowFunctionExpression:
				parseArrowFunctionExpression(node)
				break
			case AST_NODE_TYPES.AssignmentExpression:
				parseExpression(node.right)
				break

			case AST_NODE_TYPES.ConditionalExpression:
				parseExpression(node.consequent)
				parseExpression(node.alternate)
				break
			case AST_NODE_TYPES.LogicalExpression:
				parseExpression(node.right)
				break
			case AST_NODE_TYPES.MemberExpression:
				if (node.property.type !== AST_NODE_TYPES.PrivateIdentifier) {
					parseExpression(node.property)
				}
				break
			case AST_NODE_TYPES.BinaryExpression:
				parseExpression(node.right)
				break
			case AST_NODE_TYPES.UpdateExpression:
				parseExpression(node.argument)
				break
			case AST_NODE_TYPES.AwaitExpression:
				parseExpression(node.argument)
				break
			case AST_NODE_TYPES.YieldExpression:
				if (node.argument) parseExpression(node.argument)
				break
			case AST_NODE_TYPES.ObjectExpression:
				for (const el of node.properties) {
					parseObjectLiteralElement(el)
				}
				break
			case AST_NODE_TYPES.ClassExpression:
				parseClassBody(node.body)
				break
			case AST_NODE_TYPES.ChainExpression:
				parseExpression(node.expression)
				break
			case AST_NODE_TYPES.CallExpression:
				parseCallExpression(node)
				break
			case AST_NODE_TYPES.UnaryExpression:
				parseUnaryExpression(node)
				break
			case AST_NODE_TYPES.ImportExpression:
				parseExpression(node.source)
				break
			case AST_NODE_TYPES.JSXElement:
				parseJSXElement(node)
				break
			case AST_NODE_TYPES.JSXFragment:
				parseJSXFragment(node)
				break
			case AST_NODE_TYPES.Identifier:
				break
			case AST_NODE_TYPES.ThisExpression:
				break
		}
	}

	function parseDeclaration(node: ast.ExportDeclaration | ast.Expression) {
		switch (node.type) {
			case AST_NODE_TYPES.ClassDeclaration:
				parseClassDeclaration(node)
				break
			case AST_NODE_TYPES.ClassExpression:
				parseClassBody(node.body)
				break
			case AST_NODE_TYPES.FunctionDeclaration:
				parseFunctionDeclaration(node)
				break
			case AST_NODE_TYPES.TSEnumDeclaration:
				parseTSEnumDeclaration(node)
				break
			case AST_NODE_TYPES.VariableDeclaration:
				parseVariableDeclaration(node)
				break
			case AST_NODE_TYPES.TSDeclareFunction:
			case AST_NODE_TYPES.TSInterfaceDeclaration:
			case AST_NODE_TYPES.TSModuleDeclaration:
			case AST_NODE_TYPES.TSTypeAliasDeclaration:
				break
			default:
				parseExpression(node)
		}
	}

	function parseStatement(node: ast.Statement) {
		switch (node.type) {
			case AST_NODE_TYPES.BlockStatement:
				parseBlockStatement(node)
				break
			case AST_NODE_TYPES.ClassDeclaration:
				parseClassDeclaration(node)
				break
			case AST_NODE_TYPES.DoWhileStatement:
				parseStatement(node.body)
				break
			case AST_NODE_TYPES.ExportDefaultDeclaration:
				parseExportDefaultDeclaration(node)
				break
			case AST_NODE_TYPES.ExpressionStatement:
				parseExpression(node.expression)
				break
			case AST_NODE_TYPES.ForInStatement:
				parseExpression(node.right)
				parseStatement(node.body)
				break
			case AST_NODE_TYPES.ForOfStatement:
				parseExpression(node.right)
				parseStatement(node.body)
				break
			case AST_NODE_TYPES.ForStatement:
				if (node.init) {
					if (node.init.type === AST_NODE_TYPES.VariableDeclaration) parseVariableDeclaration(node.init)
					else parseExpression(node.init)
				}
				if (node.test) {
					parseExpression(node.test)
				}
				if (node.update) {
					parseExpression(node.update)
				}
				parseStatement(node.body)
				break
			case AST_NODE_TYPES.FunctionDeclaration:
				parseFunctionDeclaration(node)
				break
			case AST_NODE_TYPES.IfStatement:
				parseExpression(node.test)
				if (node.alternate) parseStatement(node.alternate)
				parseStatement(node.consequent)
				break
			case AST_NODE_TYPES.ReturnStatement:
				if (node.argument) parseExpression(node.argument)
				break
			case AST_NODE_TYPES.ThrowStatement:
				if (node.argument && node.argument.type !== AST_NODE_TYPES.TSAsExpression) parseStatement(node.argument)
				break
			case AST_NODE_TYPES.SwitchStatement:
				parseExpression(node.discriminant)
				for (const cs of node.cases) {
					if (cs.test) parseExpression(cs.test)
					cs.consequent.forEach(parseStatement)
				}
				break
			case AST_NODE_TYPES.TryStatement:
				parseStatement(node.block)
				if (node.handler) {
					if (node.handler.param) parseBindingName(node.handler.param)
					parseBlockStatement(node.handler.body)
				}
				if (node.finalizer) parseStatement(node.finalizer)
				break
			case AST_NODE_TYPES.TSEnumDeclaration:
				parseTSEnumDeclaration(node)
				break
			case AST_NODE_TYPES.TSExportAssignment:
				parseExpression(node.expression)
				break
			case AST_NODE_TYPES.VariableDeclaration:
				node.declarations.forEach(parseVariableDeclarator)
				break
			case AST_NODE_TYPES.WhileStatement:
				parseExpression(node.test)
				parseStatement(node.body)
				break
			case AST_NODE_TYPES.WithStatement:
				parseExpression(node.object)
				parseStatement(node.body)
				break
			case AST_NODE_TYPES.ExportNamedDeclaration:
				if (node.declaration) parseDeclaration(node.declaration)
				break
			case AST_NODE_TYPES.ImportDeclaration:
			case AST_NODE_TYPES.TSModuleDeclaration:
			case AST_NODE_TYPES.TSNamespaceExportDeclaration:
			case AST_NODE_TYPES.TSTypeAliasDeclaration:
			case AST_NODE_TYPES.TSImportEqualsDeclaration:
			case AST_NODE_TYPES.BreakStatement:
			case AST_NODE_TYPES.ContinueStatement:
			case AST_NODE_TYPES.DebuggerStatement:
			case AST_NODE_TYPES.ExportAllDeclaration:
			case AST_NODE_TYPES.LabeledStatement:
				break
		}
	}

	function parseBlockStatement(node: ast.BlockStatement) {
		node.body.forEach(parseStatement)
	}

	function parseVariableDeclarator(node: ast.VariableDeclarator) {
		parseBindingName(node.id)
		if (node.init) parseExpression(node.init)
	}

	function parseDestructuringPattern(node: ast.DestructuringPattern | null) {
		if (node) {
			switch (node.type) {
				case AST_NODE_TYPES.ArrayPattern:
					node.elements.forEach(parseDestructuringPattern)
					for (const el of node.elements) {
						if (el) parseDestructuringPattern(el)
					}
					break
				case AST_NODE_TYPES.AssignmentPattern:
					parseExpression(node.right)
					break
			}
		}
	}

	function parseMethodDefinition(node: ast.MethodDefinition) {
		if (node.value.type === AST_NODE_TYPES.FunctionExpression) parseFunctionExpression(node.value)
	}

	function parseArrayPattern(node: ast.ArrayPattern) {
		for (const el of node.elements) {
			if (el) parseDestructuringPattern(el)
		}
	}

	function parseProperty(node: ast.Property) {
		if (node.computed) parseExpression(node.key)
		switch (node.value.type) {
			case AST_NODE_TYPES.AssignmentPattern:
				parseExpression(node.value.right)
				break
			case AST_NODE_TYPES.ArrayPattern:
				parseArrayPattern(node.value)
				break
			case AST_NODE_TYPES.ObjectPattern:
				parseObjectPattern(node.value)
				break
			case AST_NODE_TYPES.Identifier:
				break
			case AST_NODE_TYPES.TSEmptyBodyFunctionExpression:
				break
			default:
				parseExpression(node.value)
		}
	}

	function parseRestElement(node: ast.RestElement) {
		if (node.value) {
			parseExpression(node.value.right)
		}
	}

	function parseObjectPattern(node: ast.ObjectPattern) {
		for (const prop of node.properties) {
			if (prop.type === AST_NODE_TYPES.Property) {
				parseProperty(prop)
			} else {
				parseRestElement(prop)
			}
		}
	}

	function parseObjectLiteralElement(node: ast.ObjectLiteralElement) {
		switch (node.type) {
			case AST_NODE_TYPES.MethodDefinition:
				parseMethodDefinition(node)
				break
			case AST_NODE_TYPES.Property:
				parseProperty(node)
				break
			case AST_NODE_TYPES.SpreadElement:
				parseExpression(node.argument)
				break
		}
	}

	function parseUnaryExpression(node: ast.UnaryExpression) {
		switch (node.argument.type) {
			case AST_NODE_TYPES.Literal:
				break
			case AST_NODE_TYPES.UnaryExpression:
				parseUnaryExpression(node.argument)
				break
			default:
				parseExpression(node.argument)
				break
		}
	}

	function parseTemplateLiteral(node: ast.TemplateLiteral) {
		node.expressions.forEach(parseExpression)
	}

	function parseFunctionDeclaration(node: ast.FunctionDeclaration) {
		parseBlockStatement(node.body)
	}

	function parseTSEnumDeclaration(node: ast.TSEnumDeclaration) {
		for (const member of node.members) {
			parseTSEnumMember(member)
		}
	}

	function parseTSEnumMember(node: ast.TSEnumMember) {
		if (node.initializer) {
			parseExpression(node.initializer)
		}
	}

	function parseFunctionExpression(node: ast.FunctionExpression) {
		parseBlockStatement(node.body)
	}

	function parseArrowFunctionExpression(node: ast.ArrowFunctionExpression) {
		switch (node.body.type) {
			case AST_NODE_TYPES.BlockStatement:
				parseBlockStatement(node.body)
				break
			default:
				parseExpression(node.body)
		}
	}

	function parseClassDeclaration(node: ast.ClassDeclaration) {
		parseClassBody(node.body)
	}

	function parseClassBody(node: ast.ClassBody) {
		for (const el of node.body) {
			parseClassElement(el)
		}
	}

	function parseClassElement(node: ast.ClassElement) {
		switch (node.type) {
			case AST_NODE_TYPES.PropertyDefinition:
				if (node.value) {
					parseExpression(node.value)
				}
				break
			case AST_NODE_TYPES.MethodDefinition:
				if (node.value.type === AST_NODE_TYPES.FunctionExpression) parseFunctionExpression(node.value)
				break
			case AST_NODE_TYPES.StaticBlock:
				node.body.forEach(parseStatement)
				break
		}
	}

	function parseBindingName(node: ast.BindingName) {
		switch (node.type) {
			case AST_NODE_TYPES.ArrayPattern:
				parseArrayPattern(node)
				break
			case AST_NODE_TYPES.ObjectPattern:
				parseObjectPattern(node)
				break
		}
	}

	function parseArrayExpression(node: ast.ArrayExpression) {
		node.elements.forEach(parseExpression)
	}
}

export function find(code: string, position: number, jsxPropImportChecking: boolean) {
	let token: ExtractedToken | undefined
	let program: ast.Program
	try {
		program = parse(code, { jsx: true, range: true })
	} catch {
		return token
	}

	const ctx = createContext(program, jsxPropImportChecking)
	program.body.forEach(parseStatement)
	return token

	function createContext(program: ast.Program, jsxPropChecking = true) {
		let jsxProp = !jsxPropChecking
		const twTemplate = new Set<string>()
		const themeTemplate = new Set<string>()
		const screenTemplate = new Set<string>()

		for (const node of program.body) {
			switch (node.type) {
				case AST_NODE_TYPES.ImportDeclaration:
					if (node.source.value === twinLabel) {
						jsxProp = true
						for (const clause of node.specifiers) {
							switch (clause.type) {
								case AST_NODE_TYPES.ImportDefaultSpecifier:
									twTemplate.add(clause.local.name)
									break
								case AST_NODE_TYPES.ImportSpecifier:
									if (clause.imported.name === "default") {
										twTemplate.add(clause.local.name)
									} else if (clause.imported.name === ExtractedTokenKind.TwinTheme) {
										themeTemplate.add(clause.local.name)
									} else if (clause.imported.name === ExtractedTokenKind.TwinScreen) {
										screenTemplate.add(clause.local.name)
									}
									break
							}
						}
					}
					break
			}
		}

		return { jsxProp, twTemplate, themeTemplate, screenTemplate }
	}

	function inRange(node: ast.Node): boolean {
		return !(position < node.range[0] + 1 || position >= node.range[1])
	}

	function parseTaggedTemplateExpression(node: ast.TaggedTemplateExpression) {
		if (node.tag.type !== AST_NODE_TYPES.Identifier) {
			parseExpression(node.tag)
			return
		} else if (ctx.twTemplate.has(node.tag.name)) {
			if (node.quasi.quasis.length === 1) {
				const n: ast.TemplateElement = node.quasi.quasis[0]
				if (!inRange(n)) return
				token = {
					kind: ExtractedTokenKind.Twin,
					start: n.range[0] + 1,
					end: n.range[1] - 1,
					value: n.value.cooked,
				}
				return
			}
		} else if (ctx.themeTemplate.has(node.tag.name)) {
			if (node.quasi.quasis.length === 1) {
				const n: ast.TemplateElement = node.quasi.quasis[0]
				if (!inRange(n)) return
				token = {
					kind: ExtractedTokenKind.TwinTheme,
					start: n.range[0] + 1,
					end: n.range[1] - 1,
					value: n.value.cooked,
				}
				return
			}
		} else if (ctx.screenTemplate.has(node.tag.name)) {
			if (node.quasi.quasis.length === 1) {
				const n: ast.TemplateElement = node.quasi.quasis[0]
				if (!inRange(n)) return
				token = {
					kind: ExtractedTokenKind.TwinScreen,
					start: n.range[0] + 1,
					end: n.range[1] - 1,
					value: n.value.cooked,
				}
				return
			}
		} else {
			parseTemplateLiteral(node.quasi)
		}
	}

	function parseCallExpression(node: ast.CallExpression) {
		parseExpression(node.callee)
		for (const a of node.arguments) {
			switch (a.type) {
				case AST_NODE_TYPES.SpreadElement:
					parseExpression(a.argument)
					break
				default:
					parseExpression(a)
			}
		}
	}

	function parseJSXAttribute(node: ast.JSXAttribute) {
		if (node.name.type === AST_NODE_TYPES.JSXIdentifier) {
			if (ctx.jsxProp && node.name.name === ExtractedTokenKind.Twin) {
				if (node.value) getToken(node.value, ExtractedTokenKind.Twin)
			} else if (ctx.jsxProp && node.name.name === ExtractedTokenKind.TwinCssProperty) {
				if (node.value) getToken(node.value, ExtractedTokenKind.TwinCssProperty)
			} else if (node.value && node.value.type !== AST_NODE_TYPES.Literal) {
				parseJSXExpression(node.value)
			}
		}

		return

		function getToken(node: ast.Literal | ast.JSXExpression, kind: ExtractedTokenKind) {
			switch (node.type) {
				case AST_NODE_TYPES.JSXEmptyExpression:
					break
				case AST_NODE_TYPES.Literal:
					if (!inRange(node)) return
					if (typeof node.value === "string") {
						token = {
							kind,
							start: node.range[0] + 1,
							end: node.range[1] - 1,
							value: node.value,
						}
						return
					}
					break
				case AST_NODE_TYPES.JSXExpressionContainer:
					if (node.expression.type === AST_NODE_TYPES.Literal) {
						if (!inRange(node.expression)) return
						if (typeof node.expression.value === "string") {
							token = {
								kind,
								start: node.expression.range[0] + 1,
								end: node.expression.range[1] - 1,
								value: node.expression.value,
							}
						}
					} else if (node.expression.type !== AST_NODE_TYPES.JSXEmptyExpression) {
						parseExpression(node.expression)
					}
					break
				case AST_NODE_TYPES.JSXSpreadChild:
					if (node.expression.type !== AST_NODE_TYPES.JSXEmptyExpression) {
						parseExpression(node.expression)
					}
					break
			}
		}
	}

	function parseJSXElement(node: ast.JSXElement) {
		parseJSXOpeningElement(node.openingElement)
		node.children.forEach(parseJSXChild)
	}

	function parseJSXOpeningElement(node: ast.JSXOpeningElement) {
		for (const attr of node.attributes) {
			switch (attr.type) {
				case AST_NODE_TYPES.JSXAttribute:
					parseJSXAttribute(attr)
					break
				default:
					parseJSXSpreadAttribute(attr)
					break
			}
		}
	}

	function parseJSXChild(node: ast.JSXChild) {
		if (!inRange(node)) return
		switch (node.type) {
			case AST_NODE_TYPES.JSXElement:
				parseJSXElement(node)
				break
			case AST_NODE_TYPES.JSXFragment:
				parseJSXFragment(node)
				break
			case AST_NODE_TYPES.JSXText:
				break
			default:
				parseJSXExpression(node)
				break
		}
	}

	function parseJSXFragment(node: ast.JSXFragment) {
		node.children.forEach(parseJSXChild)
	}

	function parseJSXSpreadAttribute(node: ast.JSXSpreadAttribute) {
		parseExpression(node.argument)
	}

	function parseJSXExpression(node: ast.JSXExpression) {
		switch (node.type) {
			case AST_NODE_TYPES.JSXEmptyExpression:
				break
			case AST_NODE_TYPES.JSXSpreadChild:
				if (node.expression.type !== AST_NODE_TYPES.JSXEmptyExpression) {
					parseExpression(node.expression)
				}
				break
			case AST_NODE_TYPES.JSXExpressionContainer:
				if (node.expression.type !== AST_NODE_TYPES.JSXEmptyExpression) {
					parseExpression(node.expression)
				}
				break
		}
	}

	function parseExportDefaultDeclaration(node: ast.ExportDefaultDeclaration) {
		parseDeclaration(node.declaration)
	}

	function parseVariableDeclaration(node: ast.VariableDeclaration) {
		node.declarations.forEach(parseVariableDeclarator)
	}

	function parseExpression(node: ast.Expression) {
		if (!inRange(node)) return
		// LiteralExpression | LogicalExpression | MemberExpression | MetaProperty | NewExpression | ObjectPattern | Super | ThisExpression | TSAsExpression | TSNonNullExpression | TSTypeAssertion;
		switch (node.type) {
			case AST_NODE_TYPES.TaggedTemplateExpression:
				parseTaggedTemplateExpression(node)
				break
			case AST_NODE_TYPES.TemplateLiteral:
				parseTemplateLiteral(node)
				break
			case AST_NODE_TYPES.SequenceExpression:
				node.expressions.forEach(parseExpression)
				break
			case AST_NODE_TYPES.ArrayExpression:
				parseArrayExpression(node)
				break
			case AST_NODE_TYPES.ArrayPattern:
				parseArrayPattern(node)
				break
			case AST_NODE_TYPES.FunctionExpression:
				parseFunctionExpression(node)
				break
			case AST_NODE_TYPES.ArrowFunctionExpression:
				parseArrowFunctionExpression(node)
				break
			case AST_NODE_TYPES.AssignmentExpression:
				parseExpression(node.right)
				break

			case AST_NODE_TYPES.ConditionalExpression:
				parseExpression(node.consequent)
				parseExpression(node.alternate)
				break
			case AST_NODE_TYPES.LogicalExpression:
				parseExpression(node.right)
				break
			case AST_NODE_TYPES.MemberExpression:
				if (node.property.type !== AST_NODE_TYPES.PrivateIdentifier) {
					parseExpression(node.property)
				}
				break
			case AST_NODE_TYPES.BinaryExpression:
				parseExpression(node.right)
				break
			case AST_NODE_TYPES.UpdateExpression:
				parseExpression(node.argument)
				break
			case AST_NODE_TYPES.AwaitExpression:
				parseExpression(node.argument)
				break
			case AST_NODE_TYPES.YieldExpression:
				if (node.argument) parseExpression(node.argument)
				break
			case AST_NODE_TYPES.ObjectExpression:
				for (const el of node.properties) {
					parseObjectLiteralElement(el)
				}
				break
			case AST_NODE_TYPES.ClassExpression:
				parseClassBody(node.body)
				break
			case AST_NODE_TYPES.ChainExpression:
				parseExpression(node.expression)
				break
			case AST_NODE_TYPES.CallExpression:
				parseCallExpression(node)
				break
			case AST_NODE_TYPES.UnaryExpression:
				parseUnaryExpression(node)
				break
			case AST_NODE_TYPES.ImportExpression:
				parseExpression(node.source)
				break
			case AST_NODE_TYPES.JSXElement:
				parseJSXElement(node)
				break
			case AST_NODE_TYPES.JSXFragment:
				parseJSXFragment(node)
				break
			case AST_NODE_TYPES.Identifier:
				break
			case AST_NODE_TYPES.ThisExpression:
				break
		}
	}

	function parseDeclaration(node: ast.ExportDeclaration | ast.Expression) {
		if (!inRange(node)) return
		switch (node.type) {
			case AST_NODE_TYPES.ClassDeclaration:
				parseClassDeclaration(node)
				break
			case AST_NODE_TYPES.ClassExpression:
				parseClassBody(node.body)
				break
			case AST_NODE_TYPES.FunctionDeclaration:
				parseFunctionDeclaration(node)
				break
			case AST_NODE_TYPES.TSEnumDeclaration:
				parseTSEnumDeclaration(node)
				break
			case AST_NODE_TYPES.VariableDeclaration:
				parseVariableDeclaration(node)
				break
			case AST_NODE_TYPES.TSDeclareFunction:
			case AST_NODE_TYPES.TSInterfaceDeclaration:
			case AST_NODE_TYPES.TSModuleDeclaration:
			case AST_NODE_TYPES.TSTypeAliasDeclaration:
				break
			default:
				parseExpression(node)
		}
	}

	function parseStatement(node: ast.Statement) {
		if (!inRange(node)) return
		switch (node.type) {
			case AST_NODE_TYPES.BlockStatement:
				parseBlockStatement(node)
				break
			case AST_NODE_TYPES.ClassDeclaration:
				parseClassDeclaration(node)
				break
			case AST_NODE_TYPES.DoWhileStatement:
				parseStatement(node.body)
				break
			case AST_NODE_TYPES.ExportDefaultDeclaration:
				parseExportDefaultDeclaration(node)
				break
			case AST_NODE_TYPES.ExpressionStatement:
				parseExpression(node.expression)
				break
			case AST_NODE_TYPES.ForInStatement:
				parseExpression(node.right)
				parseStatement(node.body)
				break
			case AST_NODE_TYPES.ForOfStatement:
				parseExpression(node.right)
				parseStatement(node.body)
				break
			case AST_NODE_TYPES.ForStatement:
				if (node.init) {
					if (node.init.type === AST_NODE_TYPES.VariableDeclaration) parseVariableDeclaration(node.init)
					else parseExpression(node.init)
				}
				if (node.test) {
					parseExpression(node.test)
				}
				if (node.update) {
					parseExpression(node.update)
				}
				parseStatement(node.body)
				break
			case AST_NODE_TYPES.FunctionDeclaration:
				parseFunctionDeclaration(node)
				break
			case AST_NODE_TYPES.IfStatement:
				parseExpression(node.test)
				if (node.alternate) parseStatement(node.alternate)
				parseStatement(node.consequent)
				break
			case AST_NODE_TYPES.ReturnStatement:
				if (node.argument) parseExpression(node.argument)
				break
			case AST_NODE_TYPES.ThrowStatement:
				if (node.argument && node.argument.type !== AST_NODE_TYPES.TSAsExpression) parseStatement(node.argument)
				break
			case AST_NODE_TYPES.SwitchStatement:
				parseExpression(node.discriminant)
				for (const cs of node.cases) {
					if (cs.test) parseExpression(cs.test)
					cs.consequent.forEach(parseStatement)
				}
				break
			case AST_NODE_TYPES.TryStatement:
				parseStatement(node.block)
				if (node.handler) {
					if (node.handler.param) parseBindingName(node.handler.param)
					parseBlockStatement(node.handler.body)
				}
				if (node.finalizer) parseStatement(node.finalizer)
				break
			case AST_NODE_TYPES.TSEnumDeclaration:
				parseTSEnumDeclaration(node)
				break
			case AST_NODE_TYPES.TSExportAssignment:
				parseExpression(node.expression)
				break
			case AST_NODE_TYPES.VariableDeclaration:
				node.declarations.forEach(parseVariableDeclarator)
				break
			case AST_NODE_TYPES.WhileStatement:
				parseExpression(node.test)
				parseStatement(node.body)
				break
			case AST_NODE_TYPES.WithStatement:
				parseExpression(node.object)
				parseStatement(node.body)
				break
			case AST_NODE_TYPES.ExportNamedDeclaration:
				if (node.declaration) parseDeclaration(node.declaration)
				break
			case AST_NODE_TYPES.ImportDeclaration:
			case AST_NODE_TYPES.TSModuleDeclaration:
			case AST_NODE_TYPES.TSNamespaceExportDeclaration:
			case AST_NODE_TYPES.TSTypeAliasDeclaration:
			case AST_NODE_TYPES.TSImportEqualsDeclaration:
			case AST_NODE_TYPES.BreakStatement:
			case AST_NODE_TYPES.ContinueStatement:
			case AST_NODE_TYPES.DebuggerStatement:
			case AST_NODE_TYPES.ExportAllDeclaration:
			case AST_NODE_TYPES.LabeledStatement:
				break
		}
	}

	function parseBlockStatement(node: ast.BlockStatement) {
		node.body.forEach(parseStatement)
	}

	function parseVariableDeclarator(node: ast.VariableDeclarator) {
		parseBindingName(node.id)
		if (node.init) parseExpression(node.init)
	}

	function parseDestructuringPattern(node: ast.DestructuringPattern | null) {
		if (node) {
			if (!inRange(node)) return
			switch (node.type) {
				case AST_NODE_TYPES.ArrayPattern:
					node.elements.forEach(parseDestructuringPattern)
					for (const el of node.elements) {
						if (el) parseDestructuringPattern(el)
					}
					break
				case AST_NODE_TYPES.AssignmentPattern:
					parseExpression(node.right)
					break
			}
		}
	}

	function parseMethodDefinition(node: ast.MethodDefinition) {
		if (node.value.type === AST_NODE_TYPES.FunctionExpression) parseFunctionExpression(node.value)
	}

	function parseArrayPattern(node: ast.ArrayPattern) {
		for (const el of node.elements) {
			if (el) parseDestructuringPattern(el)
		}
	}

	function parseProperty(node: ast.Property) {
		if (node.computed) parseExpression(node.key)
		switch (node.value.type) {
			case AST_NODE_TYPES.AssignmentPattern:
				parseExpression(node.value.right)
				break
			case AST_NODE_TYPES.ArrayPattern:
				parseArrayPattern(node.value)
				break
			case AST_NODE_TYPES.ObjectPattern:
				parseObjectPattern(node.value)
				break
			case AST_NODE_TYPES.Identifier:
				break
			case AST_NODE_TYPES.TSEmptyBodyFunctionExpression:
				break
			default:
				parseExpression(node.value)
		}
	}

	function parseRestElement(node: ast.RestElement) {
		if (node.value) {
			parseExpression(node.value.right)
		}
	}

	function parseObjectPattern(node: ast.ObjectPattern) {
		for (const prop of node.properties) {
			if (prop.type === AST_NODE_TYPES.Property) {
				parseProperty(prop)
			} else {
				parseRestElement(prop)
			}
		}
	}

	function parseObjectLiteralElement(node: ast.ObjectLiteralElement) {
		switch (node.type) {
			case AST_NODE_TYPES.MethodDefinition:
				parseMethodDefinition(node)
				break
			case AST_NODE_TYPES.Property:
				parseProperty(node)
				break
			case AST_NODE_TYPES.SpreadElement:
				parseExpression(node.argument)
				break
		}
	}

	function parseUnaryExpression(node: ast.UnaryExpression) {
		switch (node.argument.type) {
			case AST_NODE_TYPES.Literal:
				break
			case AST_NODE_TYPES.UnaryExpression:
				parseUnaryExpression(node.argument)
				break
			default:
				parseExpression(node.argument)
				break
		}
	}

	function parseTemplateLiteral(node: ast.TemplateLiteral) {
		node.expressions.forEach(parseExpression)
	}

	function parseFunctionDeclaration(node: ast.FunctionDeclaration) {
		parseBlockStatement(node.body)
	}

	function parseTSEnumDeclaration(node: ast.TSEnumDeclaration) {
		for (const member of node.members) {
			parseTSEnumMember(member)
		}
	}

	function parseTSEnumMember(node: ast.TSEnumMember) {
		if (node.initializer) {
			parseExpression(node.initializer)
		}
	}

	function parseFunctionExpression(node: ast.FunctionExpression) {
		parseBlockStatement(node.body)
	}

	function parseArrowFunctionExpression(node: ast.ArrowFunctionExpression) {
		switch (node.body.type) {
			case AST_NODE_TYPES.BlockStatement:
				parseBlockStatement(node.body)
				break
			default:
				parseExpression(node.body)
		}
	}

	function parseClassDeclaration(node: ast.ClassDeclaration) {
		parseClassBody(node.body)
	}

	function parseClassBody(node: ast.ClassBody) {
		for (const el of node.body) {
			parseClassElement(el)
		}
	}

	function parseClassElement(node: ast.ClassElement) {
		switch (node.type) {
			case AST_NODE_TYPES.PropertyDefinition:
				if (node.value) {
					parseExpression(node.value)
				}
				break
			case AST_NODE_TYPES.MethodDefinition:
				if (node.value.type === AST_NODE_TYPES.FunctionExpression) parseFunctionExpression(node.value)
				break
			case AST_NODE_TYPES.StaticBlock:
				node.body.forEach(parseStatement)
				break
		}
	}

	function parseBindingName(node: ast.BindingName) {
		if (!inRange(node)) return
		switch (node.type) {
			case AST_NODE_TYPES.ArrayPattern:
				parseArrayPattern(node)
				break
			case AST_NODE_TYPES.ObjectPattern:
				parseObjectPattern(node)
				break
		}
	}

	function parseArrayExpression(node: ast.ArrayExpression) {
		node.elements.forEach(parseExpression)
	}
}

export const typescriptExtractor: Extractor = {
	findAll(languageId, code, jsxPropImportChecking) {
		return findAll(code, jsxPropImportChecking)
	},
	find(languageId, code, position, hover, jsxPropImportChecking) {
		const pos = position + (hover ? 1 : 0)
		return find(code, pos, jsxPropImportChecking)
	},
}
