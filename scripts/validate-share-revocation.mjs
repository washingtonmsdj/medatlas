import { readFile } from 'node:fs/promises'

const [clinicalRepository, demoRepository, repositoryBoundary, app, securityDoc] =
  await Promise.all([
    readFile('src/data/clinical-repository.ts', 'utf8'),
    readFile('src/data/demo-clinical-repository.ts', 'utf8'),
    readFile('src/data/repository.ts', 'utf8'),
    readFile('src/App.tsx', 'utf8'),
    readFile('docs/SECURITY.md', 'utf8'),
  ])

const failures = []

const required = [
  [
    'clinical repository contract',
    clinicalRepository,
    'revokeReportShares(reportId: string): Promise<number>',
  ],
  [
    'demo per-report revocation',
    demoRepository,
    'export function revokeDemoReportShares(reportId: string)',
  ],
  [
    'persisted revocation confirmation',
    demoRepository,
    'window.localStorage.getItem(key) !== null',
  ],
  [
    'revocation fail-closed message',
    demoRepository,
    'A alteração foi bloqueada para preservar a segurança do relatório.',
  ],
  [
    'adapter delegation',
    repositoryBoundary,
    'return demoClinicalRepository.revokeReportShares(reportId)',
  ],
  [
    'published-version transition detection',
    app,
    "report.status === 'published' && nextReport.version > report.version",
  ],
  [
    'mutation revokes through repository boundary',
    app,
    '.revokeReportShares(report.id)',
  ],
  [
    'same-version revocation coalescing',
    app,
    'shareRevocations.current.get(revocationKey)',
  ],
  [
    'canonical share-version security policy',
    securityDoc,
    'the report version still matches the version captured at share creation;',
  ],
]

for (const [label, source, fragment] of required) {
  if (!source.includes(fragment)) {
    failures.push(`${label} missing invariant: ${fragment}`)
  }
}

if (repositoryBoundary.includes('revokeActivePatientSharesForReport')) {
  failures.push(
    'repository boundary must not expose a second direct per-report revocation API outside ClinicalRepository',
  )
}

if (!demoRepository.includes('entry.report.id !== reportId')) {
  failures.push('demo revocation is not scoped to the target report')
}

if (!demoRepository.includes('memoryShares.delete(token)')) {
  failures.push('demo revocation does not clean the in-memory share cache')
}

if (failures.length > 0) {
  console.error('MedAtlas share revocation contract FAILED')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  'MedAtlas share revocation contract PASS: published-version mutations revoke only their report shares through the repository boundary and fail closed when persisted revocation cannot be confirmed.',
)
