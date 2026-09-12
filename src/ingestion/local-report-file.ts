import {
  DEMO_CONSTRAINTS,
  isDemoImageFilenameAllowed,
  isDemoPdfFilenameAllowed,
} from '../product/constraints'
import type {
  LocalIngestionOptions,
  TextDocumentIngestionResult,
} from './contracts'
import {
  ingestLocalTextFile,
  LOCAL_TEXT_FILE_ACCEPT,
} from './local-text'

export const LOCAL_REPORT_FILE_ACCEPT = [
  LOCAL_TEXT_FILE_ACCEPT,
  ...DEMO_CONSTRAINTS.localPdf.extensions,
  ...DEMO_CONSTRAINTS.localPdf.mimeTypes,
  ...DEMO_CONSTRAINTS.localImage.extensions,
  ...DEMO_CONSTRAINTS.localImage.mimeTypes,
].join(',')

export async function ingestLocalReportFile(
  file: File,
  options: LocalIngestionOptions = {},
): Promise<TextDocumentIngestionResult> {
  if (isDemoPdfFilenameAllowed(file.name)) {
    const { ingestLocalPdfFile } = await import('./pdf')
    return ingestLocalPdfFile(file)
  }

  if (isDemoImageFilenameAllowed(file.name)) {
    const { ingestLocalImageFile } = await import('./local-image-ocr')
    return ingestLocalImageFile(file, options)
  }

  return ingestLocalTextFile(file)
}
