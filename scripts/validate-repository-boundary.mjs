import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

const failures = []

async function collectSourceFiles(root) {
  const entries = await readdir(root, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const full = path.join(root, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(full)))
      continue
    }

    if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      files.push(full)
    }
  }

  return files
}

const sourceFiles = await collectSourceFiles('src')
const repositoryBoundary = path.normalize('src/data/repository.ts')

for (const file of sourceFiles) {
  if (path.normalize(file) === repositoryBoundary) continue

  const source = await readFile(file, 'utf8')
  if (source.includes('demo-clinical-repository')) {
    failures.push(
      `${file} bypasses the active clinical repository boundary and imports the raw demo repository`,
    )
  }
}

const boundary = await readFile('src/data/repository.ts', 'utf8')
const demoRepository = await readFile(
  'src/data/demo-clinical-repository.ts',
  'utf8',
)

for (const fragment of [
  'organizationBoundDemoRepository',
  'const reviewApproval = report.reviewApproval',
  'createReportPublicationIdentity',
  'reviewApproval.organizationId !== publicationIdentity.organizationId',
  'reviewApproval.workspaceId !== publicationIdentity.workspaceId',
]) {
  if (!boundary.includes(fragment)) {
    failures.push(`clinical repository boundary missing invariant: ${fragment}`)
  }
}

for (const fragment of [
  'hasValidReviewPublicationBinding',
  '!report.reviewApproval',
  '!report.publicationIdentity',
  'reviewApproval.organizationId === publicationIdentity.organizationId',
  'reviewApproval.workspaceId === publicationIdentity.workspaceId',
  'Number.isFinite(Date.parse(reviewApproval.approvedAt))',
  'Number.isFinite(Date.parse(publicationIdentity.publishedAt))',
]) {
  if (!demoRepository.includes(fragment)) {
    failures.push(`raw demo repository missing fail-closed invariant: ${fragment}`)
  }
}

if (failures.length > 0) {
  console.error('MedAtlas clinical repository boundary FAILED')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  'MedAtlas clinical repository boundary PASS: UI cannot bypass the active repository adapter and the raw demo repository independently verifies review/publication binding.',
)
