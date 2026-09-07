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

export interface DemoOrganizationContext {
  id: string
  name: string
  slug: string
  members: DemoOrganizationMember[]
}

export const DEMO_ORGANIZATION: DemoOrganizationContext = {
  id: 'demo-org-clinica-horizonte',
  name: 'Clínica Horizonte',
  slug: 'clinica-horizonte-demo',
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
