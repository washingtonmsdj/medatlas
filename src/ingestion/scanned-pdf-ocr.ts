import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import {
  DEMO_CONSTRAINTS,
  reportSourceByteLength,
  validateDemoReportSource,
} from '../product/constraints'
import type {
  LocalIngestionOptions,
  TextDocumentIngestionResult,
} from './contracts'

GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const PASSWORD_REQUIRED = 'MEDATLAS_PDF_PASSWORD_REQUIRED'
const JPEG_QUALITIES = [0.9, 0.75, 0.6] as const

type IngestionFailure = Exclude<TextDocumentIngestionResult, { ok: true }>
type IngestionSuccess = Extract<TextDocumentIngestionResult, { ok: true }>

function failure(
  file: Pick<File, 'name' | 'type' | 'size'>,
  code: IngestionFailure['code'],
  bytes: number,
): IngestionFailure {
  return {
    ok: false,
    code,
    fileName: file.name,
    mimeType: file.type,
    bytes,
  }
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

function pageRenderScale(width: number, height: number) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return 0
  }

  const limits = DEMO_CONSTRAINTS.localPdfOcr
  const basePixels = width * height
  const pixelScale = Math.sqrt(limits.maxRenderPixelsPerPage / basePixels)
  const dimensionScale = Math.min(
    limits.maxRenderDimension / width,
    limits.maxRenderDimension / height,
  )

  return Math.min(limits.maxRenderScale, pixelScale, dimensionScale)
}

async function canvasToBoundedJpegFile(
  canvas: HTMLCanvasElement,
  sourceFileName: string,
  pageNumber: number,
) {
  const baseName = sourceFileName.replace(/\.pdf$/i, '') || 'laudo'

  for (const quality of JPEG_QUALITIES) {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', quality)
    })

    if (blob && blob.size <= DEMO_CONSTRAINTS.localImage.maxBytes) {
      return new File([blob], `${baseName}-pagina-${pageNumber}.jpg`, {
        type: 'image/jpeg',
      })
    }
  }

  return null
}

function aggregateConfidence(
  successfulPages: readonly IngestionSuccess['document'][],
) {
  const values = successfulPages
    .map((page) => page.ocrConfidence)
    .filter((value): value is number => Number.isFinite(value))

  if (values.length === 0) return undefined
  return values.reduce((total, value) => total + value, 0) / values.length
}

