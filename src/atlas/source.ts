import type { AtlasConcept, HumanAtlas } from './types'

export const HUMAN_ATLAS_UPSTREAM_SHA =
  '1c38bf35c254a891200d3cedecfd57abebe83d8d'

export const HUMAN_ATLAS_ASSET_BASE = '/atlas-assets'

export async function loadHumanAtlas(signal?: AbortSignal): Promise<HumanAtlas> {
  const response = await fetch(`${HUMAN_ATLAS_ASSET_BASE}/atlas.json`, {
    signal,
  })

  if (!response.ok) {
    throw new Error('Não foi possível carregar o catálogo anatômico.')
  }

  return response.json() as Promise<HumanAtlas>
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

export function assetUrl(path: string) {
  const filename = path.split('/').pop()

  if (!filename) {
    throw new Error('Caminho de geometria anatômica inválido.')
  }

  return `${HUMAN_ATLAS_ASSET_BASE}/${filename}`
}
