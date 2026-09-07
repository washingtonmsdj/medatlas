import type { AtlasConcept, HumanAtlas } from './types'

export const HUMAN_ATLAS_UPSTREAM_SHA =
  '1c38bf35c254a891200d3cedecfd57abebe83d8d'

export const HUMAN_ATLAS_ASSET_BASE =
  import.meta.env.VITE_ATLAS_ASSET_BASE || '/atlas-assets'

export const PORTUGUESE_ALIASES: Record<string, string[]> = {
  'l1-l2': ['FMA16033'],
  'l1 l2': ['FMA16033'],
  'l2-l3': ['FMA16034'],
  'l2 l3': ['FMA16034'],
  'l3-l4': ['FMA16035'],
  'l3 l4': ['FMA16035'],
  'l4-l5': ['FMA16036'],
  'l4 l5': ['FMA16036'],
  'l5-s1': ['FMA16037'],
  'l5 s1': ['FMA16037'],
  'disco l4-l5': ['FMA16036'],
  'disco intervertebral l4-l5': ['FMA16036'],
  'coluna lombar': ['FMA16203'],
  'vertebras lombares': ['FMA9921'],
  'vértebras lombares': ['FMA9921'],
  'coluna cervical': ['FMA24138'],
  'vertebras cervicais': ['FMA9915'],
  'vértebras cervicais': ['FMA9915'],
  'medula espinhal': ['FMA7647'],
  coração: ['FMA7088'],
  coracao: ['FMA7088'],
  rins: ['FMA7203'],
  rim: ['FMA7203'],
  fêmur: ['FMA9611'],
  femur: ['FMA9611'],
  patela: ['FMA24485'],
  rótula: ['FMA24485'],
  rotula: ['FMA24485'],
  úmero: ['FMA13303'],
  umero: ['FMA13303'],
  fígado: ['FMA7197'],
  figado: ['FMA7197'],
  cérebro: ['FMA50801'],
  cerebro: ['FMA50801'],
  estômago: ['FMA7148'],
  estomago: ['FMA7148'],
  pâncreas: ['FMA7198'],
  pancreas: ['FMA7198'],
  baço: ['FMA7196'],
  baco: ['FMA7196'],
  bexiga: ['FMA15900'],
  próstata: ['FMA9600'],
  prostata: ['FMA9600'],
  supraespinal: ['FMA9629'],
  infraespinal: ['FMA32546'],
  subescapular: ['FMA13413'],
  'redondo menor': ['FMA32550'],
  'manguito rotador': [
    'FMA9629',
    'FMA32546',
    'FMA13413',
    'FMA32550',
  ],
}

export const PORTUGUESE_LABELS: Record<string, string> = {
  FMA16033: 'Disco intervertebral L1–L2',
  FMA16034: 'Disco intervertebral L2–L3',
  FMA16035: 'Disco intervertebral L3–L4',
  FMA16036: 'Disco intervertebral L4–L5',
  FMA16037: 'Disco intervertebral L5–S1',
  FMA16203: 'Coluna lombar',
  FMA9921: 'Vértebras lombares',
  FMA24138: 'Coluna cervical',
  FMA9915: 'Vértebras cervicais',
  FMA7647: 'Medula espinhal',
  FMA7088: 'Coração',
  FMA7203: 'Rins',
  FMA9611: 'Fêmures',
  FMA24485: 'Patelas',
  FMA13303: 'Úmeros',
  FMA7197: 'Fígado',
  FMA50801: 'Cérebro',
  FMA7148: 'Estômago',
  FMA7198: 'Pâncreas',
  FMA7196: 'Baço',
  FMA15900: 'Bexiga urinária',
  FMA9600: 'Próstata',
  FMA9629: 'Supraespinal',
  FMA32546: 'Infraespinal',
  FMA13413: 'Subescapular',
  FMA32550: 'Redondo menor',
}

let atlasPromise: Promise<HumanAtlas> | undefined

export function normalizeAnatomyText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export function loadHumanAtlas(): Promise<HumanAtlas> {
  atlasPromise ??= fetch(`${HUMAN_ATLAS_ASSET_BASE}/atlas.json`).then(
    async (response) => {
      if (!response.ok) {
        throw new Error('Não foi possível carregar o catálogo anatômico.')
      }

      return response.json() as Promise<HumanAtlas>
    },
  )

  return atlasPromise
}

export function findAtlasConcept(
  atlas: HumanAtlas,
  conceptId: string,
): AtlasConcept {
  const concept = atlas.concepts.find((candidate) => candidate.id === conceptId)

  if (!concept) {
    throw new Error(
      `A estrutura ${conceptId} não está disponível neste atlas anatômico.`,
    )
  }

  return concept
}

export function conceptDisplayName(concept: AtlasConcept) {
  return PORTUGUESE_LABELS[concept.id] ?? concept.name
}

export function searchAtlasConcepts(
  atlas: HumanAtlas,
  query: string,
  limit = 8,
): AtlasConcept[] {
  const normalizedQuery = normalizeAnatomyText(query)

  if (normalizedQuery.length < 2) return []

  const aliasIds = new Set(
    Object.entries(PORTUGUESE_ALIASES)
      .filter(([alias]) =>
        normalizeAnatomyText(alias).includes(normalizedQuery),
      )
      .flatMap(([, ids]) => ids),
  )

  const ranked = atlas.concepts
    .map((concept) => {
      const name = normalizeAnatomyText(concept.name)
      const id = concept.id.toLowerCase()
      let score = Number.POSITIVE_INFINITY

      if (aliasIds.has(concept.id)) score = 0
      else if (id === normalizedQuery || name === normalizedQuery) score = 1
      else if (name.startsWith(normalizedQuery)) score = 2
      else if (name.includes(normalizedQuery)) score = 3
      else if (id.includes(normalizedQuery)) score = 4

      return { concept, score }
    })
    .filter(({ score }) => Number.isFinite(score))
    .sort(
      (a, b) =>
        a.score - b.score ||
        a.concept.name.localeCompare(b.concept.name),
    )

  const seen = new Set<string>()
  const results: AtlasConcept[] = []

  for (const { concept } of ranked) {
    if (seen.has(concept.id)) continue
    seen.add(concept.id)
    results.push(concept)
    if (results.length >= limit) break
  }

  return results
}

export function assetUrl(path: string) {
  const filename = path.split('/').pop()

  if (!filename) {
    throw new Error('Caminho de geometria anatômica inválido.')
  }

  return `${HUMAN_ATLAS_ASSET_BASE}/${filename}`
}
