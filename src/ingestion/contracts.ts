export type IngestionFailureCode =
  | 'unsupported-extension'
  | 'unsupported-media-type'
  | 'too-large'
  | 'too-short'
  | 'invalid-encoding'
  | 'invalid-signature'
  | 'invalid-dimensions'
  | 'too-many-pixels'
  | 'too-many-pages'
  | 'too-many-ocr-pages'
  | 'too-much-text'
  | 'no-extractable-text'
  | 'encrypted-document'
  | 'malformed-document'
  | 'render-failed'
  | 'ocr-runtime-unavailable'
  | 'ocr-failed'
  | 'cancelled'
  | 'parse-failed'
  | 'read-failed'

export interface IngestedTextDocument {
  source: 'local-file'
  format: 'text' | 'pdf' | 'image'
  fileName: string
  mimeType: string
  bytes: number
  extractedTextBytes: number
  pageCount?: number
  ocrPageCount?: number
  width?: number
  height?: number
  ocrConfidence?: number
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

export interface OcrProgress {
  status: string
  progress: number
}

export interface LocalIngestionOptions {
  signal?: AbortSignal
  onOcrProgress?: (progress: OcrProgress) => void
}
