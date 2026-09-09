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



const organRoot = 'public/organ-models'
const expectedOrganUpstream =
  '8c0e6f321a47f895ae58ce098028b92774733ee9'
const expectedOrganAssets = new Map([
  ['brain.glb', '2cd5e7178f1e5de707bb97c2c06f6c34fb5aaad28132445c0afcb4f0fd67c811'],
  ['eyeball.glb', '584337a2efc7d3c03d7326ca930217c4f7e5eca0a32a8cec141c7388ecc8a1c7'],
  ['heart.glb', 'ef48b43442dbbe2819d6035f8bbf1391d2c3fefbe842863c9c7c1a22cc6cd748'],
  ['intestine.glb', 'd4423ba0c8f08ac7652396e2530482f874e4964a9c3f1b71440f0493048bea26'],
  ['kidneys.glb', 'e3e0a58372d794d68b181d1d453ff4362da972667c28711e153c5f34064cf165'],
  ['liver.glb', 'e4f11a9c0762eb9dc4309dcd0d5c3e3958ccacab915267da4e7775894b674990'],
  ['lungs.glb', '81617c9fc2f2b7bf1e7d874b89614c89b09f2f68318e64997c68c948cfa9abdc'],
  ['pancreas.glb', 'e5213bf8ed66e8ed4eb2a9d1c7a6922fb926eac85de8c5979e780ca1abcaf1c3'],
  ['skin.glb', '8183ffe3527b3f071c41c55e41ffaf673df8d02a1405e95e644ac5d89cd6f5f9'],
])

const organManifest = JSON.parse(
  await readFile(path.join(organRoot, 'manifest.json'), 'utf8'),
)

if (organManifest.schema !== 'medatlas.organ-models/1') {
  failures.push(
    `unexpected organ model manifest schema: ${organManifest.schema}`,
  )
}

if (organManifest.upstreamCommit !== expectedOrganUpstream) {
  failures.push(
    `organ models point to ${organManifest.upstreamCommit}, expected ${expectedOrganUpstream}`,
  )
}

if (organManifest.upstreamRepository !== 'thebuggeddev/anatomy') {
  failures.push(
    `unexpected organ model upstream: ${organManifest.upstreamRepository}`,
  )
}

if (organManifest.generatedFromPinnedSource !== true) {
  failures.push('organ model manifest is not marked as generated from pinned source')
}

const organManifestByFile = new Map(
  (organManifest.assets ?? []).map((asset) => [asset.file, asset]),
)

if (organManifestByFile.size !== expectedOrganAssets.size) {
  failures.push(
    `organ model manifest contains ${organManifestByFile.size} assets, expected ${expectedOrganAssets.size}`,
  )
}

for (const [filename, expectedDigest] of expectedOrganAssets) {
  const entry = organManifestByFile.get(filename)

  if (!entry) {
    failures.push(`missing organ model manifest entry: ${filename}`)
    continue
  }

  if (entry.sha256 !== expectedDigest) {
    failures.push(
      `${filename} manifest SHA-256 differs from pinned expected digest`,
    )
  }

  if (!/^[0-9a-f]{40}$/.test(entry.sourceGitBlob ?? '')) {
    failures.push(`${filename} is missing its pinned upstream Git blob`)
  }

  const filePath = path.join(organRoot, filename)

  try {
    const info = await stat(filePath)

    if (!info.isFile() || info.size !== entry.bytes || info.size < 1024) {
      failures.push(
        `${filename} size mismatch: manifest=${entry.bytes}, actual=${info.size}`,
      )
      continue
    }

    const actual = await sha256(filePath)
    if (actual !== expectedDigest) {
      failures.push(
        `${filename} SHA-256 mismatch: expected ${expectedDigest}, got ${actual}`,
      )
    }
  } catch {
    failures.push(`missing vendored organ model: ${filename}`)
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
  `MedAtlas vendored anatomy assets PASS: ${expectedFiles.length} Human Atlas files + ${expectedOrganAssets.size} detailed organ models verified against pinned SHA-256 provenance.`,
)
