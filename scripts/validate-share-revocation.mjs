import { readFile } from 'node:fs/promises'

const [
  clinicalRepository,
  demoRepository,
  repositoryBoundary,
  app,
  demoSettings,
  securityDoc,
] = await Promise.all([
  readFile('src/data/clinical-repository.ts', 'utf8'),
  readFile('src/data/demo-clinical-repository.ts', 'utf8'),
  readFile('src/data/repository.ts', 'utf8'),
  readFile('src/App.tsx', 'utf8'),
  readFile('src/components/DemoSettings.tsx', 'utf8'),
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
    'global demo revocation',
    demoRepository,
    'export function clearDemoShares()',
  ],
  [
    'persisted revocation confirmation',
    demoRepository,
    'window.localStorage.getItem(key) !== null',
  ],
  [
    'global revocation fail-closed message',
    demoRepository,
    'Não foi possível confirmar a revogação de todos os links ativos.',
  ],
  [
    'per-report revocation fail-closed message',
    demoRepository,
    'A alteração foi bloqueada para preservar a segurança do relatório.',
  ],
  [
    'adapter delegation',
    repositoryBoundary,
    'return demoClinicalRepository.revokeReportShares(reportId)',
  ],
  [
    'global adapter delegation',
    repositoryBoundary,
    'return clearDemoShares()',
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
    'settings catches global revocation failure',
    demoSettings,
    'const removed = revokeAllActivePatientShares()',
  ],
  [
    'settings preserves share state until revocation succeeds',
    demoSettings,
    'onSharesCleared()',
  ],
  [
    'settings exposes revocation failure as alert',
    demoSettings,
    "role={message.kind === 'error' ? 'alert' : 'status'}",
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

const globalCleanup = demoRepository.slice(
  demoRepository.indexOf('export function clearDemoShares()'),
  demoRepository.indexOf('export function revokeDemoReportShares'),
)

if (!globalCleanup.includes("throw new Error(\n      'Não foi possível confirmar a revogação de todos os links ativos.")) {
  failures.push(
    'global demo revocation must throw instead of reporting success when persisted cleanup cannot be confirmed',
  )
}

if (
  globalCleanup.indexOf('memoryShares.clear()') <
  globalCleanup.indexOf('window.localStorage.getItem(key) !== null')
) {
  failures.push(
    'global demo revocation must not clear all in-memory share state before persisted removals are confirmed',
  )
}

const settingsClear = demoSettings.slice(
  demoSettings.indexOf('const clear = () =>'),
  demoSettings.indexOf('return ('),
)

if (
  settingsClear.indexOf('onSharesCleared()') <
  settingsClear.indexOf('const removed = revokeAllActivePatientShares()')
) {
  failures.push(
    'settings must not clear the current report share state before global persisted revocation succeeds',
  )
}

if (!settingsClear.includes('} catch (error) {')) {
  failures.push(
    'settings global share cleanup must surface repository revocation failures',
  )
}

if (failures.length > 0) {
  console.error('MedAtlas share revocation contract FAILED')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  'MedAtlas share revocation contract PASS: per-report and global demo cleanup confirm persisted revocation, keep UI/state fail closed on storage failure, and only clear share state after successful revocation.',
)