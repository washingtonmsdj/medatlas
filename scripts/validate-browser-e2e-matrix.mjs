import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

const testsDirectory = path.join('tests', 'e2e')
const workflowPath = path.join('.github', 'workflows', 'browser-e2e.yml')

const entries = await readdir(testsDirectory, { withFileTypes: true })
const specPaths = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith('.spec.ts'))
  .map((entry) => path.posix.join('tests/e2e', entry.name))
  .sort()

const workflow = await readFile(workflowPath, 'utf8')
const references = workflow.match(/tests\/e2e\/[A-Za-z0-9._-]+\.spec\.ts/g) ?? []
const referenceCounts = new Map()

for (const reference of references) {
  referenceCounts.set(reference, (referenceCounts.get(reference) ?? 0) + 1)
}

const specSet = new Set(specPaths)
const missing = specPaths.filter((specPath) => !referenceCounts.has(specPath))
const unknown = [...referenceCounts.keys()]
  .filter((reference) => !specSet.has(reference))
  .sort()
const duplicated = [...referenceCounts.entries()]
  .filter(([, count]) => count !== 1)
  .map(([reference, count]) => `${reference} (${count}x)`)
  .sort()

if (missing.length || unknown.length || duplicated.length) {
  console.error('MedAtlas Browser E2E matrix coverage FAILED')

  if (missing.length) {
    console.error('- specs not assigned to any Browser E2E shard:')
    for (const specPath of missing) console.error(`  - ${specPath}`)
  }

  if (unknown.length) {
    console.error('- workflow references missing specs:')
    for (const reference of unknown) console.error(`  - ${reference}`)
  }

  if (duplicated.length) {
    console.error('- specs must belong to exactly one Browser E2E shard:')
    for (const reference of duplicated) console.error(`  - ${reference}`)
  }

  process.exit(1)
}

console.log(
  `MedAtlas Browser E2E matrix coverage PASS: ${specPaths.length} spec files assigned exactly once.`,
)
