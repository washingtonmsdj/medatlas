import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'

const source = await readFile(
  'src/domain/report-workflow.ts',
  'utf8',
)

const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
})

const moduleRecord = { exports: {} }

vm.runInNewContext(
  `(function (exports, module) {
${compiled.outputText}
  })(module.exports, module)`,
  { module: moduleRecord },
)

const { reportWorkflowReducer } = moduleRecord.exports

assert.equal(
  typeof reportWorkflowReducer,
  'function',
  'reportWorkflowReducer must be exported',
)

const reviewApproval = {
  organizationId: 'org_1',
  workspaceId: 'workspace_1',
  approvedBy: {
    id: 'reviewer_1',
    displayName: 'Dra. Revisora',
    specialty: 'Ortopedia',
  },
  approvedAt: '2026-09-10T00:00:00.000Z',
}

const publicationIdentity = {
  organizationId: 'org_1',
  organizationName: 'Clínica demonstração',
  workspaceId: 'workspace_1',
  workspaceName: 'Ortopedia',
  branding: {
    brandName: 'Clínica demonstração',
    patientFooterText: 'Clínica demonstração · teste',
  },
  professional: {
    id: 'publisher_1',
    displayName: 'Dr. Publicador',
    specialty: 'Ortopedia',
  },
  publishedAt: '2026-09-10T00:05:00.000Z',
}

const base = {
  id: 'rep_1',
  version: 1,
  patient: {
    id: 'pat_1',
    displayName: 'Paciente demonstração',
    age: 52,
  },
  title: 'Relatório visual',
  status: 'published',
  reviewApproval,
  shareSlug: 'a'.repeat(64),
  publicationIdentity,
  finding: {
    id: 'finding_1',
    sourceText: 'Texto com coração',
    anatomicalStructure: 'Coração',
    atlasRef: 'BodyParts3D 4.0 / FMA',
    atlasConceptId: 'FMA7088',
    anatomyReviewRequired: false,
    patientExplanation: 'Explicação revisada.',
    explanationReviewRequired: false,
    explanationProvenance: {
      origin: 'deterministic',
      generatorId: 'demo',
      generatorVersion: '1',
      generatedAt: '2026-09-07T00:00:00.000Z',
      clinicianEdited: false,
    },
    clinicianNote: 'Nota sintética.',
  },
}

const changed = reportWorkflowReducer(base, {
  type: 'source-text-changed',
  value: 'Novo texto com rim',
})

assert.equal(changed.version, 2)
assert.equal(changed.status, 'draft')
assert.equal(changed.reviewApproval, undefined)
assert.equal(changed.shareSlug, undefined)
assert.equal(changed.publicationIdentity, undefined)
assert.equal(changed.finding.anatomyReviewRequired, true)
assert.equal(changed.finding.patientExplanation, '')
assert.equal(changed.finding.explanationReviewRequired, true)

const confirmed = reportWorkflowReducer(changed, {
  type: 'anatomy-confirmed',
  conceptId: 'FMA7203',
  displayName: 'Rins',
})

const generated = reportWorkflowReducer(confirmed, {
  type: 'draft-generated',
  draft: {
    text: 'Rascunho educacional.',
    provenance: {
      origin: 'deterministic',
      generatorId: 'test',
      generatorVersion: '1',
      generatedAt: '2026-09-07T00:00:00.000Z',
      clinicianEdited: false,
    },
  },
})

const missingApproval = reportWorkflowReducer(generated, {
  type: 'explanation-approved',
})
assert.deepEqual(missingApproval, generated)

const invalidApproval = reportWorkflowReducer(generated, {
  type: 'explanation-approved',
  approval: {
    ...reviewApproval,
    approvedAt: 'not-a-date',
  },
})
assert.deepEqual(invalidApproval, generated)

const approved = reportWorkflowReducer(generated, {
  type: 'explanation-approved',
  approval: reviewApproval,
})

assert.equal(approved.version, 2)
assert.equal(approved.status, 'clinician_review')
assert.equal(approved.finding.explanationReviewRequired, false)
assert.deepEqual(approved.reviewApproval, reviewApproval)

const missingIdentity = reportWorkflowReducer(approved, {
  type: 'published',
  report: {
    ...approved,
    status: 'published',
    shareSlug: 'c'.repeat(64),
  },
})
assert.deepEqual(missingIdentity, approved)

const changedApproval = reportWorkflowReducer(approved, {
  type: 'published',
  report: {
    ...approved,
    reviewApproval: {
      ...reviewApproval,
      approvedBy: {
        ...reviewApproval.approvedBy,
        id: 'reviewer_other',
      },
    },
    status: 'published',
    shareSlug: 'c'.repeat(64),
    publicationIdentity,
  },
})
assert.deepEqual(changedApproval, approved)

const published = reportWorkflowReducer(approved, {
  type: 'published',
  report: {
    ...approved,
    status: 'published',
    shareSlug: 'c'.repeat(64),
    publicationIdentity,
  },
})

assert.equal(published.version, 2)
assert.equal(published.status, 'published')
assert.equal(published.shareSlug, 'c'.repeat(64))
assert.deepEqual(published.reviewApproval, reviewApproval)
assert.deepEqual(published.publicationIdentity, publicationIdentity)

const sharesCleared = reportWorkflowReducer(published, {
  type: 'shares-cleared',
})

assert.equal(sharesCleared.version, 2)
assert.equal(sharesCleared.status, 'clinician_review')
assert.deepEqual(sharesCleared.reviewApproval, reviewApproval)
assert.equal(sharesCleared.shareSlug, undefined)
assert.equal(sharesCleared.publicationIdentity, undefined)
assert.equal(sharesCleared.finding.explanationReviewRequired, false)

const edited = reportWorkflowReducer(published, {
  type: 'explanation-edited',
  value: 'Texto editado pelo profissional.',
})

assert.equal(edited.version, 3)
assert.equal(edited.status, 'draft')
assert.equal(edited.reviewApproval, undefined)
assert.equal(edited.shareSlug, undefined)
assert.equal(edited.publicationIdentity, undefined)
assert.equal(edited.finding.explanationReviewRequired, true)

console.log(
  'MedAtlas report workflow reducer PASS: content versioning, explicit authorized review provenance, approval invalidation, share revocation and immutable publication identity verified.',
)
