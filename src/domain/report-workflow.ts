import type { ReportExample } from '../clinical/demo-scenarios'
import type { PatientExplanationDraft } from '../clinical/patient-explanation'
import type { VisualReport } from './types'

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
  | { type: 'explanation-approved' }
  | { type: 'published'; report: VisualReport }

function invalidatePublication(report: VisualReport): VisualReport {
  return {
    ...report,
    status: 'draft',
    shareSlug: undefined,
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
    Boolean(report.finding.patientExplanation.trim())
  )
}

function canPublish(report: VisualReport) {
  return (
    canReviewExplanation(report) &&
    !report.finding.explanationReviewRequired
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
        !report.finding.atlasConceptId
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
        !report.finding.atlasConceptId
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

    case 'explanation-approved':
      if (!canReviewExplanation(report)) return report

      return {
        ...report,
        status: 'clinician_review',
        finding: {
          ...report.finding,
          explanationReviewRequired: false,
        },
      }

    case 'published':
      if (
        !canPublish(report) ||
        action.report.id !== report.id ||
        action.report.status !== 'published' ||
        !action.report.shareSlug
      ) {
        return report
      }

      return action.report
  }
}
