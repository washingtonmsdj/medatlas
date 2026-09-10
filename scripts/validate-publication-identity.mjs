import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'

function compileCommonJs(source) {
  return ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText
}

const rolesSource = await readFile('src/organization/roles.ts', 'utf8')
const rolesModule = { exports: {} }
vm.runInNewContext(
  `(function (exports, module) {
${compileCommonJs(rolesSource)}
  })(module.exports, module)`,
  { module: rolesModule },
)

const helperSource = await readFile(
  'src/organization/report-publication.ts',
  'utf8',
)
const moduleRecord = { exports: {} }
const localRequire = (request) => {
  if (request === './roles') return rolesModule.exports
  throw new Error(`Unexpected runtime dependency: ${request}`)
}

vm.runInNewContext(
  `(function (exports, module, require) {
${compileCommonJs(helperSource)}
  })(module.exports, module, localRequire)`,
  { module: moduleRecord, localRequire },
)

const { createReportPublicationIdentity } = moduleRecord.exports

assert.equal(
  typeof createReportPublicationIdentity,
  'function',
  'publication identity builder must be exported',
)

const professional = {
  id: 'member_1',
  displayName: 'Dra. Teste',
  initials: 'DT',
  role: 'clinician',
  active: true,
  professional: {
    specialty: 'Cardiologia',
  },
}

const workspace = {
  id: 'workspace_1',
  organizationId: 'org_1',
  name: 'Cardiologia',
  slug: 'cardiologia',
  active: true,
}

const runtime = {
  mode: 'demo',
  organization: {
    id: 'org_1',
    name: 'Clínica Teste',
    slug: 'clinica-teste',
    units: [],
    workspaces: [workspace],
    members: [professional],
  },
  branding: {
    organizationId: 'org_1',
    brandName: 'Clínica Teste',
    markText: 'CT',
    primaryColorHex: '#000000',
    patientFooterText: 'Clínica Teste',
  },
  defaultWorkspaceId: workspace.id,
  getCurrentMember: () => professional,
  getWorkspace: (workspaceId) =>
    workspaceId === workspace.id ? workspace : null,
  getUnit: () => null,
}

const identity = createReportPublicationIdentity(runtime)

assert.equal(identity.organizationId, 'org_1')
assert.equal(identity.organizationName, 'Clínica Teste')
assert.equal(identity.workspaceId, 'workspace_1')
assert.equal(identity.workspaceName, 'Cardiologia')
assert.equal(identity.branding.brandName, 'Clínica Teste')
assert.equal(identity.professional.id, 'member_1')
assert.equal(identity.professional.displayName, 'Dra. Teste')
assert.equal(identity.professional.specialty, 'Cardiologia')
assert.ok(Number.isFinite(Date.parse(identity.publishedAt)))

assert.equal(
  createReportPublicationIdentity({
    ...runtime,
    getWorkspace: () => null,
  }),
  null,
  'missing workspace must fail closed',
)

assert.equal(
  createReportPublicationIdentity({
    ...runtime,
    getWorkspace: () => ({ ...workspace, organizationId: 'org_other' }),
  }),
  null,
  'cross-organization workspace must fail closed',
)

assert.equal(
  createReportPublicationIdentity({
    ...runtime,
    branding: { ...runtime.branding, organizationId: 'org_other' },
  }),
  null,
  'cross-organization branding must fail closed',
)

assert.equal(
  createReportPublicationIdentity({
    ...runtime,
    organization: {
      ...runtime.organization,
      members: [{ ...professional, active: false }],
    },
  }),
  null,
  'inactive publisher membership must fail closed',
)

const staff = { ...professional, id: 'member_staff', role: 'staff' }
assert.equal(
  createReportPublicationIdentity({
    ...runtime,
    organization: {
      ...runtime.organization,
      members: [staff],
    },
    getCurrentMember: () => staff,
  }),
  null,
  'publisher without clinical-write must fail closed',
)

const repository = await readFile('src/data/repository.ts', 'utf8')
const workflow = await readFile('src/domain/report-workflow.ts', 'utf8')
const patient = await readFile('src/components/PatientReportPage.tsx', 'utf8')
const domainTypes = await readFile('src/domain/types.ts', 'utf8')

for (const fragment of [
  'createReportPublicationIdentity',
  'publicationIdentity,',
  'organizationBoundDemoRepository',
  'reviewApproval.workspaceId',
]) {
  assert.ok(
    repository.includes(fragment),
    `repository must bind publication identity: ${fragment}`,
  )
}

for (const fragment of [
  'publicationIdentity: undefined',
  '!action.report.publicationIdentity',
  'sameReviewApproval(report, action.report)',
]) {
  assert.ok(
    workflow.includes(fragment),
    `workflow must invalidate/require publication identity: ${fragment}`,
  )
}

for (const fragment of [
  'const publicationIdentity = report.publicationIdentity',
  'const reviewApproval = report.reviewApproval',
  '!previewMode &&',
  '!publicationIdentity',
  '!reviewApproval',
  'publicationIdentity?.professional.displayName',
  'publicationIdentity?.branding',
  'Revisado por',
  'Compartilhado por',
]) {
  assert.ok(
    patient.includes(fragment),
    `patient report must consume immutable review/publication identities: ${fragment}`,
  )
}

assert.ok(
  domainTypes.includes('export interface ReportPublicationIdentity'),
  'domain must expose the publication identity contract',
)
assert.ok(
  domainTypes.includes('export interface ReportReviewApproval'),
  'domain must expose the review approval contract',
)

console.log(
  'MedAtlas publication identity contract PASS: publication snapshots require clinical-write, fail closed on invalid organization context, preserve reviewer/publisher separation and drive the shared patient surface.',
)
