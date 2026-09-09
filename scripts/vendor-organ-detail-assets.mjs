import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const upstreamRepository = 'thebuggeddev/anatomy'
const upstreamCommit = '8c0e6f321a47f895ae58ce098028b92774733ee9'
const outputDir = 'public/organ-models'

const assets = [
  { file: 'brain.glb', gitBlob: 'd551379e516afb2e4b2d78c6364de7ef03378824' },
  { file: 'eyeball.glb', gitBlob: '110d6bf28928d4665fdb55ae7ce4e2d7f4dc1649' },
  { file: 'heart.glb', gitBlob: '613df32ebb5e2b73c59312b3b2c81fc63ece4884' },
  { file: 'intestine.glb', gitBlob: 'd5e06c9253401f77ac5d41c6ab6a03cefa456f33' },
  { file: 'kidneys.glb', gitBlob: '50c54b9081ff372d3ae7f33a5c283b1ae8d63974' },
  { file: 'liver.glb', gitBlob: 'ddeaac74267b485d10f3e0d99f5c2b6d7895abba' },
  { file: 'lungs.glb', gitBlob: '6ff0e23b33ab5d7a3c68eebe5ae26ce72550c8c6' },
  { file: 'pancreas.glb', gitBlob: '0359caeaca6d3359a51aecfda04d45cf46c17351' },
  { file: 'skin.glb', gitBlob: '0ee35f355c3d46ea6e95f22ca2597d754e8aea9f' },
]

async function fetchWithRetry(url, attempts = 3) {
  let lastError

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          'user-agent': 'MedAtlas-organ-asset-vendor/1',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`)
      }

      return Buffer.from(await response.arrayBuffer())
    } catch (error) {
      lastError = error
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 800))
      }
    }
  }

  throw lastError
}

function assertGlb(buffer, file) {
  if (buffer.length < 20 || buffer.subarray(0, 4).toString('ascii') !== 'glTF') {
    throw new Error(`${file}: downloaded payload is not a GLB file`)
  }
}

await mkdir(outputDir, { recursive: true })

const manifestAssets = []

for (const asset of assets) {
  const sourceUrl =
    `https://raw.githubusercontent.com/${upstreamRepository}/${upstreamCommit}/public/models/${asset.file}`

  const buffer = await fetchWithRetry(sourceUrl)
  assertGlb(buffer, asset.file)

  const sha256 = createHash('sha256').update(buffer).digest('hex')
  const destination = path.join(outputDir, asset.file)

  let unchanged = false
  try {
    const existing = await readFile(destination)
    unchanged =
      existing.length === buffer.length &&
      createHash('sha256').update(existing).digest('hex') === sha256
  } catch {
    // First vendoring of this file.
  }

  if (!unchanged) {
    await writeFile(destination, buffer)
  }

  manifestAssets.push({
    file: asset.file,
    bytes: buffer.length,
    sha256,
    sourceGitBlob: asset.gitBlob,
  })

  console.log(
    `${asset.file}: ${buffer.length} bytes sha256=${sha256} ${unchanged ? '(unchanged)' : '(written)'}`,
  )
}

const manifest = {
  schema: 'medatlas.organ-models/1',
  upstreamRepository,
  upstreamCommit,
  generatedFromPinnedSource: true,
  assets: manifestAssets,
}

await writeFile(
  path.join(outputDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2) + '\n',
)

console.log(
  `Vendored ${manifestAssets.length} detailed organ models from pinned upstream ${upstreamCommit}.`,
)
