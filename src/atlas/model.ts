/**
 * Binary decoding follows the Human Atlas BodyParts3D packaging contract.
 * Human Atlas is MIT licensed, Copyright (c) 2026 ashemag.
 * See third_party/human-atlas/LICENSE and PROVENANCE.md.
 */

import { assetUrl } from './source'
import type {
  AtlasChunk,
  AtlasConcept,
  AtlasPart,
  HumanAtlas,
} from './types'

export type AtlasContextMode = 'none' | 'system' | 'region'

const chunkBufferCache = new Map<string, Promise<ArrayBuffer>>()
const REGION_MAX_CHUNKS = 3
const REGION_MAX_CONTEXT_PARTS = 12
const REGION_SYSTEM_PENALTY = 0.6
const REGION_CENTER_WEIGHT = 0.035

type Vec3 = [number, number, number]
type Bounds3 = [Vec3, Vec3]

export async function decodeModelResponse(
  response: Response,
  expectedBytes: number,
  compressed: boolean,
): Promise<ArrayBuffer> {
  if (!response.ok) {
    throw new Error('Uma parte da anatomia não pôde ser carregada.')
  }

  const payload = await response.arrayBuffer()
  const signature = new Uint8Array(payload, 0, Math.min(2, payload.byteLength))
  const isGzip =
    compressed && signature[0] === 0x1f && signature[1] === 0x8b

  if (isGzip && typeof DecompressionStream === 'undefined') {
    throw new Error(
      'Este navegador não oferece descompressão nativa necessária para a anatomia 3D.',
    )
  }

  const buffer = isGzip
    ? await new Response(
        new Blob([payload])
          .stream()
          .pipeThrough(new DecompressionStream('gzip')),
      ).arrayBuffer()
    : payload

  if (buffer.byteLength !== expectedBytes) {
    throw new Error('A geometria anatômica chegou incompleta.')
  }

  return buffer
}

export async function loadChunkBuffer(chunk: AtlasChunk): Promise<ArrayBuffer> {
  const compressed = Boolean(chunk.gzip)
  const url = assetUrl(chunk.gzip ?? chunk.url)
  const cached = chunkBufferCache.get(url)

  if (cached) return cached

  const request = fetch(url)
    .then((response) =>
      decodeModelResponse(response, chunk.bytes, compressed),
    )
    .catch((error) => {
      chunkBufferCache.delete(url)
      throw error
    })

  chunkBufferCache.set(url, request)
  return request
}

function partCenter(part: AtlasPart): Vec3 {
  return [
    (part.bounds[0][0] + part.bounds[1][0]) * 0.5,
    (part.bounds[0][1] + part.bounds[1][1]) * 0.5,
    (part.bounds[0][2] + part.bounds[1][2]) * 0.5,
  ]
}

function distanceToSquared(a: Vec3, b: Vec3) {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  const dz = a[2] - b[2]
  return dx * dx + dy * dy + dz * dz
}

function mergedBounds(parts: AtlasPart[]): Bounds3 {
  const min: Vec3 = [Infinity, Infinity, Infinity]
  const max: Vec3 = [-Infinity, -Infinity, -Infinity]

  for (const part of parts) {
    for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis], part.bounds[0][axis])
      max[axis] = Math.max(max[axis], part.bounds[1][axis])
    }
  }

  return [min, max]
}

function boundsCenter(bounds: Bounds3): Vec3 {
  return [
    (bounds[0][0] + bounds[1][0]) * 0.5,
    (bounds[0][1] + bounds[1][1]) * 0.5,
    (bounds[0][2] + bounds[1][2]) * 0.5,
  ]
}

function axisGap(candidateMin: number, candidateMax: number, focusMin: number, focusMax: number) {
  if (candidateMax < focusMin) return focusMin - candidateMax
  if (candidateMin > focusMax) return candidateMin - focusMax
  return 0
}

function regionalDistanceScore(
  part: AtlasPart,
  focusBounds: Bounds3,
  focusCenter: Vec3,
  selectedSystems: Set<string>,
) {
  const focusExtents: Vec3 = [
    focusBounds[1][0] - focusBounds[0][0],
    focusBounds[1][1] - focusBounds[0][1],
    focusBounds[1][2] - focusBounds[0][2],
  ]
  const largestExtent = Math.max(...focusExtents, 1)
  const axisScale: Vec3 = focusExtents.map((extent) =>
    Math.max(extent, largestExtent * 0.35),
  ) as Vec3

  let gapScore = 0
  for (let axis = 0; axis < 3; axis += 1) {
    const gap = axisGap(
      part.bounds[0][axis],
      part.bounds[1][axis],
      focusBounds[0][axis],
      focusBounds[1][axis],
    )
    gapScore += (gap / axisScale[axis]) ** 2
  }

  const centerScore =
    distanceToSquared(partCenter(part), focusCenter) /
    (largestExtent * largestExtent)
  const systemPenalty = selectedSystems.has(part.system)
    ? 0
    : REGION_SYSTEM_PENALTY

  return gapScore + centerScore * REGION_CENTER_WEIGHT + systemPenalty
}

