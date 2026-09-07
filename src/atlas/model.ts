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

export interface LoadedAtlasPart {
  part: AtlasPart
  geometry: THREE.BufferGeometry
  selected: boolean
}

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

function geometryFromPart(
  part: AtlasPart,
  buffer: ArrayBuffer,
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry()

  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(
      new Float32Array(buffer, part.positions, part.vertexCount * 3),
      3,
    ),
  )

  geometry.setAttribute(
    'normal',
    new THREE.BufferAttribute(
      new Int16Array(buffer, part.normals, part.vertexCount * 3),
      3,
      true,
    ),
  )

  geometry.setIndex(
    new THREE.BufferAttribute(
      new Uint32Array(buffer, part.indices, part.indexCount),
      1,
    ),
  )

  geometry.boundingBox = new THREE.Box3(
    new THREE.Vector3().fromArray(part.bounds[0]),
    new THREE.Vector3().fromArray(part.bounds[1]),
  )
  geometry.computeBoundingSphere()

  return geometry
}

function partCenter(part: AtlasPart) {
  return new THREE.Vector3()
    .fromArray(part.bounds[0])
    .add(new THREE.Vector3().fromArray(part.bounds[1]))
    .multiplyScalar(0.5)
}

export async function loadConceptScene(
  atlas: HumanAtlas,
  concept: AtlasConcept,
  contextMode: AtlasContextMode = 'system',
  contextLimit = 10,
): Promise<LoadedAtlasPart[]> {
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

  const allParts = [...selectedParts, ...contextParts]
  const neededChunks = new Set(allParts.map((part) => part.chunk))

  const chunkBuffers = new Map<number, ArrayBuffer>(
    await Promise.all(
      [...neededChunks].map(async (chunkIndex) => {
        const chunk = atlas.chunks[chunkIndex]

        if (!chunk) {
          throw new Error('O atlas referencia um bloco de geometria inexistente.')
        }

        return [
          chunkIndex,
          await loadChunkBuffer(chunk),
        ] as [number, ArrayBuffer]
      }),
    ),
  )

  return allParts.map((part) => {
    const buffer = chunkBuffers.get(part.chunk)

    if (!buffer) {
      throw new Error('Bloco anatômico carregado não pôde ser resolvido.')
    }

    return {
      part,
      geometry: geometryFromPart(part, buffer),
      selected: selectedIds.has(part.id),
    }
  })
}
