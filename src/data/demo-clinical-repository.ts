import type {
  ClinicalReportViewStat,
  ClinicalRepository,
  ClinicalRepositoryDescriptor,
  ClinicalUsageSummary,
} from './clinical-repository'
import type { VisualReport } from '../domain/types'
import { DEMO_CONSTRAINTS, demoShareTtlLabel } from '../product/constraints'

const STORAGE_PREFIX = 'medatlas:demo:published:'
const DEMO_SHARE_SCHEMA = 'medatlas.demo-share/1'
const DEMO_SHARE_TTL_MS = DEMO_CONSTRAINTS.shareTtlMinutes * 60 * 1000
const DEMO_VIEW_DEDUPE_MS = DEMO_CONSTRAINTS.viewDedupeMilliseconds
const MAX_STORED_DEMO_SHARES = DEMO_CONSTRAINTS.maxStoredShares

interface StoredDemoShare {
  schema: typeof DEMO_SHARE_SCHEMA
  createdAt: string
  expiresAt: string
  report: VisualReport
  viewCount?: number
  lastViewedAt?: string
}

interface MemoryDemoShare {
  createdAt: number
  expiresAt: number
  report: VisualReport
  viewCount: number
  lastViewedAt?: string
}

interface DemoShareEntry {
  token: string
  key?: string
  createdAt: number
  expiresAt: number
  report: VisualReport
  viewCount: number
  lastViewedAt?: string
}

const memoryShares = new Map<string, MemoryDemoShare>()

export const demoRepositoryDescriptor: ClinicalRepositoryDescriptor = {
  mode: 'demo',
  label: `Demonstração local · expira em ${demoShareTtlLabel()}`,
  syntheticOnly: true,
}

function randomToken(bytes = 32) {
  const buffer = new Uint8Array(bytes)
  crypto.getRandomValues(buffer)

  return Array.from(buffer, (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

function hasValidReviewPublicationBinding(report: VisualReport) {
  const reviewApproval = report.reviewApproval
  const publicationIdentity = report.publicationIdentity

  return Boolean(
    reviewApproval &&
      publicationIdentity &&
      reviewApproval.organizationId === publicationIdentity.organizationId &&
      reviewApproval.workspaceId === publicationIdentity.workspaceId &&
      reviewApproval.approvedBy.id &&
      reviewApproval.approvedBy.displayName &&
      publicationIdentity.professional.id &&
      publicationIdentity.professional.displayName &&
      Number.isFinite(Date.parse(reviewApproval.approvedAt)) &&
      Number.isFinite(Date.parse(publicationIdentity.publishedAt)),
  )
}

function parseStoredShare(
  token: string,
  key: string,
  raw: string,
): DemoShareEntry | null {
  try {
    const parsed = JSON.parse(raw) as Partial<StoredDemoShare>
    const createdAt = Date.parse(parsed.createdAt ?? '')
    const expiresAt = Date.parse(parsed.expiresAt ?? '')

    if (
      parsed.schema !== DEMO_SHARE_SCHEMA ||
      !parsed.report ||
      !Number.isInteger(parsed.report.version) ||
      parsed.report.version < 1 ||
      !hasValidReviewPublicationBinding(parsed.report) ||
      !Number.isFinite(createdAt) ||
      !Number.isFinite(expiresAt)
    ) {
      return null
    }

    return {
      token,
      key,
      createdAt,
      expiresAt,
      report: parsed.report,
      viewCount:
        typeof parsed.viewCount === 'number' && parsed.viewCount >= 0
          ? parsed.viewCount
          : 0,
      lastViewedAt:
        parsed.lastViewedAt &&
        Number.isFinite(Date.parse(parsed.lastViewedAt))
          ? parsed.lastViewedAt
          : undefined,
    }
  } catch {
    return null
  }
}

function storageEntries() {
  const entries: DemoShareEntry[] = []

  try {
    const keys: string[] = []

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index)
      if (key?.startsWith(STORAGE_PREFIX)) keys.push(key)
    }

    for (const key of keys) {
      const raw = window.localStorage.getItem(key)
      if (!raw) continue

      const token = key.slice(STORAGE_PREFIX.length)
      const parsed = parseStoredShare(token, key, raw)

      if (!parsed) {
        window.localStorage.removeItem(key)
        continue
      }

      entries.push(parsed)
    }
  } catch {
    return []
  }

  return entries
}

function pruneExpiredAndExcessShares(now = Date.now()) {
  const activeShares = new Map<
    string,
    { createdAt: number; storageKey?: string }
  >()

  for (const entry of storageEntries()) {
    if (entry.expiresAt <= now) {
      try {
        if (entry.key) window.localStorage.removeItem(entry.key)
      } catch {
        // Best-effort cleanup only.
      }

      memoryShares.delete(entry.token)
      continue
    }

    activeShares.set(entry.token, {
      createdAt: entry.createdAt,
      storageKey: entry.key,
    })
  }

  for (const [token, entry] of memoryShares) {
    if (entry.expiresAt <= now) {
      memoryShares.delete(token)
      continue
    }

    const current = activeShares.get(token)
    if (!current || entry.createdAt > current.createdAt) {
      activeShares.set(token, {
        createdAt: entry.createdAt,
        storageKey: current?.storageKey,
      })
    }
  }

  const excess = [...activeShares.entries()]
    .sort(([, left], [, right]) => right.createdAt - left.createdAt)
    .slice(MAX_STORED_DEMO_SHARES)

  for (const [token, entry] of excess) {
    try {
      window.localStorage.removeItem(
        entry.storageKey ?? `${STORAGE_PREFIX}${token}`,
      )
    } catch {
      // Best-effort cleanup only.
    }

    memoryShares.delete(token)
  }
}

function persist(token: string, report: VisualReport) {
  const createdAt = Date.now()
  const expiresAt = createdAt + DEMO_SHARE_TTL_MS
  const storageKey = `${STORAGE_PREFIX}${token}`

  const stored: StoredDemoShare = {
    schema: DEMO_SHARE_SCHEMA,
    createdAt: new Date(createdAt).toISOString(),
    expiresAt: new Date(expiresAt).toISOString(),
    report,
    viewCount: 0,
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(stored))
  } catch {
    memoryShares.delete(token)
    throw new Error(
      'Não foi possível criar um link temporário neste navegador. Verifique se o armazenamento local está disponível e tente novamente.',
    )
  }

  memoryShares.set(token, {
    createdAt,
    expiresAt,
    report,
    viewCount: 0,
  })
  pruneExpiredAndExcessShares(createdAt)
}

