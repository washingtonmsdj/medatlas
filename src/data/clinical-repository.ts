import type { VisualReport } from '../domain/types'

export interface ClinicalRepository {
  publishReport(report: VisualReport): Promise<VisualReport>
  resolvePatientShare(token: string): Promise<VisualReport | null>
}

export type ClinicalRepositoryMode = 'demo' | 'supabase'

export interface ClinicalRepositoryDescriptor {
  mode: ClinicalRepositoryMode
  label: string
  syntheticOnly: boolean
}
