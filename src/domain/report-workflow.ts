import type { ReportExample } from '../clinical/demo-scenarios'
import type { PatientExplanationDraft } from '../clinical/patient-explanation'
import { validateDemoPatientExplanation } from '../product/constraints'
import type { ReportReviewApproval, VisualReport } from './types'

export type ReportWorkflowAction =
  | { type: 'replace'; report: VisualReport }
  | { type: 'source-text-changed'; value: string }
  | { type: 'example-loaded'; example: ReportExample }
  | {
      type: 'anatomy-confirmed'
      conceptId: string
      displayName: string
    }
  | {
      type: 'draft-generated'
      draft: PatientExplanationDraft
    }
  | { type: 'explanation-edited'; value: string }
  | { type: 'explanation-approved'; approval: ReportReviewApproval }
  | { type: 'published'; report: VisualReport }
  | { type: 'shares-cleared' }

function hasValidReviewApproval(report: VisualReport) {
  const approval = report.reviewApproval

  return Boolean(
    approval &&
      approval.organizationId &&
      approval.workspaceId &&
      approval.approvedBy.id &&
      approval.approvedBy.displayName &&
      Number.isFinite(Date.parse(approval.approvedAt)),
  )
}

function sameReviewApproval(left: VisualReport, right: VisualReport) {
  const leftApproval = left.reviewApproval
  const rightApproval = right.reviewApproval

  return Boolean(
    leftApproval &&
      rightApproval &&
      leftApproval.organizationId === rightApproval.organizationId &&
      leftApproval.workspaceId === rightApproval.workspaceId &&
      leftApproval.approvedBy.id === rightApproval.approvedBy.id &&
      leftApproval.approvedAt === rightApproval.approvedAt,
  )
}

function draftMatchesCurrentInputs(
  report: VisualReport,
  draft: PatientExplanationDraft,
) {
  const input = draft.inputIdentity

  return Boolean(
    input &&
      input.reportId === report.id &&
      input.sourceText === report.finding.sourceText &&
      input.atlasConceptId === report.finding.atlasConceptId &&
      input.anatomicalStructure === report.finding.anatomicalStructure,
  )
}

function invalidatePublication(report: VisualReport): VisualReport {
  return {
    ...report,
    version:
      report.status === 'published'
        ? report.version + 1
        : report.version,
    status: 'draft',
    reviewApproval: undefined,
    shareSlug: undefined,
    publicationIdentity: undefined,
  }
}

function resetExplanation(report: VisualReport): VisualReport {
  return {
    ...report,
    finding: {
      ...report.finding,
      patientExplanation: '',
      explanationReviewRequired: true,
      explanationProvenance: {
        origin: 'manual',
        clinicianEdited: false,
      },
    },
  }
}

function canReviewExplanation(report: VisualReport) {
  return (
    Boolean(report.finding.atlasConceptId) &&
    !report.finding.anatomyReviewRequired &&
    Boolean(report.finding.patientExplanation.trim()) &&
    validateDemoPatientExplanation(report.finding.patientExplanation).ok
  )
}

function canPublish(report: VisualReport) {
  return (
    canReviewExplanation(report) &&
    !report.finding.explanationReviewRequired &&
    hasValidReviewApproval(report)
  )
}

export function reportWorkflowReducer(
  report: VisualReport,
  action: ReportWorkflowAction,
): VisualReport {
  switch (action.type) {
    case 'replace':
      return action.report

    case 'source-text-changed': {
      const draft = resetExplanation(invalidatePublication(report))

      return {
        ...draft,
        finding: {
          ...draft.finding,
          sourceText: action.value,
          anatomyReviewRequired: true,
        },
      }
    }

    case 'example-loaded': {
      const draft = resetExplanation(invalidatePublication(report))

      return {
        ...draft,
        title: action.example.title,
        finding: {
          ...draft.finding,
          sourceText: action.example.sourceText,
          anatomyReviewRequired: true,
        },
      }
    }

    case 'anatomy-confirmed': {
      if (!action.conceptId || !action.displayName) return report

      const draft = resetExplanation(invalidatePublication(report))

      return {
        ...draft,
        finding: {
          ...draft.finding,
          anatomicalStructure: action.displayName,
          atlasConceptId: action.conceptId,
          anatomyReviewRequired: false,
        },
      }
    }

    case 'draft-generated': {
      if (
        report.finding.anatomyReviewRequired ||
        !report.finding.atlasConceptId ||
        !draftMatchesCurrentInputs(report, action.draft) ||
        !validateDemoPatientExplanation(action.draft.text).ok
      ) {
        return report
      }

      const draft = invalidatePublication(report)

      return {
        ...draft,
        finding: {
          ...draft.finding,
          patientExplanation: action.draft.text,
          explanationProvenance: action.draft.provenance,
          explanationReviewRequired: true,
        },
      }
    }

    case 'explanation-edited': {
      if (
        report.finding.anatomyReviewRequired ||
        !report.finding.atlasConceptId ||
        !validateDemoPatientExplanation(action.value).ok
      ) {
        return report
      }

      const draft = invalidatePublication(report)

      return {
        ...draft,
        finding: {
          ...draft.finding,
          patientExplanation: action.value,
          explanationReviewRequired: true,
          explanationProvenance: {
            ...draft.finding.explanationProvenance,
            clinicianEdited: true,
          },
        },
      }
    }

    case 'explanation-approved': {
      if (!canReviewExplanation(report)) return report

      const approved = {
        ...report,
        reviewApproval: action.approval,
      }

      if (!hasValidReviewApproval(approved)) return report

      return {
        ...approved,
        status: 'clinician_review',
        finding: {
          ...approved.finding,
          explanationReviewRequired: false,
        },
      }
    }

    case 'published':
      if (
        !canPublish(report) ||
        action.report.id !== report.id ||
        action.report.version !== report.version ||
        action.report.status !== 'published' ||
        !action.report.shareSlug ||
        !action.report.publicationIdentity ||
        !sameReviewApproval(report, action.report)
      ) {
        return report
      }

      return action.report

    case 'shares-cleared':
      if (
        report.status !== 'published' &&
        !report.shareSlug &&
        !report.publicationIdentity
      ) {
        return report
      }

      return {
        ...report,
        status: canPublish(report) ? 'clinician_review' : 'draft',
        shareSlug: undefined,
        publicationIdentity: undefined,
      }
  }
}