function shouldCountView(lastViewedAt: string | undefined, now: number) {
  if (!lastViewedAt) return true

  const previous = Date.parse(lastViewedAt)
  return !Number.isFinite(previous) || now - previous > DEMO_VIEW_DEDUPE_MS
}

function recordStoredView(
  entry: DemoShareEntry,
  now: number,
  countView: boolean,
) {
  if (!entry.key) return

  const updated: StoredDemoShare = {
    schema: DEMO_SHARE_SCHEMA,
    createdAt: new Date(entry.createdAt).toISOString(),
    expiresAt: new Date(entry.expiresAt).toISOString(),
    report: entry.report,
    viewCount: entry.viewCount + (countView ? 1 : 0),
    lastViewedAt: countView
      ? new Date(now).toISOString()
      : entry.lastViewedAt,
  }

  try {
    window.localStorage.setItem(entry.key, JSON.stringify(updated))
  } catch {
    // Memory analytics remains available when storage cannot be updated.
  }
}

function read(token: string): VisualReport | null {
  const now = Date.now()
  pruneExpiredAndExcessShares(now)

  try {
    const key = `${STORAGE_PREFIX}${token}`
    const raw = window.localStorage.getItem(key)

    if (raw) {
      const stored = parseStoredShare(token, key, raw)

      if (
        !stored ||
        stored.expiresAt <= now ||
        stored.report.status !== 'published' ||
        stored.report.shareSlug !== token
      ) {
        window.localStorage.removeItem(key)
        memoryShares.delete(token)
        return null
      }

      const countView = shouldCountView(stored.lastViewedAt, now)
      const lastViewedAt = countView
        ? new Date(now).toISOString()
        : stored.lastViewedAt
      const viewCount = stored.viewCount + (countView ? 1 : 0)

      recordStoredView(stored, now, countView)
      memoryShares.set(token, {
        createdAt: stored.createdAt,
        expiresAt: stored.expiresAt,
        report: stored.report,
        viewCount,
        lastViewedAt,
      })

      return stored.report
    }
  } catch {
    // Fall through to the in-memory share.
  }

  const inMemory = memoryShares.get(token)

  if (!inMemory) return null
  if (inMemory.expiresAt <= now) {
    memoryShares.delete(token)
    return null
  }

  if (shouldCountView(inMemory.lastViewedAt, now)) {
    inMemory.viewCount += 1
    inMemory.lastViewedAt = new Date(now).toISOString()
  }

  return inMemory.report
}

function analyticsEntries() {
  pruneExpiredAndExcessShares()
  const entries = new Map<string, DemoShareEntry>()

  for (const entry of storageEntries()) {
    if (entry.expiresAt > Date.now()) {
      entries.set(entry.token, entry)
    }
  }

  for (const [token, memory] of memoryShares) {
    if (memory.expiresAt <= Date.now() || entries.has(token)) continue

    entries.set(token, {
      token,
      createdAt: memory.createdAt,
      expiresAt: memory.expiresAt,
      report: memory.report,
      viewCount: memory.viewCount,
      lastViewedAt: memory.lastViewedAt,
    })
  }

  return [...entries.values()]
}

export function getStoredDemoShareCount() {
  return analyticsEntries().length
}

