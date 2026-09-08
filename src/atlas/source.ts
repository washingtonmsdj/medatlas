import portugueseAnatomy from './portuguese-anatomy.json'
import type { AtlasConcept, HumanAtlas } from './types'

export const HUMAN_ATLAS_UPSTREAM_SHA =
  '1c38bf35c254a891200d3cedecfd57abebe83d8d'

function withoutTrailingSlash(value: string) {
  return value.length > 1 ? value.replace(/\/+$/, '') : value
}

const configuredAtlasAssetBase =
  import.meta.env.VITE_ATLAS_ASSET_BASE?.trim()

export const HUMAN_ATLAS_ASSET_BASE = withoutTrailingSlash(
  configuredAtlasAssetBase ||
    `${import.meta.env.BASE_URL}atlas-assets`,
)

export const PORTUGUESE_ALIASES =
  portugueseAnatomy.aliases as Record<string, string[]>

export const PORTUGUESE_LABELS =
  portugueseAnatomy.labels as Record<string, string>

let atlasPromise: Promise<HumanAtlas> | undefined

export function normalizeAnatomyText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function loadHumanAtlas(): Promise<HumanAtlas> {
  if (!atlasPromise) {
    atlasPromise = fetch(`${HUMAN_ATLAS_ASSET_BASE}/atlas.json`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Não foi possível carregar o catálogo anatômico.')
        }

        return response.json() as Promise<HumanAtlas>
      })
      .catch((error) => {
        atlasPromise = undefined
        throw error
      })
  }

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
