import {
  demoClinicalRepository,
  demoRepositoryDescriptor,
} from './demo-clinical-repository'
import type {
  ClinicalRepository,
  ClinicalRepositoryDescriptor,
} from './clinical-repository'

export interface ActiveClinicalRepository {
  repository: ClinicalRepository
  descriptor: ClinicalRepositoryDescriptor
}

/**
 * MedAtlas remains intentionally fail-closed: setting Supabase environment
 * variables does not silently activate a half-configured clinical backend.
 * A verified Supabase adapter will replace this selector after database/RLS
 * integration tests exist.
 */
export function getClinicalRepository(): ActiveClinicalRepository {
  return {
    repository: demoClinicalRepository,
    descriptor: demoRepositoryDescriptor,
  }
}
