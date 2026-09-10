export const DEMO_CONSTRAINTS = {
  shareTtlMinutes: 30,
  maxStoredShares: 10,
  viewDedupeMilliseconds: 1500,
  localText: {
    minCharacters: 3,
    maxBytes: 64 * 1024,
    extensions: ['.txt', '.md'] as const,
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

export function isDemoTextFilenameAllowed(filename: string) {
  const normalized = filename.toLowerCase()
  return DEMO_CONSTRAINTS.localText.extensions.some((extension) =>
    normalized.endsWith(extension),
  )
}

export function formatDemoTextLimit() {
  return `${Math.round(DEMO_CONSTRAINTS.localText.maxBytes / 1024)} KB`
}

export function formatDemoPatientExplanationLimit() {
  return `${DEMO_CONSTRAINTS.patientExplanation.maxCharacters.toLocaleString('pt-BR')} caracteres`
}

export function demoTextFormatLabel() {
  return DEMO_CONSTRAINTS.localText.extensions.join(' · ')
}

export function demoShareTtlLabel() {
  return `${DEMO_CONSTRAINTS.shareTtlMinutes} min`
}
