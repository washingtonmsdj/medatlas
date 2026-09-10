import {
  clearDemoShares,
  demoClinicalRepository,
  demoRepositoryDescriptor,
  getStoredDemoShareCount,
} from './demo-clinical-repository'
import type {
  ClinicalRepository,
  ClinicalRepositoryDescriptor,
} from './clinical-repository'
import { toPatientReportView } from '../domain/patient-report'
import { createReportPublicationIdentity } from '../organization/report-publication'
import { organizationRuntime } from '../organization/runtime'

export interface ActiveClinicalRepository {
  repository: ClinicalRepository
  descriptor: ClinicalRepositoryDescriptor
}

const organizationBoundDemoRepository: ClinicalRepository = {
  async publishReport(report) {
    const reviewApproval = report.reviewApproval

    if (!reviewApproval) {
      throw new Error(
        'A revisão clínica precisa registrar o profissional responsável antes da publicação.',
      )
    }

    const publicationIdentity = createReportPublicationIdentity(
      organizationRuntime,
      reviewApproval.workspaceId,
    )

    if (!publicationIdentity) {
      throw new Error(
        'Não foi possível confirmar a organização, o workspace e o profissional responsáveis pela publicação.',
      )
    }

    if (
      reviewApproval.organizationId !== publicationIdentity.organizationId ||
      reviewApproval.workspaceId !== publicationIdentity.workspaceId
    ) {
      throw new Error(
        'A revisão clínica não pertence ao mesmo contexto organizacional da publicação.',
      )
    }

    return demoClinicalRepository.publishReport({
      ...report,
      publicationIdentity,
    })
  },

  async resolvePatientShare(token) {
    const report = await demoClinicalRepository.resolvePatientShare(token)
    return report ? toPatientReportView(report) : null
  },

  revokeReportShares(reportId) {
    return demoClinicalRepository.revokeReportShares(reportId)
  },

  getUsageSummary() {
    return demoClinicalRepository.getUsageSummary()
  },

  getReportViewStats() {
    return demoClinicalRepository.getReportViewStats()
  },
}

export function getActivePatientShareCount() {
  return getStoredDemoShareCount()
}

export function revokeAllActivePatientShares() {
  return clearDemoShares()
}

/**
 * MedAtlas remains intentionally fail-closed: setting Supabase environment
 * variables does not silently activate a half-configured clinical backend.
 * A verified Supabase adapter will replace this selector after database/RLS
 * integration tests exist.
 */
export function getClinicalRepository(): ActiveClinicalRepository {
  return {
    repository: organizationBoundDemoRepository,
    descriptor: demoRepositoryDescriptor,
  }
}
