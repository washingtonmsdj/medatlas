export type IngestionFailureCode =
  | 'unsupported-extension'
  | 'unsupported-media-type'
  | 'too-large'
  | 'too-short'
  | 'invalid-encoding'
  | 'invalid-signature'
  | 'too-many-pages'
  | 'too-much-text'
  | 'no-extractable-text'
  | 'encrypted-document'
  | 'malformed-document'
  | 'parse-failed'
  | 'read-failed'

export interface IngestedTextDocument {
  source: 'local-file'
  format: 'text' | 'pdf'
  fileName: string
  mimeType: string
  bytes: number
  extractedTextBytes: number
  pageCount?: number
  text: string
}

export type TextDocumentIngestionResult =
  | {
      ok: true
      document: IngestedTextDocument
    }
  | {
      ok: false
      code: IngestionFailureCode
      fileName: string
      mimeType: string
      bytes: number
    }
