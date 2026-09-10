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
    id: 'professional_1',
    displayName: 'Dr. Teste',
    specialty: 'Ortopedia',
  },
  publishedAt: '2026-09-10T00:00:00.000Z',
}

const base = {
  id: 'rep_1',
  patient: {
    id: 'pat_1',
    displayName: 'Paciente demonstração',
    age: 52,
  },
  title: 'Relatório visual',
  status: 'published',
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

assert.equal(changed.status, 'draft')
assert.equal(changed.shareSlug, undefined)
assert.equal(changed.publicationIdentity, undefined)
assert.equal(changed.finding.anatomyReviewRequired, true)
assert.equal(changed.finding.patientExplanation, '')
assert.equal(changed.finding.explanationReviewRequired, true)
assert.equal(
  changed.finding.explanationProvenance.clinicianEdited,
  false,
)

const blockedDraft = reportWorkflowReducer(changed, {
  type: 'draft-generated',
  draft: {
    text: 'Não deve entrar.',
    provenance: {
      origin: 'deterministic',
      generatorId: 'test',
      generatorVersion: '1',
      generatedAt: '2026-09-07T00:00:00.000Z',
      clinicianEdited: false,
    },
  },
})

assert.deepEqual(blockedDraft, changed)

const confirmed = reportWorkflowReducer(changed, {
  type: 'anatomy-confirmed',
  conceptId: 'FMA7203',
  displayName: 'Rins',
})

assert.equal(confirmed.finding.atlasConceptId, 'FMA7203')
assert.equal(confirmed.finding.anatomicalStructure, 'Rins')
assert.equal(confirmed.finding.anatomyReviewRequired, false)
assert.equal(confirmed.finding.patientExplanation, '')

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

assert.equal(generated.status, 'draft')
assert.equal(
  generated.finding.patientExplanation,
  'Rascunho educacional.',
)
assert.equal(generated.finding.explanationReviewRequired, true)

const prematurePublish = reportWorkflowReducer(generated, {
  type: 'published',
  report: {
    ...generated,
    status: 'published',
    shareSlug: 'b'.repeat(64),
    publicationIdentity,
  },
})

assert.deepEqual(prematurePublish, generated)

const approved = reportWorkflowReducer(generated, {
  type: 'explanation-approved',
})

assert.equal(approved.status, 'clinician_review')
assert.equal(approved.finding.explanationReviewRequired, false)

const missingIdentity = reportWorkflowReducer(approved, {
  type: 'published',
  report: {
    ...approved,
    status: 'published',
    shareSlug: 'c'.repeat(64),
  },
})

assert.deepEqual(missingIdentity, approved)

const published = reportWorkflowReducer(approved, {
  type: 'published',
  report: {
    ...approved,
    status: 'published',
    shareSlug: 'c'.repeat(64),
    publicationIdentity,
  },
})

assert.equal(published.status, 'published')
assert.equal(published.shareSlug, 'c'.repeat(64))
assert.deepEqual(published.publicationIdentity, publicationIdentity)

const sharesCleared = reportWorkflowReducer(published, {
  type: 'shares-cleared',
})

assert.equal(sharesCleared.status, 'clinician_review')
assert.equal(sharesCleared.shareSlug, undefined)
assert.equal(sharesCleared.publicationIdentity, undefined)
assert.equal(sharesCleared.finding.explanationReviewRequired, false)

const edited = reportWorkflowReducer(published, {
  type: 'explanation-edited',
  value: 'Texto editado pelo profissional.',
})

assert.equal(edited.status, 'draft')
assert.equal(edited.shareSlug, undefined)
assert.equal(edited.publicationIdentity, undefined)
assert.equal(edited.finding.explanationReviewRequired, true)
assert.equal(
  edited.finding.explanationProvenance.clinicianEdited,
  true,
)

const wrongPublishedReport = reportWorkflowReducer(approved, {
  type: 'published',
  report: {
    ...approved,
    id: 'rep_other',
    status: 'published',
    shareSlug: 'd'.repeat(64),
    publicationIdentity,
  },
})

assert.deepEqual(wrongPublishedReport, approved)

console.log(
  'MedAtlas report workflow reducer PASS: publication invalidation, immutable publication identity, anatomy confirmation, draft gating, clinician review and publish acceptance verified.',
)
