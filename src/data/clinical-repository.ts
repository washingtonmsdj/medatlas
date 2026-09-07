import type { VisualReport } from '../domain/types'

export interface ClinicalUsageSummary {
  publishedReports: number
  sharesCreated: number
  activeShares: number
  shareViews: number
  viewedReports: number
  lastViewedAt?: string
}

export interface ClinicalReportViewStat {
  reportId: string
  reportTitle: string
  reportVersion: number
  sharesCreated: number
  viewCount: number
  lastViewedAt?: string
}

export interface ClinicalRepository {
  publishReport(report: VisualReport): Promise<VisualReport>
  resolvePatientShare(token: string): Promise<VisualReport | null>
  getUsageSummary(): Promise<ClinicalUsageSummary>
  getReportViewStats(): Promise<ClinicalReportViewStat[]>
}

export type ClinicalRepositoryMode = 'demo' | 'supabase'

export interface ClinicalRepositoryDescriptor {
  mode: ClinicalRepositoryMode
  label: string
  syntheticOnly: boolean
}
