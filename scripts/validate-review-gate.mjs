import { readFile } from 'node:fs/promises'

const files = {
  app: await readFile('src/App.tsx', 'utf8'),
  composer: await readFile('src/components/ReportComposer.tsx', 'utf8'),
  repository: await readFile(
    'src/data/demo-clinical-repository.ts',
    'utf8',
  ),
  migration: await readFile(
    'supabase/migrations/202609070001_medatlas_core.sql',
    'utf8',
  ),
  e2e: await readFile('tests/e2e/clinical-flow.spec.ts', 'utf8'),
}

const failures = []

const invariants = [
  [
    'frontend publish guard blocks anatomy review',
    files.app,
    'report.finding.anatomyReviewRequired',
  ],
  [
    'frontend publish guard blocks explanation review',
    files.app,
    'report.finding.explanationReviewRequired',
  ],
  [
    'composer disables publish on anatomy review',
    files.composer,
    'report.finding.anatomyReviewRequired',
  ],
  [
    'composer disables publish on explanation review',
    files.composer,
    'report.finding.explanationReviewRequired',
  ],
  [
    'demo repository rejects pending anatomy review',
    files.repository,
    'A anatomia precisa ser confirmada',
  ],
  [
    'demo repository rejects pending explanation review',
    files.repository,
    'A explicação precisa ser revisada',
  ],
  [
    'production contract stores anatomy review gate',
    files.migration,
    'anatomy_review_required boolean not null default true',
  ],
  [
    'production contract stores explanation review gate',
    files.migration,
    'explanation_review_required boolean not null default true',
  ],
  [
    'browser test verifies publish disabled before review',
    files.e2e,
    'publishBeforeReview',
  ],
  [
    'browser test performs explicit clinician review',
    files.e2e,
    'Aprovar explicação',
  ],
]

for (const [name, content, fragment] of invariants) {
  if (!content.includes(fragment)) {
    failures.push(`${name}: missing ${fragment}`)
  }
}

if (
  !files.migration.includes('anatomy_review_required = false') ||
  !files.migration.includes('explanation_review_required = false')
) {
  failures.push(
    'production publish/share contract must require both review flags to be false',
  )
}

if (failures.length > 0) {
  console.error('MedAtlas clinician review gate FAILED')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log(
  'MedAtlas clinician review gate PASS: UI, demo repository, production SQL contract and browser tests preserve explicit human review before publication.',
)
