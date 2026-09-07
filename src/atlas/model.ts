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

export interface LoadedAtlasPart {
  part: AtlasPart
  geometry: THREE.BufferGeometry
}

async function decodeModelResponse(
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

async function loadChunkBuffer(
  chunk: AtlasChunk,
  signal?: AbortSignal,
): Promise<ArrayBuffer> {
  const canDecompress =
    Boolean(chunk.gzip) && typeof DecompressionStream !== 'undefined'

  const response = await fetch(
    assetUrl(canDecompress ? chunk.gzip! : chunk.url),
    { signal },
  )

  return decodeModelResponse(response, chunk.bytes, canDecompress)
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

export async function loadConceptGeometries(
  atlas: HumanAtlas,
  concept: AtlasConcept,
  signal?: AbortSignal,
): Promise<LoadedAtlasPart[]> {
  const elementIds = new Set(concept.elements)
  const parts = atlas.parts.filter((part) => elementIds.has(part.id))

  if (parts.length === 0) {
    throw new Error('A estrutura selecionada não possui geometria renderizável.')
  }

  const partsByChunk = new Map<number, AtlasPart[]>()

  for (const part of parts) {
    const chunkParts = partsByChunk.get(part.chunk) ?? []
    chunkParts.push(part)
    partsByChunk.set(part.chunk, chunkParts)
  }

  const groups = await Promise.all(
    [...partsByChunk.entries()].map(async ([chunkIndex, chunkParts]) => {
      const chunk = atlas.chunks[chunkIndex]

      if (!chunk) {
        throw new Error('O atlas referencia um bloco de geometria inexistente.')
      }

      const buffer = await loadChunkBuffer(chunk, signal)

      return chunkParts.map((part) => ({
        part,
        geometry: geometryFromPart(part, buffer),
      }))
    }),
  )

  return groups.flat()
}
