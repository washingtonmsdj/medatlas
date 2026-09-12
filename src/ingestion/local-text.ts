import {
  DEMO_CONSTRAINTS,
  isDemoTextFilenameAllowed,
  isDemoTextMimeAllowed,
  validateDemoReportSource,
} from '../product/constraints'
import type { TextDocumentIngestionResult } from './contracts'

export const LOCAL_TEXT_FILE_ACCEPT = [
  ...DEMO_CONSTRAINTS.localText.extensions,
  ...DEMO_CONSTRAINTS.localText.mimeTypes,
].join(',')

function failure(
  file: Pick<File, 'name' | 'type' | 'size'>,
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

export async function ingestLocalTextFile(
  file: File,
): Promise<TextDocumentIngestionResult> {
  if (!isDemoTextFilenameAllowed(file.name)) {
    return failure(file, 'unsupported-extension')
  }

  if (!isDemoTextMimeAllowed(file.type)) {
    return failure(file, 'unsupported-media-type')
  }

  if (file.size > DEMO_CONSTRAINTS.localText.maxBytes) {
    return failure(file, 'too-large')
  }

  let buffer: ArrayBuffer

  try {
    buffer = await file.arrayBuffer()
  } catch {
    return failure(file, 'read-failed')
  }

  if (buffer.byteLength > DEMO_CONSTRAINTS.localText.maxBytes) {
    return failure(file, 'too-large', buffer.byteLength)
  }

  let text: string

  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  } catch {
    return failure(file, 'invalid-encoding', buffer.byteLength)
  }

  const validation = validateDemoReportSource(text)

  if (!validation.ok) {
    return failure(file, validation.reason, validation.bytes)
  }

  return {
    ok: true,
    document: {
      source: 'local-file',
      fileName: file.name,
      mimeType: file.type,
      bytes: validation.bytes,
      text,
    },
  }
}
