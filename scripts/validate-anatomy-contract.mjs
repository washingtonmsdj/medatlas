import { readFile } from 'node:fs/promises'

const anatomy = JSON.parse(
  await readFile('src/atlas/portuguese-anatomy.json', 'utf8'),
)
const manifest = JSON.parse(
  await readFile(
    'third_party/human-atlas/CURATED_CONCEPTS.json',
    'utf8',
  ),
)

const expectedCommit =
  '1c38bf35c254a891200d3cedecfd57abebe83d8d'

const failures = []

if (manifest.upstream_commit !== expectedCommit) {
  failures.push(
    `curated manifest is pinned to ${manifest.upstream_commit}, expected ${expectedCommit}`,
  )
}

if (anatomy.schema !== 'medatlas.portuguese-anatomy/1') {
  failures.push(`unexpected Portuguese anatomy schema: ${anatomy.schema}`)
}

const manifestIds = new Set(
  manifest.concepts.map((concept) => concept.id),
)

const configuredIds = new Set([
  ...Object.values(anatomy.aliases).flat(),
  ...Object.keys(anatomy.labels),
])

for (const id of configuredIds) {
  if (!manifestIds.has(id)) {
    failures.push(
      `${id} is referenced by curated aliases/labels but absent from the pinned concept manifest`,
    )
  }
}

for (const [alias, ids] of Object.entries(anatomy.aliases)) {
  if (!alias.trim()) {
    failures.push('blank Portuguese anatomy alias')
  }

  if (!Array.isArray(ids) || ids.length < 1) {
    failures.push(`alias "${alias}" has no concept IDs`)
  }

  for (const id of ids) {
    if (!/^FMA\d+$/.test(id)) {
      failures.push(`alias "${alias}" contains invalid concept id ${id}`)
    }
  }
}

for (const [id, label] of Object.entries(anatomy.labels)) {
  if (!/^FMA\d+$/.test(id)) {
    failures.push(`invalid label concept id: ${id}`)
  }
  if (typeof label !== 'string' || label.trim().length < 2) {
    failures.push(`empty Portuguese label for ${id}`)
  }
}

for (const concept of manifest.concepts) {
  if (!/^FMA\d+$/.test(concept.id)) {
    failures.push(`invalid concept id: ${concept.id}`)
  }

  if (!concept.name || typeof concept.name !== 'string') {
    failures.push(`missing source name for ${concept.id}`)
  }

  if (!Number.isInteger(concept.elements) || concept.elements < 1) {
    failures.push(
      `${concept.id} has no renderable elements in the pinned atlas`,
    )
  }

  if (!Array.isArray(concept.systems) || concept.systems.length < 1) {
    failures.push(
      `${concept.id} has no mapped anatomical systems`,
    )
  }
}

const unused = [...manifestIds].filter((id) => !configuredIds.has(id))
if (unused.length > 0) {
  failures.push(
    `manifest has concepts no longer used by curated aliases/labels: ${unused.join(', ')}`,
  )
}

if (failures.length > 0) {
  console.error('MedAtlas anatomy contract FAILED')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log(
  `MedAtlas anatomy contract PASS: ${manifestIds.size} curated FMA concepts are pinned, renderable and referenced.`,
)
