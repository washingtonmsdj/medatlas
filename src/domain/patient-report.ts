import type { ClinicalReportStatus, VisualReport } from './types'

export interface PatientReportView {
  title: string
  status: ClinicalReportStatus
  finding: {
    sourceText: string
    anatomicalStructure: string
    atlasConceptId: string
    anatomyReviewRequired: boolean
    patientExplanation: string
    explanationReviewRequired: boolean
    clinicianNote: string
  }
  reviewApproval?: {
    approvedBy: {
      displayName: string
      specialty?: string
    }
    approvedAt: string
  }
  publicationIdentity?: {
    organizationName: string
    workspaceName: string
    branding: {
      brandName: string
      patientFooterText: string
    }
    professional: {
      displayName: string
      specialty?: string
    }
    publishedAt: string
  }
}

export function toPatientReportView(report: VisualReport): PatientReportView {
  const reviewApproval = report.reviewApproval
    ? {
        approvedBy: {
          displayName: report.reviewApproval.approvedBy.displayName,
          specialty: report.reviewApproval.approvedBy.specialty,
        },
        approvedAt: report.reviewApproval.approvedAt,
      }
    : undefined

  const publicationIdentity = report.publicationIdentity
    ? {
        organizationName: report.publicationIdentity.organizationName,
        workspaceName: report.publicationIdentity.workspaceName,
        branding: {
          brandName: report.publicationIdentity.branding.brandName,
          patientFooterText:
            report.publicationIdentity.branding.patientFooterText,
        },
        professional: {
          displayName: report.publicationIdentity.professional.displayName,
          specialty: report.publicationIdentity.professional.specialty,
        },
        publishedAt: report.publicationIdentity.publishedAt,
      }
    : undefined

  return {
    title: report.title,
    status: report.status,
    finding: {
      sourceText: report.finding.sourceText,
      anatomicalStructure: report.finding.anatomicalStructure,
      atlasConceptId: report.finding.atlasConceptId,
      anatomyReviewRequired: report.finding.anatomyReviewRequired,
      patientExplanation: report.finding.patientExplanation,
      explanationReviewRequired: report.finding.explanationReviewRequired,
      clinicianNote: report.finding.clinicianNote,
    },
    reviewApproval,
    publicationIdentity,
  }
}
