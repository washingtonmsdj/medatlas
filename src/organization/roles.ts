import type { OrganizationMemberRole } from './types'

export type RoleCapabilityId =
  | 'read'
  | 'clinical-write'
  | 'membership-write'

export interface RoleCapability {
  id: RoleCapabilityId
  label: string
}

export const ROLE_LABELS: Record<OrganizationMemberRole, string> = {
  admin: 'Administrador',
  clinician: 'Profissional clínico',
  staff: 'Equipe de apoio',
}

export const ROLE_CAPABILITIES: Record<
  OrganizationMemberRole,
  RoleCapabilityId[]
> = {
  admin: ['read', 'clinical-write', 'membership-write'],
  clinician: ['read', 'clinical-write'],
  staff: ['read'],
}

export function roleHasCapability(
  role: OrganizationMemberRole,
  capability: RoleCapabilityId,
) {
  return ROLE_CAPABILITIES[role].includes(capability)
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

export const ROLE_ORDER: OrganizationMemberRole[] = [
  'admin',
  'clinician',
  'staff',
]

export const ROLE_DESCRIPTIONS: Record<OrganizationMemberRole, string> = {
  admin: 'Pode escrever dados clínicos e administrar membros.',
  clinician: 'Pode ler e escrever dados clínicos da organização.',
  staff: 'Pode consultar dados permitidos, sem escrita clínica.',
}