function selectRegionalContext(
  atlas: HumanAtlas,
  selectedIds: Set<string>,
  selectedParts: AtlasPart[],
  selectedSystems: Set<string>,
  contextLimit: number,
) {
  const focusBounds = mergedBounds(selectedParts)
  const focusCenter = boundsCenter(focusBounds)
  const selectedChunks = new Set(selectedParts.map((part) => part.chunk))
  const admittedChunks = new Set(selectedChunks)

  const ranked = atlas.parts
    .filter((part) => !selectedIds.has(part.id))
    .map((part) => ({
      part,
      score: regionalDistanceScore(
        part,
        focusBounds,
        focusCenter,
        selectedSystems,
      ),
    }))
    .sort((a, b) => a.score - b.score)

  const contextParts: AtlasPart[] = []

  for (const { part } of ranked) {
    const chunkAlreadyAdmitted = admittedChunks.has(part.chunk)
    if (!chunkAlreadyAdmitted && admittedChunks.size >= REGION_MAX_CHUNKS) {
      continue
    }

    admittedChunks.add(part.chunk)
    contextParts.push(part)

    if (contextParts.length >= contextLimit) break
  }

  return contextParts
}

export function selectConceptSceneParts(
  atlas: HumanAtlas,
  concept: AtlasConcept,
  contextMode: AtlasContextMode = 'system',
  contextLimit = 10,
) {
  const selectedIds = new Set(concept.elements)
  const selectedParts = atlas.parts.filter((part) => selectedIds.has(part.id))

  if (selectedParts.length === 0) {
    throw new Error('A estrutura selecionada não possui geometria renderizável.')
  }

  const selectedChunks = new Set(selectedParts.map((part) => part.chunk))
  const selectedSystems = new Set(selectedParts.map((part) => part.system))
  const effectiveLimit =
    contextMode === 'region'
      ? Math.min(contextLimit, REGION_MAX_CONTEXT_PARTS)
      : contextLimit

  const contextParts =
    contextMode === 'none'
      ? []
      : contextMode === 'region'
        ? selectRegionalContext(
            atlas,
            selectedIds,
            selectedParts,
            selectedSystems,
            effectiveLimit,
          )
        : atlas.parts
            .filter(
              (part) =>
                !selectedIds.has(part.id) &&
                selectedChunks.has(part.chunk) &&
                selectedSystems.has(part.system),
            )
            .map((part) => ({
              part,
              distance: distanceToSquared(
                partCenter(part),
                boundsCenter(mergedBounds(selectedParts)),
              ),
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, effectiveLimit)
            .map(({ part }) => part)

  return {
    selectedIds,
    selectedParts,
    contextParts,
    allParts: [...selectedParts, ...contextParts],
  }
}

export function createFocusedAtlas(
  atlas: HumanAtlas,
  concept: AtlasConcept,
  contextMode: AtlasContextMode = 'system',
  contextLimit = 10,
): HumanAtlas {
  const { allParts } = selectConceptSceneParts(
    atlas,
    concept,
    contextMode,
    contextLimit,
  )

  const originalChunkIndexes = [
    ...new Set(allParts.map((part) => part.chunk)),
  ].sort((a, b) => a - b)

  const remappedChunkIndexes = new Map(
    originalChunkIndexes.map((chunkIndex, nextIndex) => [
      chunkIndex,
      nextIndex,
    ]),
  )

  const chunks = originalChunkIndexes.map((chunkIndex) => {
    const chunk = atlas.chunks[chunkIndex]

    if (!chunk) {
      throw new Error('O atlas referencia um bloco de geometria inexistente.')
    }

    return chunk
  })

  const parts = allParts.map((part) => {
    const chunk = remappedChunkIndexes.get(part.chunk)

    if (chunk === undefined) {
      throw new Error('Não foi possível remapear o bloco anatômico focado.')
    }

    return {
      ...part,
      chunk,
    }
  })

  return {
    ...atlas,
    parts,
    chunks,
    concepts: [concept],
  }
}
