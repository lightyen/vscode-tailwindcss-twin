import type { Connection } from "vscode-languageserver"
import { documents } from "~/server"
import updateDocumentColor from "./updateDocumentColor"

export const documentColor: Parameters<Connection["onDocumentColor"]>[0] = async params => {
	const document = documents.get(params.textDocument.uri)
	if (!document) {
		return null
	}
	updateDocumentColor(document)
	return null
}

export default documentColor
