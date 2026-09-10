import {
  demoClinicalRepository,
  demoRepositoryDescriptor,
} from './demo-clinical-repository'
import type {
  ClinicalRepository,
  ClinicalRepositoryDescriptor,
} from './clinical-repository'
import { createReportPublicationIdentity } from '../organization/report-publication'
import { organizationRuntime } from '../organization/runtime'

export interface ActiveClinicalRepository {
  repository: ClinicalRepository
  descriptor: ClinicalRepositoryDescriptor
}

const organizationBoundDemoRepository: ClinicalRepository = {
  async publishReport(report) {
    const publicationIdentity = createReportPublicationIdentity(
      organizationRuntime,
    )

    if (!publicationIdentity) {
      throw new Error(
        'Não foi possível confirmar a organização, o workspace e o profissional responsáveis pela publicação.',
      )
    }

    return demoClinicalRepository.publishReport({
      ...report,
      publicationIdentity,
    })
  },

  resolvePatientShare(token) {
    return demoClinicalRepository.resolvePatientShare(token)
  },

  getUsageSummary() {
    return demoClinicalRepository.getUsageSummary()
  },

  getReportViewStats() {
    return demoClinicalRepository.getReportViewStats()
  },
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
