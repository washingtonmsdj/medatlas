import {
  DEMO_CONSTRAINTS,
  isDemoImageFilenameAllowed,
  isDemoImageMimeAllowed,
  validateDemoReportSource,
} from '../product/constraints'
import type {
  LocalIngestionOptions,
  TextDocumentIngestionResult,
} from './contracts'
import {
  localImageKindFromFilename,
  localImageMimeMatchesKind,
  parseLocalImageMetadata,
} from './image-metadata'

type OcrWorker = {
  recognize(image: File): Promise<{
    data: {
      text: string
      confidence: number
    }
  }>
  terminate(): Promise<unknown>
}

function failure(
  file: File,
  code: Exclude<TextDocumentIngestionResult, { ok: true }>['code'],
  bytes = file.size,
): TextDocumentIngestionResult {
  return {
    ok: false,
    code,
    fileName: file.name,
    mimeType: file.type,
    bytes,
  }
}

function normalizeBaseUrl(value: string) {
  if (!value) return '/'
  return value.endsWith('/') ? value : `${value}/`
}

function normalizeOcrText(value: string) {
  return value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[\t ]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function reportProgress(
  options: LocalIngestionOptions,
  status: string,
  progress: number,
) {
  const normalized = Number.isFinite(progress)
    ? Math.max(0, Math.min(1, progress))
    : 0
  options.onOcrProgress?.({ status, progress: normalized })
}

async function terminateWorker(worker: OcrWorker | null) {
  if (!worker) return
  try {
    await worker.terminate()
  } catch {
    // Worker teardown must not replace the primary ingestion result.
  }
}

export async function ingestLocalImageFile(
  file: File,
  options: LocalIngestionOptions = {},
): Promise<TextDocumentIngestionResult> {
  if (!isDemoImageFilenameAllowed(file.name)) {
    return failure(file, 'unsupported-extension')
  }

  const expectedKind = localImageKindFromFilename(file.name)
  if (!expectedKind) {
    return failure(file, 'unsupported-extension')
  }

  if (
    !isDemoImageMimeAllowed(file.type) ||
    !localImageMimeMatchesKind(file.type, expectedKind)
  ) {
    return failure(file, 'unsupported-media-type')
  }

  if (file.size > DEMO_CONSTRAINTS.localImage.maxBytes) {
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

  if (buffer.byteLength > DEMO_CONSTRAINTS.localImage.maxBytes) {
    return failure(file, 'too-large', buffer.byteLength)
  }

  const metadata = parseLocalImageMetadata(
    new Uint8Array(buffer),
    expectedKind,
  )

  if (!metadata.ok) {
    return failure(file, metadata.reason, buffer.byteLength)
  }

  if (
    metadata.width > DEMO_CONSTRAINTS.localImage.maxDimension ||
    metadata.height > DEMO_CONSTRAINTS.localImage.maxDimension ||
    metadata.width * metadata.height > DEMO_CONSTRAINTS.localImage.maxPixels
  ) {
    return failure(file, 'too-many-pixels', buffer.byteLength)
  }

  if (options.signal?.aborted) {
    return failure(file, 'cancelled', buffer.byteLength)
  }

  const baseUrl = normalizeBaseUrl(import.meta.env.BASE_URL)
  const ocrRoot = `${baseUrl}ocr-assets`
  let worker: OcrWorker | null = null
  let runtimeReady = false
  let abortRequested = false

  const onAbort = () => {
    abortRequested = true
    void terminateWorker(worker)
  }

  options.signal?.addEventListener('abort', onAbort, { once: true })

  try {
    reportProgress(options, 'Carregando OCR local', 0)

    const { createWorker, OEM } = await import('tesseract.js')

    if (options.signal?.aborted || abortRequested) {
      return failure(file, 'cancelled', buffer.byteLength)
    }

    worker = await createWorker('por', OEM.LSTM_ONLY, {
      workerPath: `${ocrRoot}/worker.min.js`,
      corePath: `${ocrRoot}/core`,
      langPath: `${ocrRoot}/lang`,
      gzip: true,
      logger: (message) => {
        if (typeof message.status !== 'string') return
        reportProgress(options, message.status, message.progress)
      },
    })
    runtimeReady = true

    if (options.signal?.aborted || abortRequested) {
      return failure(file, 'cancelled', buffer.byteLength)
    }

    const result = await worker.recognize(file)

    if (options.signal?.aborted || abortRequested) {
      return failure(file, 'cancelled', buffer.byteLength)
    }

    const text = normalizeOcrText(result.data.text)
    const validation = validateDemoReportSource(text)

    if (!validation.ok) {
      return failure(
        file,
        validation.reason === 'too-large'
          ? 'too-much-text'
          : 'no-extractable-text',
        buffer.byteLength,
      )
    }

    if (validation.bytes > DEMO_CONSTRAINTS.localImage.maxExtractedTextBytes) {
      return failure(file, 'too-much-text', buffer.byteLength)
    }

    reportProgress(options, 'OCR concluído', 1)

    return {
      ok: true,
      document: {
        source: 'local-file',
        format: 'image',
        fileName: file.name,
        mimeType: file.type,
        bytes: buffer.byteLength,
        extractedTextBytes: validation.bytes,
        width: metadata.width,
        height: metadata.height,
        ocrConfidence: Number.isFinite(result.data.confidence)
          ? Math.max(0, Math.min(100, result.data.confidence))
          : undefined,
        text,
      },
    }
  } catch {
    if (options.signal?.aborted || abortRequested) {
      return failure(file, 'cancelled', buffer.byteLength)
    }

    return failure(
      file,
      runtimeReady ? 'ocr-failed' : 'ocr-runtime-unavailable',
      buffer.byteLength,
    )
  } finally {
    options.signal?.removeEventListener('abort', onAbort)
    await terminateWorker(worker)
  }
}
