import { readFile } from 'node:fs/promises'

const source = await readFile('src/atlas/source.ts', 'utf8')
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

const manifestIds = new Set(
  manifest.concepts.map((concept) => concept.id),
)

const sourceIds = new Set(
  [...source.matchAll(/['"](FMA\d+)['"]/g)].map(
    (match) => match[1],
  ),
)

for (const id of sourceIds) {
  if (!manifestIds.has(id)) {
    failures.push(
      `${id} is referenced by curated UI aliases/labels but absent from the pinned concept manifest`,
    )
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

if (sourceIds.size !== manifestIds.size) {
  const unused = [...manifestIds].filter((id) => !sourceIds.has(id))

  if (unused.length > 0) {
    failures.push(
      `manifest has concepts no longer used by curated aliases/labels: ${unused.join(', ')}`,
    )
  }
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
