export const DEMO_CONSTRAINTS = {
  shareTtlMinutes: 30,
  maxStoredShares: 10,
  viewDedupeMilliseconds: 1500,
  localText: {
    maxBytes: 64 * 1024,
    extensions: ['.txt', '.md'] as const,
  },
} as const

export function formatDemoTextLimit() {
  return `${Math.round(DEMO_CONSTRAINTS.localText.maxBytes / 1024)} KB`
}

export function demoTextFormatLabel() {
  return DEMO_CONSTRAINTS.localText.extensions.join(' · ')
}

export function demoShareTtlLabel() {
  return `${DEMO_CONSTRAINTS.shareTtlMinutes} min`
}
