declare module "vscode-css-languageservice/lib/esm/services/scssNavigation" {
	import { DocumentContext, FileSystemProvider } from "vscode-css-languageservice/lib/esm/cssLanguageTypes"
	import * as nodes from "vscode-css-languageservice/lib/esm/parser/cssNodes"
	import { CSSNavigation } from "vscode-css-languageservice/lib/esm/services/cssNavigation"
	export class SCSSNavigation extends CSSNavigation {
		constructor(fileSystemProvider: FileSystemProvider | undefined)
		protected isRawStringDocumentLinkNode(node: nodes.Node): boolean
		protected resolveRelativeReference(
			ref: string,
			documentUri: string,
			documentContext: DocumentContext,
			isRawLink?: boolean,
		): Promise<string | undefined>
	}
}
