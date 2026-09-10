import {
  DEFAULT_DEMO_WORKSPACE_ID,
  DEMO_ORGANIZATION,
  DEMO_ORGANIZATION_BRANDING,
  getDemoCurrentMember,
  getDemoUnit,
  getDemoWorkspace,
} from './demo-organization'
import type {
  ClinicalWorkspace,
  OrganizationBranding,
  OrganizationContext,
  OrganizationMember,
  OrganizationUnit,
} from './types'

export interface OrganizationRuntime {
  mode: 'demo' | 'supabase'
  organization: OrganizationContext
  branding: OrganizationBranding
  defaultWorkspaceId: string
  getCurrentMember: () => OrganizationMember | null
  getWorkspace: (workspaceId: string) => ClinicalWorkspace | null
  getUnit: (unitId?: string) => OrganizationUnit | null
}

export const organizationRuntime: OrganizationRuntime = {
  mode: 'demo',
  organization: DEMO_ORGANIZATION,
  branding: DEMO_ORGANIZATION_BRANDING,
  defaultWorkspaceId: DEFAULT_DEMO_WORKSPACE_ID,
  getCurrentMember: getDemoCurrentMember,
  getWorkspace: getDemoWorkspace,
  getUnit: getDemoUnit,
}
