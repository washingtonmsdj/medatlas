import type { ReportReviewApproval } from '../domain/types'
import { roleHasCapability } from '../organization/roles'
import type { OrganizationRuntime } from '../organization/runtime'

export function createReportReviewApproval(
  runtime: OrganizationRuntime,
  workspaceId = runtime.defaultWorkspaceId,
  approvedAt = new Date().toISOString(),
): ReportReviewApproval | null {
  const workspace = runtime.getWorkspace(workspaceId)
  const member = runtime.getCurrentMember()

  if (
    !workspace ||
    !member ||
    workspace.organizationId !== runtime.organization.id ||
    !runtime.organization.members.some(
      (candidate) => candidate.id === member.id && candidate.active,
    ) ||
    !roleHasCapability(member.role, 'clinical-write') ||
    !Number.isFinite(Date.parse(approvedAt))
  ) {
    return null
  }

  return {
    organizationId: runtime.organization.id,
    workspaceId: workspace.id,
    approvedBy: {
      id: member.id,
      displayName: member.displayName,
      specialty: member.professional?.specialty,
    },
    approvedAt,
  }
}
