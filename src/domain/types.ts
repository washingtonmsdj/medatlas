export type ClinicalReportStatus = 'draft' | 'clinician_review' | 'published'

export type ExplanationOrigin = 'manual' | 'deterministic' | 'ai'

export interface ExplanationProvenance {
  origin: ExplanationOrigin
  generatorId?: string
  generatorVersion?: string
  generatedAt?: string
  clinicianEdited: boolean
}

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
  explanationProvenance: ExplanationProvenance
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
