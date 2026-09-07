import type { VisualReport } from './types'

const STORAGE_PREFIX = 'medatlas:demo:published:'

export function persistPublishedDemoReport(report: VisualReport) {
  if (!report.shareSlug) return

  try {
    window.localStorage.setItem(
      `${STORAGE_PREFIX}${report.shareSlug}`,
      JSON.stringify(report),
    )
  } catch {
    // The demo must keep working when localStorage is disabled.
  }
}

export function readPublishedDemoReport(
  shareSlug: string,
): VisualReport | null {
  try {
    const raw = window.localStorage.getItem(
      `${STORAGE_PREFIX}${shareSlug}`,
    )

    if (!raw) return null

    const report = JSON.parse(raw) as VisualReport

    if (
      report.status !== 'published' ||
      report.shareSlug !== shareSlug
    ) {
      return null
    }

    return report
  } catch {
    return null
  }
}