export function clearDemoShares() {
  const removedTokens = new Set(memoryShares.keys())

  try {
    const keys: string[] = []

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index)
      if (key?.startsWith(STORAGE_PREFIX)) keys.push(key)
    }

    for (const key of keys) {
      removedTokens.add(key.slice(STORAGE_PREFIX.length))
      window.localStorage.removeItem(key)
    }
  } catch {
    // Memory cleanup still runs even when local storage is unavailable.
  }

  memoryShares.clear()
  return removedTokens.size
}

export function revokeDemoReportShares(reportId: string) {
  if (!reportId.trim()) return 0

  const removedTokens = new Set<string>()

  try {
    const keys: string[] = []

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index)
      if (key?.startsWith(STORAGE_PREFIX)) keys.push(key)
    }

    for (const key of keys) {
      const raw = window.localStorage.getItem(key)
      if (!raw) continue

      const token = key.slice(STORAGE_PREFIX.length)
      const entry = parseStoredShare(token, key, raw)

      if (!entry) {
        window.localStorage.removeItem(key)
        continue
      }

      if (entry.report.id !== reportId) continue

      window.localStorage.removeItem(key)

      if (window.localStorage.getItem(key) !== null) {
        throw new Error('share_revocation_not_confirmed')
      }

      removedTokens.add(token)
      memoryShares.delete(token)
    }
  } catch {
    throw new Error(
      'Não foi possível revogar os links ativos da versão publicada. A alteração foi bloqueada para preservar a segurança do relatório.',
    )
  }

  for (const [token, entry] of memoryShares) {
    if (entry.report.id !== reportId) continue
    removedTokens.add(token)
    memoryShares.delete(token)
  }

  return removedTokens.size
}

function demoUsageSummary(): ClinicalUsageSummary {
  const entries = analyticsEntries()
  const publishedReports = new Set(entries.map((entry) => entry.report.id))
  const viewedReports = new Set(
    entries
      .filter((entry) => entry.viewCount > 0)
      .map((entry) => entry.report.id),
  )
  const lastViewedAt = entries
    .map((entry) => entry.lastViewedAt)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0]

  return {
    publishedReports: publishedReports.size,
    sharesCreated: entries.length,
    activeShares: entries.length,
    shareViews: entries.reduce(
      (total, entry) => total + entry.viewCount,
      0,
    ),
    viewedReports: viewedReports.size,
    lastViewedAt,
  }
}

function demoReportViewStats(): ClinicalReportViewStat[] {
  const reportMap = new Map<
    string,
    {
      reportId: string
      reportTitle: string
      reportVersion: number
      sharesCreated: number
      viewCount: number
      lastViewedAt?: string
    }
  >()

  for (const entry of analyticsEntries()) {
    const reportKey = `${entry.report.id}:v${entry.report.version}`
    const current = reportMap.get(reportKey) ?? {
      reportId: entry.report.id,
      reportTitle: entry.report.title,
      reportVersion: entry.report.version,
      sharesCreated: 0,
      viewCount: 0,
      lastViewedAt: undefined,
    }

    current.sharesCreated += 1
    current.viewCount += entry.viewCount

    if (
      entry.lastViewedAt &&
      (!current.lastViewedAt ||
        Date.parse(entry.lastViewedAt) > Date.parse(current.lastViewedAt))
    ) {
      current.lastViewedAt = entry.lastViewedAt
    }

    reportMap.set(reportKey, current)
  }

  return [...reportMap.values()]
    .map((stat) => ({
      reportId: stat.reportId,
      reportTitle: stat.reportTitle,
      reportVersion: stat.reportVersion,
      sharesCreated: stat.sharesCreated,
      viewCount: stat.viewCount,
      lastViewedAt: stat.lastViewedAt,
    }))
    .sort(
      (a, b) =>
        Date.parse(b.lastViewedAt ?? '1970-01-01') -
        Date.parse(a.lastViewedAt ?? '1970-01-01'),
    )
}

export class DemoClinicalRepository implements ClinicalRepository {
  async publishReport(report: VisualReport): Promise<VisualReport> {
    if (!Number.isInteger(report.version) || report.version < 1) {
      throw new Error('A versão do relatório é inválida.')
    }

    if (!report.reviewApproval) {
      throw new Error(
        'A revisão clínica precisa registrar o profissional responsável.',
      )
    }

    if (!report.publicationIdentity) {
      throw new Error(
        'A identidade responsável pela publicação precisa estar confirmada.',
      )
    }

    if (!hasValidReviewPublicationBinding(report)) {
      throw new Error(
        'A revisão clínica e a publicação precisam pertencer ao mesmo contexto organizacional e workspace.',
      )
    }

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

  async revokeReportShares(reportId: string): Promise<number> {
    return revokeDemoReportShares(reportId)
  }

  async getUsageSummary(): Promise<ClinicalUsageSummary> {
    return demoUsageSummary()
  }

  async getReportViewStats(): Promise<ClinicalReportViewStat[]> {
    return demoReportViewStats()
  }
}

export const demoClinicalRepository = new DemoClinicalRepository()
