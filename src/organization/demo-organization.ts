export type MedAtlasMemberRole = 'admin' | 'clinician' | 'staff'

export interface DemoProfessionalProfile {
  specialty: string
  licenseRegion?: string
  licenseNumber?: string
}

export interface DemoOrganizationMember {
  id: string
  displayName: string
  initials: string
  role: MedAtlasMemberRole
  active: boolean
  professional?: DemoProfessionalProfile
}

export interface DemoOrganizationUnit {
  id: string
  organizationId: string
  name: string
  slug: string
  city?: string
  region?: string
  countryCode?: string
  active: boolean
}

export interface DemoClinicalWorkspace {
  id: string
  organizationId: string
  unitId?: string
  name: string
  slug: string
  specialty?: string
  active: boolean
}

export interface DemoOrganizationBranding {
  organizationId: string
  brandName: string
  markText: string
  primaryColorHex: string
  patientFooterText: string
}

export interface DemoOrganizationContext {
  id: string
  name: string
  slug: string
  units: DemoOrganizationUnit[]
  workspaces: DemoClinicalWorkspace[]
  members: DemoOrganizationMember[]
}

const DEMO_ORGANIZATION_ID = 'demo-org-clinica-horizonte'
const DEMO_MAIN_UNIT_ID = 'demo-unit-principal'

export const DEMO_ORGANIZATION: DemoOrganizationContext = {
  id: DEMO_ORGANIZATION_ID,
  name: 'Clínica Horizonte',
  slug: 'clinica-horizonte-demo',
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
      id: 'demo-workspace-ortopedia',
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
      id: 'demo-member-carlos',
      displayName: 'Dr. Carlos Mendes',
      initials: 'CM',
      role: 'admin',
      active: true,
      professional: {
        specialty: 'Ortopedia',
        licenseRegion: 'DEMO',
        licenseNumber: '0001',
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

export const DEMO_ORGANIZATION_BRANDING: DemoOrganizationBranding = {
  organizationId: DEMO_ORGANIZATION_ID,
  brandName: 'Clínica Horizonte',
  markText: 'CH',
  primaryColorHex: '#1E7AD7',
  patientFooterText: 'Clínica Horizonte · demonstração',
}

export const DEMO_CURRENT_MEMBER_ID = 'demo-member-carlos'

export function getDemoCurrentMember() {
  return (
    DEMO_ORGANIZATION.members.find(
      (member) => member.id === DEMO_CURRENT_MEMBER_ID && member.active,
    ) ??
    DEMO_ORGANIZATION.members.find((member) => member.active) ??
    null
  )
}

export const DEFAULT_DEMO_WORKSPACE_ID = 'demo-workspace-ortopedia'

export function getDemoWorkspace(workspaceId: string) {
  return (
    DEMO_ORGANIZATION.workspaces.find(
      (workspace) => workspace.id === workspaceId && workspace.active,
    ) ??
    DEMO_ORGANIZATION.workspaces.find((workspace) => workspace.active) ??
    null
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

export const ROLE_LABELS: Record<MedAtlasMemberRole, string> = {
  admin: 'Administrador',
  clinician: 'Profissional clínico',
  staff: 'Equipe de apoio',
}

export interface RoleCapability {
  id: 'read' | 'clinical-write' | 'membership-write'
  label: string
}

export const ROLE_CAPABILITIES: Record<
  MedAtlasMemberRole,
  RoleCapability['id'][]
> = {
  admin: ['read', 'clinical-write', 'membership-write'],
  clinician: ['read', 'clinical-write'],
  staff: ['read'],
}

export const CAPABILITIES: RoleCapability[] = [
  {
    id: 'read',
    label: 'Ler dados da organização',
  },
  {
    id: 'clinical-write',
    label: 'Criar/editar dados clínicos',
  },
  {
    id: 'membership-write',
    label: 'Gerenciar membros',
  },
]
