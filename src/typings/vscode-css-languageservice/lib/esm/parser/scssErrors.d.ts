declare module "vscode-css-languageservice/lib/esm/parser/scssErrors" {
	import * as nodes from "vscode-css-languageservice/lib/esm/parser/cssNodes"
	export class SCSSIssueType implements nodes.IRule {
		id: string
		message: string
		constructor(id: string, message: string)
	}
	export const SCSSParseError: {
		FromExpected: SCSSIssueType
		ThroughOrToExpected: SCSSIssueType
		InExpected: SCSSIssueType
	}
}
