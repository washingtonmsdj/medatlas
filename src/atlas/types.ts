export interface AtlasPart {
  id: string
  name: string
  conceptId: string
  system: string
  chunk: number
  positions: number
  normals: number
  indices: number
  vertexCount: number
  indexCount: number
  bounds: [number[], number[]]
}

export interface AtlasConcept {
  id: string
  name: string
  elements: string[]
}

export interface AtlasChunk {
  url: string
  bytes: number
  gzip?: string
  gzipBytes?: number
}

export interface HumanAtlas {
  version: string
  source?: string
  scope?: string
  parts: AtlasPart[]
  concepts: AtlasConcept[]
  chunks: AtlasChunk[]
  triangles: number
}
