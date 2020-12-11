import { documents } from "~/server"
import { validateTextDocument } from "~/diagnostics"

export const didOpenTextDocument: Parameters<typeof documents.onDidOpen>[0] = async params =>
	validateTextDocument(params.document)
export const didChangeChangeTextDocument: Parameters<typeof documents.onDidChangeContent>[0] = async params =>
	validateTextDocument(params.document)
