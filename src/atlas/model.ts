/**
 * Binary decoding follows the Human Atlas BodyParts3D packaging contract.
 * Human Atlas is MIT licensed, Copyright (c) 2026 ashemag.
 * See third_party/human-atlas/LICENSE and PROVENANCE.md.
 */

import * as THREE from 'three'
import { assetUrl } from './source'
import type {
  AtlasChunk,
  AtlasConcept,
  AtlasPart,
  HumanAtlas,
} from './types'

export type AtlasContextMode = 'none' | 'system' | 'region'

const chunkBufferCache = new Map<string, Promise<ArrayBuffer>>()

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

function partCenter(part: AtlasPart) {
  return new THREE.Vector3()
    .fromArray(part.bounds[0])
    .add(new THREE.Vector3().fromArray(part.bounds[1]))
    .multiplyScalar(0.5)
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
  const selectedBounds = new THREE.Box3()

  for (const part of selectedParts) {
    selectedBounds.union(
      new THREE.Box3(
        new THREE.Vector3().fromArray(part.bounds[0]),
        new THREE.Vector3().fromArray(part.bounds[1]),
      ),
    )
  }

  const selectedCenter = selectedBounds.getCenter(new THREE.Vector3())
  const effectiveLimit =
    contextMode === 'region' ? Math.max(contextLimit, 18) : contextLimit

  const contextParts =
    contextMode === 'none'
      ? []
      : atlas.parts
          .filter(
            (part) =>
              !selectedIds.has(part.id) &&
              selectedChunks.has(part.chunk) &&
              (contextMode === 'region' ||
                selectedSystems.has(part.system)),
          )
          .map((part) => ({
            part,
            distance: partCenter(part).distanceToSquared(selectedCenter),
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