export async function ingestScannedPdfBuffer(
  file: File,
  buffer: ArrayBuffer,
  options: LocalIngestionOptions = {},
): Promise<TextDocumentIngestionResult> {
  if (options.signal?.aborted) {
    return failure(file, 'cancelled', buffer.byteLength)
  }

  const limits = DEMO_CONSTRAINTS.localPdfOcr
  const loadingTask = getDocument({
    data: new Uint8Array(buffer.slice(0)),
    stopAtErrors: true,
    useWorkerFetch: false,
    useWasm: false,
    enableXfa: false,
    disableFontFace: true,
    isOffscreenCanvasSupported: false,
    isImageDecoderSupported: false,
    maxImageSize: limits.maxEmbeddedImagePixels,
  })

  let rejectPassword: ((reason?: unknown) => void) | undefined
  const passwordRequired = new Promise<never>((_, reject) => {
    rejectPassword = reject
  })

  loadingTask.onPassword = () => {
    rejectPassword?.(new Error(PASSWORD_REQUIRED))
  }

  try {
    const pdf = await Promise.race([loadingTask.promise, passwordRequired])

    if (pdf.numPages > limits.maxPages) {
      return failure(file, 'too-many-ocr-pages', buffer.byteLength)
    }

    const { ingestLocalImageFile } = await import('./local-image-ocr')
    const successfulPages: IngestionSuccess['document'][] = []
    let totalRenderPixels = 0

    reportProgress(options, 'Preparando OCR do PDF escaneado', 0)

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      if (options.signal?.aborted) {
        return failure(file, 'cancelled', buffer.byteLength)
      }

      const page = await pdf.getPage(pageNumber)
      const baseViewport = page.getViewport({ scale: 1 })
      const scale = pageRenderScale(baseViewport.width, baseViewport.height)

      if (!(scale > 0)) {
        page.cleanup()
        return failure(file, 'render-failed', buffer.byteLength)
      }

      const viewport = page.getViewport({ scale })
      const width = Math.max(1, Math.ceil(viewport.width))
      const height = Math.max(1, Math.ceil(viewport.height))
      const renderPixels = width * height

      if (renderPixels > limits.maxRenderPixelsPerPage) {
        page.cleanup()
        return failure(file, 'too-many-pixels', buffer.byteLength)
      }

      totalRenderPixels += renderPixels
      if (totalRenderPixels > limits.maxTotalRenderPixels) {
        page.cleanup()
        return failure(file, 'too-many-pixels', buffer.byteLength)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d', { alpha: false })

      if (!context) {
        page.cleanup()
        return failure(file, 'render-failed', buffer.byteLength)
      }

      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, width, height)

      const renderTask = page.render({
        canvas,
        viewport,
        intent: 'display',
      })
      const cancelRender = () => renderTask.cancel()
      options.signal?.addEventListener('abort', cancelRender, { once: true })

      try {
        reportProgress(
          options,
          `PDF escaneado · página ${pageNumber}/${pdf.numPages} · renderizando`,
          (pageNumber - 1) / pdf.numPages,
        )

        await renderTask.promise

        if (options.signal?.aborted) {
          return failure(file, 'cancelled', buffer.byteLength)
        }

        const pageFile = await canvasToBoundedJpegFile(
          canvas,
          file.name,
          pageNumber,
        )

        if (!pageFile) {
          return failure(file, 'render-failed', buffer.byteLength)
        }

        const pageResult = await ingestLocalImageFile(pageFile, {
          signal: options.signal,
          onOcrProgress: ({ status, progress }) => {
            reportProgress(
              options,
              `PDF escaneado · página ${pageNumber}/${pdf.numPages} · ${status}`,
              (pageNumber - 1 + progress) / pdf.numPages,
            )
          },
        })

        if (!pageResult.ok) {
          if (pageResult.code === 'no-extractable-text') {
            continue
          }

          if (
            pageResult.code === 'cancelled' ||
            pageResult.code === 'ocr-runtime-unavailable' ||
            pageResult.code === 'ocr-failed' ||
            pageResult.code === 'too-much-text'
          ) {
            return failure(file, pageResult.code, buffer.byteLength)
          }

          return failure(file, 'render-failed', buffer.byteLength)
        }

        successfulPages.push(pageResult.document)

        const partialText = successfulPages
          .map((document) => document.text)
          .join('\n\n')
        if (
          reportSourceByteLength(partialText) > limits.maxExtractedTextBytes
        ) {
          return failure(file, 'too-much-text', buffer.byteLength)
        }
      } catch {
        if (options.signal?.aborted) {
          return failure(file, 'cancelled', buffer.byteLength)
        }
        return failure(file, 'render-failed', buffer.byteLength)
      } finally {
        options.signal?.removeEventListener('abort', cancelRender)
        canvas.width = 0
        canvas.height = 0
        page.cleanup()
      }
    }

    const text = successfulPages
      .map((document) => document.text)
      .join('\n\n')
      .trim()
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

    reportProgress(options, 'OCR do PDF concluído', 1)

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
        ocrPageCount: pdf.numPages,
        ocrConfidence: aggregateConfidence(successfulPages),
        text,
      },
    }
  } catch (error) {
    if (options.signal?.aborted) {
      return failure(file, 'cancelled', buffer.byteLength)
    }
    if (
      error instanceof Error &&
      (error.message === PASSWORD_REQUIRED || error.name === 'PasswordException')
    ) {
      return failure(file, 'encrypted-document', buffer.byteLength)
    }
    return failure(file, 'render-failed', buffer.byteLength)
  } finally {
    await loadingTask.destroy()
  }
}
