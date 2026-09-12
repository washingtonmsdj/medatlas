import {
  DEMO_CONSTRAINTS,
  isDemoPdfFilenameAllowed,
} from '../product/constraints'
import type { TextDocumentIngestionResult } from './contracts'
import {
  ingestLocalTextFile,
  LOCAL_TEXT_FILE_ACCEPT,
} from './local-text'

export const LOCAL_REPORT_FILE_ACCEPT = [
  LOCAL_TEXT_FILE_ACCEPT,
  ...DEMO_CONSTRAINTS.localPdf.extensions,
  ...DEMO_CONSTRAINTS.localPdf.mimeTypes,
].join(',')

export async function ingestLocalReportFile(
  file: File,
): Promise<TextDocumentIngestionResult> {
  if (isDemoPdfFilenameAllowed(file.name)) {
    const { ingestLocalPdfFile } = await import('./pdf')
    return ingestLocalPdfFile(file)
  }

  return ingestLocalTextFile(file)
}
