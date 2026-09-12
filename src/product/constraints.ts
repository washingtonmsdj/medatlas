export const DEMO_CONSTRAINTS = {
  shareTtlMinutes: 30,
  maxStoredShares: 10,
  viewDedupeMilliseconds: 1500,
  localText: {
    minCharacters: 3,
    maxBytes: 64 * 1024,
    extensions: ['.txt', '.md'] as const,
    mimeTypes: ['text/plain', 'text/markdown', 'text/x-markdown'] as const,
  },
  localPdf: {
    maxBytes: 8 * 1024 * 1024,
    maxPages: 50,
    maxExtractedTextBytes: 64 * 1024,
    extensions: ['.pdf'] as const,
    mimeTypes: ['application/pdf'] as const,
  },
  patientExplanation: {
    maxCharacters: 4000,
  },
} as const

export type DemoReportSourceValidation =
  | { ok: true; bytes: number }
  | {
      ok: false
      bytes: number
      reason: 'too-short' | 'too-large'
    }

export type DemoPatientExplanationValidation =
  | { ok: true; characters: number }
  | {
      ok: false
      characters: number
      reason: 'too-large'
    }

export function reportSourceByteLength(value: string) {
  return new TextEncoder().encode(value).byteLength
}

export function patientExplanationCharacterLength(value: string) {
  return Array.from(value).length
}

export function validateDemoReportSource(
  value: string,
): DemoReportSourceValidation {
  const bytes = reportSourceByteLength(value)

  if (value.trim().length < DEMO_CONSTRAINTS.localText.minCharacters) {
    return { ok: false, bytes, reason: 'too-short' }
  }

  if (bytes > DEMO_CONSTRAINTS.localText.maxBytes) {
    return { ok: false, bytes, reason: 'too-large' }
  }

  return { ok: true, bytes }
}

export function validateDemoPatientExplanation(
  value: string,
): DemoPatientExplanationValidation {
  const characters = patientExplanationCharacterLength(value)

  if (characters > DEMO_CONSTRAINTS.patientExplanation.maxCharacters) {
    return { ok: false, characters, reason: 'too-large' }
  }

  return { ok: true, characters }
}

function filenameHasExtension(
  filename: string,
  extensions: readonly string[],
) {
  const normalized = filename.toLowerCase()
  return extensions.some((extension) => normalized.endsWith(extension))
}

function mimeIsAllowed(mimeType: string, allowedMimeTypes: readonly string[]) {
  const normalized = mimeType.trim().toLowerCase()
  return (
    normalized.length === 0 ||
    allowedMimeTypes.some((allowedMimeType) => allowedMimeType === normalized)
  )
}

export function isDemoTextFilenameAllowed(filename: string) {
  return filenameHasExtension(filename, DEMO_CONSTRAINTS.localText.extensions)
}

export function isDemoTextMimeAllowed(mimeType: string) {
  return mimeIsAllowed(mimeType, DEMO_CONSTRAINTS.localText.mimeTypes)
}

export function isDemoPdfFilenameAllowed(filename: string) {
  return filenameHasExtension(filename, DEMO_CONSTRAINTS.localPdf.extensions)
}

export function isDemoPdfMimeAllowed(mimeType: string) {
  return mimeIsAllowed(mimeType, DEMO_CONSTRAINTS.localPdf.mimeTypes)
}

export function formatDemoTextLimit() {
  return `${Math.round(DEMO_CONSTRAINTS.localText.maxBytes / 1024)} KB`
}

export function formatDemoPdfFileLimit() {
  return `${Math.round(DEMO_CONSTRAINTS.localPdf.maxBytes / 1024 / 1024)} MB`
}

export function formatDemoPdfPageLimit() {
  return `${DEMO_CONSTRAINTS.localPdf.maxPages} páginas`
}

export function formatDemoPatientExplanationLimit() {
  return `${DEMO_CONSTRAINTS.patientExplanation.maxCharacters.toLocaleString('pt-BR')} caracteres`
}

export function demoTextFormatLabel() {
  return DEMO_CONSTRAINTS.localText.extensions.join(' · ')
}

export function demoReportFileFormatLabel() {
  return [
    ...DEMO_CONSTRAINTS.localText.extensions,
    ...DEMO_CONSTRAINTS.localPdf.extensions,
  ].join(' · ')
}

export function demoShareTtlLabel() {
  return `${DEMO_CONSTRAINTS.shareTtlMinutes} min`
}
