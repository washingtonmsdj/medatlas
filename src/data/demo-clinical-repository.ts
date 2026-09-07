import type {
  ClinicalRepository,
  ClinicalRepositoryDescriptor,
} from './clinical-repository'
import type { VisualReport } from '../domain/types'

const STORAGE_PREFIX = 'medatlas:demo:published:'
const memoryShares = new Map<string, VisualReport>()

export const demoRepositoryDescriptor: ClinicalRepositoryDescriptor = {
  mode: 'demo',
  label: 'Demonstração local',
  syntheticOnly: true,
}

function randomToken(bytes = 32) {
  const buffer = new Uint8Array(bytes)
  crypto.getRandomValues(buffer)

  return Array.from(buffer, (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

function persist(token: string, report: VisualReport) {
  memoryShares.set(token, report)

  try {
    window.localStorage.setItem(
      `${STORAGE_PREFIX}${token}`,
      JSON.stringify(report),
    )
  } catch {
    // In-memory sharing remains available in the current tab/session.
  }
}

function read(token: string): VisualReport | null {
  const inMemory = memoryShares.get(token)
  if (inMemory) return inMemory

  try {
    const raw = window.localStorage.getItem(
      `${STORAGE_PREFIX}${token}`,
    )

    if (!raw) return null

    const report = JSON.parse(raw) as VisualReport

    if (
      report.status !== 'published' ||
      report.shareSlug !== token
    ) {
      return null
    }

    memoryShares.set(token, report)
    return report
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
