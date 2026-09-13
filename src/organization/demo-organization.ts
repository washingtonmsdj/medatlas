import {
  DEMO_CURRENT_MEMBER,
  DEMO_DEFAULT_WORKSPACE_ID,
  DEMO_MAIN_UNIT_ID,
  DEMO_ORGANIZATION_ID,
  DEMO_ORGANIZATION_NAME,
  DEMO_ORGANIZATION_SLUG,
} from '../demo/identity'
import type {
  OrganizationBranding,
  OrganizationContext,
} from './types'

export const DEMO_ORGANIZATION: OrganizationContext = {
  id: DEMO_ORGANIZATION_ID,
  name: DEMO_ORGANIZATION_NAME,
  slug: DEMO_ORGANIZATION_SLUG,
  units: [
    {
      id: DEMO_MAIN_UNIT_ID,
      organizationId: DEMO_ORGANIZATION_ID,
      name: 'Unidade principal',
      slug: 'principal',
      city: 'Salvador',
      region: 'BA',
      countryCode: 'BR',
      active: true,
    },
  ],
  workspaces: [
    {
      id: DEMO_DEFAULT_WORKSPACE_ID,
      organizationId: DEMO_ORGANIZATION_ID,
      unitId: DEMO_MAIN_UNIT_ID,
      name: 'Ortopedia',
      slug: 'ortopedia',
      specialty: 'Ortopedia',
      active: true,
    },
    {
      id: 'demo-workspace-cardiologia',
      organizationId: DEMO_ORGANIZATION_ID,
      unitId: DEMO_MAIN_UNIT_ID,
      name: 'Cardiologia',
      slug: 'cardiologia',
      specialty: 'Cardiologia',
      active: true,
    },
    {
      id: 'demo-workspace-fisioterapia',
      organizationId: DEMO_ORGANIZATION_ID,
      unitId: DEMO_MAIN_UNIT_ID,
      name: 'Fisioterapia',
      slug: 'fisioterapia',
      specialty: 'Fisioterapia',
      active: true,
    },
  ],
  members: [
    {
      id: DEMO_CURRENT_MEMBER.id,
      displayName: DEMO_CURRENT_MEMBER.displayName,
      initials: DEMO_CURRENT_MEMBER.initials,
      role: 'admin',
      active: true,
      professional: {
        specialty: DEMO_CURRENT_MEMBER.specialty,
        licenseRegion: DEMO_CURRENT_MEMBER.licenseRegion,
        licenseNumber: DEMO_CURRENT_MEMBER.licenseNumber,
      },
    },
    {
      id: 'demo-member-marina',
      displayName: 'Dra. Marina Freitas',
      initials: 'MF',
      role: 'clinician',
      active: true,
      professional: {
        specialty: 'Cardiologia',
        licenseRegion: 'DEMO',
        licenseNumber: '0002',
      },
    },
    {
      id: 'demo-member-joao',
      displayName: 'João Silva',
      initials: 'JS',
      role: 'staff',
      active: true,
    },
  ],
}

export const DEMO_ORGANIZATION_BRANDING: OrganizationBranding = {
  organizationId: DEMO_ORGANIZATION_ID,
  brandName: DEMO_ORGANIZATION_NAME,
  markText: 'CH',
  primaryColorHex: '#1769AA',
  patientFooterText: `${DEMO_ORGANIZATION_NAME} · demonstração`,
}

export const DEMO_CURRENT_MEMBER_ID = DEMO_CURRENT_MEMBER.id

export function getDemoCurrentMember() {
  return (
    DEMO_ORGANIZATION.members.find(
      (member) => member.id === DEMO_CURRENT_MEMBER_ID && member.active,
    ) ?? null
  )
}

export const DEFAULT_DEMO_WORKSPACE_ID = DEMO_DEFAULT_WORKSPACE_ID

export function getDemoWorkspace(workspaceId: string) {
  return (
    DEMO_ORGANIZATION.workspaces.find(
      (workspace) => workspace.id === workspaceId && workspace.active,
    ) ?? null
  )
}

export function getDemoUnit(unitId?: string) {
  if (!unitId) return null

  return (
    DEMO_ORGANIZATION.units.find(
      (unit) => unit.id === unitId && unit.active,
    ) ?? null
  )
}
