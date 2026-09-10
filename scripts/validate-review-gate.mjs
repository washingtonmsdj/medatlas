import { readFile } from 'node:fs/promises'

const files = {
  app: await readFile('src/App.tsx', 'utf8'),
  composer: await readFile('src/components/ReportComposer.tsx', 'utf8'),
  patient: await readFile('src/components/PatientReportPage.tsx', 'utf8'),
  workflow: await readFile('src/domain/report-workflow.ts', 'utf8'),
  types: await readFile('src/domain/types.ts', 'utf8'),
  review: await readFile('src/clinical/report-review.ts', 'utf8'),
  roles: await readFile('src/organization/roles.ts', 'utf8'),
  publication: await readFile('src/organization/report-publication.ts', 'utf8'),
  repository: await readFile('src/data/repository.ts', 'utf8'),
  migration: await readFile(
    'supabase/migrations/202609070001_medatlas_core.sql',
    'utf8',
  ),
  e2e: await readFile('tests/e2e/clinical-flow.spec.ts', 'utf8'),
}

const failures = []

const invariants = [
  ['frontend blocks anatomy review', files.app, 'report.finding.anatomyReviewRequired'],
  ['frontend blocks explanation review', files.app, 'report.finding.explanationReviewRequired'],
  ['frontend blocks missing approval', files.app, '!report.reviewApproval'],
  ['frontend creates review approval', files.app, 'createReportReviewApproval'],
  ['domain models review provenance', files.types, 'export interface ReportReviewApproval'],
  ['review helper requires clinical-write', files.review, "roleHasCapability(member.role, 'clinical-write')"],
  ['review helper binds organization', files.review, 'organizationId: runtime.organization.id'],
  ['review helper binds workspace', files.review, 'workspaceId: workspace.id'],
  ['workflow invalidates approval on content change', files.workflow, 'reviewApproval: undefined'],
  ['workflow requires approval before publish', files.workflow, 'hasValidReviewApproval(report)'],
  ['composer exposes reviewer identity', files.composer, 'report.reviewApproval?.approvedBy.displayName'],
  ['patient requires review provenance', files.patient, '!reviewApproval'],
  ['patient labels reviewer separately', files.patient, 'Revisado por'],
  ['patient labels publisher separately', files.patient, 'Compartilhado por'],
  ['publisher also requires clinical-write', files.publication, "roleHasCapability(professional.role, 'clinical-write')"],
  ['repository requires review provenance', files.repository, 'const reviewApproval = report.reviewApproval'],
  ['repository binds review and publication tenant', files.repository, 'reviewApproval.organizationId !== publicationIdentity.organizationId'],
  ['production stores approved_by', files.migration, 'approved_by uuid references auth.users(id)'],
  ['production stores approved_at', files.migration, 'approved_at timestamptz'],
  ['browser verifies publish disabled before review', files.e2e, 'publishBeforeReview'],
  ['browser performs explicit clinician review', files.e2e, 'Aprovar explicação'],
]

for (const [name, content, fragment] of invariants) {
  if (!content.includes(fragment)) {
    failures.push(`${name}: missing ${fragment}`)
  }
}

if (!files.roles.includes("clinician: ['read', 'clinical-write']")) {
  failures.push('clinician role must retain clinical-write capability')
}

if (files.roles.includes("staff: ['read', 'clinical-write']")) {
  failures.push('staff role must not gain clinical-write capability')
}

if (
  !files.migration.includes('anatomy_review_required = false') ||
  !files.migration.includes('explanation_review_required = false') ||
  !files.migration.includes('approved_by is not null') ||
  !files.migration.includes('approved_at is not null')
) {
  failures.push(
    'production publish contract must require both review flags and explicit reviewer provenance',
  )
}

if (failures.length > 0) {
  console.error('MedAtlas clinician review gate FAILED')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  'MedAtlas clinician review gate PASS: review provenance, clinical-write authorization, reviewer/publisher separation, tenant/workspace binding and production approved_by/approved_at contract verified.',
)
