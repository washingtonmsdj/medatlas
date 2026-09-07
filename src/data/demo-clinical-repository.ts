import type {
  ClinicalRepository,
  ClinicalRepositoryDescriptor,
} from './clinical-repository'
import type { VisualReport } from '../domain/types'

const STORAGE_PREFIX = 'medatlas:demo:published:'
const DEMO_SHARE_SCHEMA = 'medatlas.demo-share/1'
const DEMO_SHARE_TTL_MS = 30 * 60 * 1000
const MAX_STORED_DEMO_SHARES = 10

interface StoredDemoShare {
  schema: typeof DEMO_SHARE_SCHEMA
  createdAt: string
  expiresAt: string
  report: VisualReport
}

const memoryShares = new Map<
  string,
  { expiresAt: number; report: VisualReport }
>()

export const demoRepositoryDescriptor: ClinicalRepositoryDescriptor = {
  mode: 'demo',
  label: 'Demonstração local · expira em 30 min',
  syntheticOnly: true,
}

function randomToken(bytes = 32) {
  const buffer = new Uint8Array(bytes)
  crypto.getRandomValues(buffer)

  return Array.from(buffer, (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

function storageEntries() {
  const entries: Array<{
    key: string
    createdAt: number
    expiresAt: number
  }> = []

  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index)
      if (!key?.startsWith(STORAGE_PREFIX)) continue

      const raw = window.localStorage.getItem(key)
      if (!raw) continue

      try {
        const parsed = JSON.parse(raw) as Partial<StoredDemoShare>
        const createdAt = Date.parse(parsed.createdAt ?? '')
        const expiresAt = Date.parse(parsed.expiresAt ?? '')

        if (
          parsed.schema !== DEMO_SHARE_SCHEMA ||
          !Number.isFinite(createdAt) ||
          !Number.isFinite(expiresAt)
        ) {
          window.localStorage.removeItem(key)
          continue
        }

        entries.push({ key, createdAt, expiresAt })
      } catch {
        window.localStorage.removeItem(key)
      }
    }
  } catch {
    return []
  }

  return entries
}

function pruneExpiredAndExcessShares(now = Date.now()) {
  const entries = storageEntries()

  for (const entry of entries) {
    if (entry.expiresAt <= now) {
      try {
        window.localStorage.removeItem(entry.key)
      } catch {
        // Best-effort cleanup only.
      }
    }
  }

  const remaining = entries
    .filter((entry) => entry.expiresAt > now)
    .sort((a, b) => b.createdAt - a.createdAt)

  for (const entry of remaining.slice(MAX_STORED_DEMO_SHARES)) {
    try {
      window.localStorage.removeItem(entry.key)
    } catch {
      // Best-effort cleanup only.
    }
  }

  for (const [token, entry] of memoryShares) {
    if (entry.expiresAt <= now) {
      memoryShares.delete(token)
    }
  }
}

function persist(token: string, report: VisualReport) {
  const createdAt = Date.now()
  const expiresAt = createdAt + DEMO_SHARE_TTL_MS

  memoryShares.set(token, { expiresAt, report })
  pruneExpiredAndExcessShares(createdAt)

  const stored: StoredDemoShare = {
    schema: DEMO_SHARE_SCHEMA,
    createdAt: new Date(createdAt).toISOString(),
    expiresAt: new Date(expiresAt).toISOString(),
    report,
  }

  try {
    window.localStorage.setItem(
      `${STORAGE_PREFIX}${token}`,
      JSON.stringify(stored),
    )
    pruneExpiredAndExcessShares(createdAt)
  } catch {
    // In-memory sharing remains available in the current tab/session.
  }
}

function read(token: string): VisualReport | null {
  const now = Date.now()
  pruneExpiredAndExcessShares(now)

  const inMemory = memoryShares.get(token)
  if (inMemory) {
    if (inMemory.expiresAt > now) return inMemory.report
    memoryShares.delete(token)
  }

  try {
    const key = `${STORAGE_PREFIX}${token}`
    const raw = window.localStorage.getItem(key)

    if (!raw) return null

    const stored = JSON.parse(raw) as Partial<StoredDemoShare>

    if (
      stored.schema !== DEMO_SHARE_SCHEMA ||
      !stored.report ||
      Date.parse(stored.expiresAt ?? '') <= now ||
      stored.report.status !== 'published' ||
      stored.report.shareSlug !== token
    ) {
      window.localStorage.removeItem(key)
      return null
    }

    const expiresAt = Date.parse(stored.expiresAt!)
    memoryShares.set(token, {
      expiresAt,
      report: stored.report,
    })

    return stored.report
  } catch {
    return null
  }
}

export class DemoClinicalRepository implements ClinicalRepository {
  async publishReport(report: VisualReport): Promise<VisualReport> {
    if (report.finding.anatomyReviewRequired) {
      throw new Error(
        'A anatomia precisa ser confirmada para o texto atual antes da publicação.',
      )
    }

    if (report.finding.explanationReviewRequired) {
      throw new Error(
        'A explicação precisa ser revisada antes da publicação.',
      )
    }

    if (!report.finding.atlasConceptId) {
      throw new Error(
        'Uma estrutura anatômica precisa ser confirmada antes da publicação.',
      )
    }

    if (!report.finding.patientExplanation.trim()) {
      throw new Error(
        'A explicação para o paciente não pode estar vazia.',
      )
    }

    const token = randomToken()

    const published: VisualReport = {
      ...report,
      status: 'published',
      shareSlug: token,
    }

    persist(token, published)
    return published
  }

  async resolvePatientShare(
    token: string,
  ): Promise<VisualReport | null> {
    if (!/^[0-9a-f]{64}$/.test(token)) {
      return null
    }

    return read(token)
  }
}

export const demoClinicalRepository = new DemoClinicalRepository()
