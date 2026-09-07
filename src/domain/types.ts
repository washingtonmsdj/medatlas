export type ClinicalReportStatus = 'draft' | 'clinician_review' | 'published'

export interface PatientSummary {
  id: string
  displayName: string
  age: number
}

export interface ClinicalFinding {
  id: string
  sourceText: string
  anatomicalStructure: string
  atlasRef: string
  atlasConceptId: string
  patientExplanation: string
  explanationReviewRequired: boolean
  clinicianNote: string
}

export interface VisualReport {
  id: string
  patient: PatientSummary
  title: string
  status: ClinicalReportStatus
  finding: ClinicalFinding
  shareSlug?: string
}
