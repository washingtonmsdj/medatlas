import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'

const root = 'public/atlas-assets'
const expectedUpstream =
  '1c38bf35c254a891200d3cedecfd57abebe83d8d'

const failures = []

async function sha256(filePath) {
  const hash = createHash('sha256')

  await new Promise((resolve, reject) => {
    const stream = createReadStream(filePath)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('end', resolve)
    stream.on('error', reject)
  })

  return hash.digest('hex')
}

const provenance = JSON.parse(
  await readFile(path.join(root, 'PROVENANCE.json'), 'utf8'),
)
const atlas = JSON.parse(
  await readFile(path.join(root, 'atlas.json'), 'utf8'),
)
const checksumLines = (
  await readFile(path.join(root, 'SHA256SUMS'), 'utf8')
)
  .trim()
  .split('\n')
  .filter(Boolean)

if (provenance.schema !== 'medatlas.atlas-assets/1') {
  failures.push(`unexpected asset provenance schema: ${provenance.schema}`)
}

if (provenance.upstream_commit !== expectedUpstream) {
  failures.push(
    `vendored assets point to ${provenance.upstream_commit}, expected ${expectedUpstream}`,
  )
}

const expectedFiles = [
  'atlas.json',
  ...Array.from({ length: 15 }, (_, index) =>
    `body-${index}.bin.gz`,
  ),
]

const checksumMap = new Map(
  checksumLines.map((line) => {
    const [digest, filename] = line.trim().split(/\s+/)
    return [filename, digest]
  }),
)

for (const filename of expectedFiles) {
  const expected = checksumMap.get(filename)

  if (!expected || !/^[0-9a-f]{64}$/.test(expected)) {
    failures.push(`missing/invalid SHA-256 entry for ${filename}`)
    continue
  }

  const filePath = path.join(root, filename)

  try {
    const info = await stat(filePath)

    if (!info.isFile() || info.size < 1024) {
      failures.push(`${filename} is missing or unexpectedly small`)
      continue
    }

    const actual = await sha256(filePath)

    if (actual !== expected) {
      failures.push(
        `${filename} SHA-256 mismatch: expected ${expected}, got ${actual}`,
      )
    }
  } catch {
    failures.push(`missing vendored asset: ${filename}`)
  }
}

if (checksumMap.size !== expectedFiles.length) {
  failures.push(
    `checksum manifest contains ${checksumMap.size} files, expected ${expectedFiles.length}`,
  )
}

if (!Array.isArray(atlas.chunks) || atlas.chunks.length !== 15) {
  failures.push(
    `atlas.json contains ${atlas.chunks?.length} chunks, expected 15`,
  )
} else {
  for (const chunk of atlas.chunks) {
    const filename = path.basename(chunk.gzip ?? '')

    if (!expectedFiles.includes(filename)) {
      failures.push(
        `atlas chunk references non-vendored gzip asset: ${filename || '(blank)'}`,
      )
    }
  }
}

const provenanceAssets = new Map(
  (provenance.assets ?? []).map((asset) => [
    asset.filename,
    asset.sha256,
  ]),
)

for (const [filename, digest] of checksumMap) {
  if (provenanceAssets.get(filename) !== digest) {
    failures.push(
      `provenance digest differs from SHA256SUMS for ${filename}`,
    )
  }
}

if (failures.length > 0) {
  console.error('MedAtlas vendored anatomy assets FAILED')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log(
  `MedAtlas vendored anatomy assets PASS: ${expectedFiles.length} immutable files verified against SHA-256 provenance.`,
)
