import type { ReportPublicationIdentity } from '../domain/types'
import { roleHasCapability } from './roles'
import type { OrganizationRuntime } from './runtime'

export function createReportPublicationIdentity(
  runtime: OrganizationRuntime,
  workspaceId = runtime.defaultWorkspaceId,
): ReportPublicationIdentity | null {
  const workspace = runtime.getWorkspace(workspaceId)
  const professional = runtime.getCurrentMember()

  if (
    !workspace ||
    !professional ||
    workspace.organizationId !== runtime.organization.id ||
    runtime.branding.organizationId !== runtime.organization.id ||
    !runtime.organization.members.some(
      (member) => member.id === professional.id && member.active,
    ) ||
    !roleHasCapability(professional.role, 'clinical-write')
  ) {
    return null
  }

  return {
    organizationId: runtime.organization.id,
    organizationName: runtime.organization.name,
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    branding: {
      brandName: runtime.branding.brandName,
      patientFooterText: runtime.branding.patientFooterText,
    },
    professional: {
      id: professional.id,
      displayName: professional.displayName,
      specialty: professional.professional?.specialty,
    },
    publishedAt: new Date().toISOString(),
  }
}
