export type OrganizationMemberRole = 'admin' | 'clinician' | 'staff'

export interface ProfessionalProfile {
  specialty: string
  licenseRegion?: string
  licenseNumber?: string
}

export interface OrganizationMember {
  id: string
  displayName: string
  initials: string
  role: OrganizationMemberRole
  active: boolean
  professional?: ProfessionalProfile
}

export interface OrganizationUnit {
  id: string
  organizationId: string
  name: string
  slug: string
  city?: string
  region?: string
  countryCode?: string
  active: boolean
}

export interface ClinicalWorkspace {
  id: string
  organizationId: string
  unitId?: string
  name: string
  slug: string
  specialty?: string
  active: boolean
}

export interface OrganizationBranding {
  organizationId: string
  brandName: string
  markText: string
  primaryColorHex: string
  patientFooterText: string
}

export interface OrganizationContext {
  id: string
  name: string
  slug: string
  units: OrganizationUnit[]
  workspaces: ClinicalWorkspace[]
  members: OrganizationMember[]
}
