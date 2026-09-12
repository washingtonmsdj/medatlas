import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import {
  DEMO_CONSTRAINTS,
  isDemoPdfFilenameAllowed,
  isDemoPdfMimeAllowed,
  reportSourceByteLength,
  validateDemoReportSource,
} from '../product/constraints'
import type {
  LocalIngestionOptions,
  TextDocumentIngestionResult,
} from './contracts'

GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d] as const
const PASSWORD_REQUIRED = 'MEDATLAS_PDF_PASSWORD_REQUIRED'

type IngestionFailure = Exclude<TextDocumentIngestionResult, { ok: true }>

function failure(
  file: Pick<File, 'name' | 'type' | 'size'>,
  code: IngestionFailure['code'],
  bytes = file.size,
): IngestionFailure {
  return {
    ok: false,
    code,
    fileName: file.name,
    mimeType: file.type,
    bytes,
  }
}

function hasPdfSignature(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(
    buffer,
    0,
    Math.min(buffer.byteLength, PDF_SIGNATURE.length),
  )
  return (
    bytes.length === PDF_SIGNATURE.length &&
    PDF_SIGNATURE.every((value, index) => bytes[index] === value)
  )
}

function textItemValue(item: unknown) {
  if (!item || typeof item !== 'object' || !('str' in item)) return ''
  const value = (item as { str?: unknown }).str
  return typeof value === 'string' ? value : ''
}

function normalizePageText(items: readonly unknown[]) {
  return items
    .map(textItemValue)
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function classifyPdfError(error: unknown): IngestionFailure['code'] {
  if (error instanceof Error) {
    if (error.message === PASSWORD_REQUIRED || error.name === 'PasswordException') {
      return 'encrypted-document'
    }

    if (
      error.name === 'InvalidPDFException' ||
      error.name === 'MissingPDFException' ||
      error.name === 'UnexpectedResponseException'
    ) {
      return 'malformed-document'
    }
  }

  return 'parse-failed'
}

export async function ingestLocalPdfFile(
  file: File,
  options: LocalIngestionOptions = {},
): Promise<TextDocumentIngestionResult> {
  if (!isDemoPdfFilenameAllowed(file.name)) {
    return failure(file, 'unsupported-extension')
  }

  if (!isDemoPdfMimeAllowed(file.type)) {
    return failure(file, 'unsupported-media-type')
  }

  if (file.size > DEMO_CONSTRAINTS.localPdf.maxBytes) {
    return failure(file, 'too-large')
  }

  if (options.signal?.aborted) {
    return failure(file, 'cancelled')
  }

  let buffer: ArrayBuffer

  try {
    buffer = await file.arrayBuffer()
  } catch {
    return failure(file, 'read-failed')
  }

  if (buffer.byteLength > DEMO_CONSTRAINTS.localPdf.maxBytes) {
    return failure(file, 'too-large', buffer.byteLength)
  }

  if (!hasPdfSignature(buffer)) {
    return failure(file, 'invalid-signature', buffer.byteLength)
  }

  const loadingTask = getDocument({
    data: new Uint8Array(buffer.slice(0)),
    stopAtErrors: true,
    useWorkerFetch: false,
    useWasm: false,
    enableXfa: false,
    disableFontFace: true,
    isOffscreenCanvasSupported: false,
    isImageDecoderSupported: false,
    maxImageSize: 0,
  })

  let rejectPassword: ((reason?: unknown) => void) | undefined
  const passwordRequired = new Promise<never>((_, reject) => {
    rejectPassword = reject
  })

  loadingTask.onPassword = () => {
    rejectPassword?.(new Error(PASSWORD_REQUIRED))
  }

  let pageCount = 0
  let needsScannedPdfOcr = false

  try {
    const pdf = await Promise.race([loadingTask.promise, passwordRequired])
    pageCount = pdf.numPages

    if (pdf.numPages > DEMO_CONSTRAINTS.localPdf.maxPages) {
      return failure(file, 'too-many-pages', buffer.byteLength)
    }

    const pages: string[] = []

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      if (options.signal?.aborted) {
        return failure(file, 'cancelled', buffer.byteLength)
      }

      const page = await pdf.getPage(pageNumber)

      try {
        const content = await page.getTextContent()
        const pageText = normalizePageText(content.items)

        if (pageText) pages.push(pageText)
      } finally {
        page.cleanup()
      }

      const partialText = pages.join('\n\n')
      if (
        reportSourceByteLength(partialText) >
        DEMO_CONSTRAINTS.localPdf.maxExtractedTextBytes
      ) {
        return failure(file, 'too-much-text', buffer.byteLength)
      }
    }

    const text = pages.join('\n\n').trim()
    const validation = validateDemoReportSource(text)

    if (validation.ok) {
      return {
        ok: true,
        document: {
          source: 'local-file',
          format: 'pdf',
          fileName: file.name,
          mimeType: file.type,
          bytes: buffer.byteLength,
          extractedTextBytes: validation.bytes,
          pageCount: pdf.numPages,
          text,
        },
      }
    }

    if (validation.reason === 'too-large') {
      return failure(file, 'too-much-text', buffer.byteLength)
    }

    needsScannedPdfOcr = true
  } catch (error) {
    return failure(file, classifyPdfError(error), buffer.byteLength)
  } finally {
    await loadingTask.destroy()
  }

  if (!needsScannedPdfOcr || pageCount < 1) {
    return failure(file, 'no-extractable-text', buffer.byteLength)
  }

  if (options.signal?.aborted) {
    return failure(file, 'cancelled', buffer.byteLength)
  }

  const { ingestScannedPdfBuffer } = await import('./scanned-pdf-ocr')
  return ingestScannedPdfBuffer(file, buffer, options)
}
