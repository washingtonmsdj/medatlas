import { readFile } from 'node:fs/promises'

const anatomy = JSON.parse(
  await readFile('src/atlas/portuguese-anatomy.json', 'utf8'),
)
const demo = JSON.parse(
  await readFile('src/clinical/demo-scenarios.json', 'utf8'),
)
const manifest = JSON.parse(
  await readFile(
    'third_party/human-atlas/CURATED_CONCEPTS.json',
    'utf8',
  ),
)

const failures = []
const manifestById = new Map(
  manifest.concepts.map((concept) => [concept.id, concept]),
)

function normalize(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^$(){}|[\]\\]/g, '\\$&')
}

function containsTerm(text, term) {
  const escaped = escapeRegExp(term)
  return new RegExp(
    `(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`,
    'i',
  ).test(text)
}

function resolveAliasCandidates(sourceText) {
  const text = normalize(sourceText)
  const candidates = new Map()

  for (const [alias, ids] of Object.entries(anatomy.aliases)) {
    const normalizedAlias = normalize(alias)
    if (!containsTerm(text, normalizedAlias)) continue

    for (const id of ids) {
      const score = 100 + Math.min(normalizedAlias.length, 40)
      const current = candidates.get(id)
      if (!current || current.score < score) {
        candidates.set(id, { id, alias, score })
      }
    }
  }

  return [...candidates.values()].sort(
    (a, b) =>
      b.score - a.score ||
      a.id.localeCompare(b.id),
  )
}

if (demo.schema !== 'medatlas.demo-scenarios/1') {
  failures.push(`unexpected demo scenario schema: ${demo.schema}`)
}

const seenIds = new Set()

for (const scenario of demo.scenarios) {
  if (seenIds.has(scenario.id)) {
    failures.push(`duplicate scenario id: ${scenario.id}`)
  }
  seenIds.add(scenario.id)

  const concept = manifestById.get(scenario.expectedConceptId)
  if (!concept) {
    failures.push(
      `${scenario.id}: expected concept ${scenario.expectedConceptId} is not in the pinned renderable manifest`,
    )
    continue
  }

  if (!scenario.sourceText?.trim() || !scenario.title?.trim()) {
    failures.push(`${scenario.id}: title/source text must be non-empty`)
  }

  const evidenceIds = anatomy.aliases[scenario.expectedEvidence]
  if (!Array.isArray(evidenceIds) ||
      !evidenceIds.includes(scenario.expectedConceptId)) {
    failures.push(
      `${scenario.id}: expected evidence "${scenario.expectedEvidence}" does not map to ${scenario.expectedConceptId}`,
    )
  }

  const candidates = resolveAliasCandidates(scenario.sourceText)
  if (candidates.length === 0) {
    failures.push(`${scenario.id}: report text resolves to no curated anatomy`)
    continue
  }

  if (candidates[0].id !== scenario.expectedConceptId) {
    failures.push(
      `${scenario.id}: top resolver candidate is ${candidates[0].id} via "${candidates[0].alias}", expected ${scenario.expectedConceptId}`,
    )
  }

  if (!concept.elements || concept.elements < 1) {
    failures.push(
      `${scenario.id}: expected concept ${scenario.expectedConceptId} has no renderable elements`,
    )
  }
}

if (demo.scenarios.length < 4) {
  failures.push('demo must cover at least four synthetic clinical scenarios')
}

if (failures.length > 0) {
  console.error('MedAtlas demo scenario contract FAILED')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log(
  `MedAtlas demo scenario contract PASS: ${demo.scenarios.length} scenarios resolve deterministically to pinned renderable concepts.`,
)
