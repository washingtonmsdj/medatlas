export type IngestionFailureCode =
  | 'unsupported-extension'
  | 'unsupported-media-type'
  | 'too-large'
  | 'too-short'
  | 'invalid-encoding'
  | 'read-failed'

export interface IngestedTextDocument {
  source: 'local-file'
  fileName: string
  mimeType: string
  bytes: number
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
