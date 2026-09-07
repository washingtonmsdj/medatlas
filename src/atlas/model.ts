/**
 * Binary decoding follows the Human Atlas BodyParts3D packaging contract.
 * Human Atlas is MIT licensed, Copyright (c) 2026 ashemag.
 * See third_party/human-atlas/LICENSE and PROVENANCE.md.
 */

import * as THREE from 'three'
import { assetUrl } from './source'
import type { AtlasPart, HumanAtlas } from './types'

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

export async function loadPartGeometry(
  atlas: HumanAtlas,
  part: AtlasPart,
  signal?: AbortSignal,
): Promise<THREE.BufferGeometry> {
  const chunk = atlas.chunks[part.chunk]
  const canDecompress =
    Boolean(chunk.gzip) && typeof DecompressionStream !== 'undefined'

  const response = await fetch(
    assetUrl(canDecompress ? chunk.gzip! : chunk.url),
    { signal },
  )

  const buffer = await decodeModelResponse(
    response,
    chunk.bytes,
    canDecompress,
  )

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

  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()

  return geometry
}
