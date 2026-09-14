#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

const args = process.argv.slice(2);
const getArg = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const glbPath = getArg('--glb');
const metadataPath = getArg('--metadata');
const outputPath = getArg('--out');

if (!glbPath || !metadataPath || !outputPath) {
  console.error('Usage: node scripts/inventory-hra-female.mjs --glb <file.glb> --metadata <metadata.json> --out <manifest.json>');
  process.exit(2);
}

const readJson = async (path) => JSON.parse(await readFile(resolve(path), 'utf8'));
const glb = await readFile(resolve(glbPath));
const metadata = await readJson(metadataPath);

if (glb.length < 20 || glb.toString('ascii', 0, 4) !== 'glTF') {
  throw new Error(`Invalid GLB header: ${glbPath}`);
}
const version = glb.readUInt32LE(4);
const declaredLength = glb.readUInt32LE(8);
if (version !== 2) throw new Error(`Unsupported GLB version: ${version}`);
if (declaredLength !== glb.length) throw new Error(`GLB length mismatch: header=${declaredLength} actual=${glb.length}`);

let offset = 12;
let jsonChunk = null;
let binaryChunkBytes = 0;
while (offset < glb.length) {
  if (offset + 8 > glb.length) throw new Error('Truncated GLB chunk header');
  const chunkLength = glb.readUInt32LE(offset);
  const chunkType = glb.readUInt32LE(offset + 4);
  const chunkStart = offset + 8;
  const chunkEnd = chunkStart + chunkLength;
  if (chunkEnd > glb.length) throw new Error('Truncated GLB chunk payload');
  if (chunkType === 0x4e4f534a) {
    jsonChunk = JSON.parse(glb.toString('utf8', chunkStart, chunkEnd).replace(/\u0000+$/g, ''));
  } else if (chunkType === 0x004e4942) {
    binaryChunkBytes += chunkLength;
  }
  offset = chunkEnd;
}
if (!jsonChunk) throw new Error('GLB JSON chunk not found');

const accessors = jsonChunk.accessors ?? [];
const meshes = jsonChunk.meshes ?? [];
const nodes = jsonChunk.nodes ?? [];
const scenes = jsonChunk.scenes ?? [];
const primitives = meshes.flatMap((mesh, meshIndex) => (mesh.primitives ?? []).map((primitive, primitiveIndex) => ({ meshIndex, primitiveIndex, primitive })));

const componentBytes = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const typeComponents = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };
const accessorCount = (accessor) => accessor?.count ?? 0;
const accessorBytes = (accessor) => accessor ? accessorCount(accessor) * (componentBytes[accessor.componentType] ?? 0) * (typeComponents[accessor.type] ?? 0) : 0;

let vertexCount = 0;
let triangleCount = 0;
for (const { primitive } of primitives) {
  const positionAccessor = primitive.attributes?.POSITION;
  vertexCount += accessorCount(accessors[positionAccessor]);
  if (primitive.mode === undefined || primitive.mode === 4) {
    const indexAccessor = primitive.indices === undefined ? null : accessors[primitive.indices];
    triangleCount += indexAccessor ? Math.floor(indexAccessor.count / 3) : Math.floor(accessorCount(accessors[positionAccessor]) / 3);
  }
}

const nodeRecords = nodes.map((node, nodeIndex) => ({
  node_index: nodeIndex,
  source_node_id: node.name ?? null,
  mesh_index: node.mesh ?? null,
  children: node.children ?? [],
  translation: node.translation ?? null,
  rotation: node.rotation ?? null,
  scale: node.scale ?? null,
  extras: node.extras ?? null,
}));

const sourceNodeIds = nodeRecords.map((node) => node.source_node_id).filter(Boolean);
const missingSourceNodeIds = nodeRecords.filter((node) => !node.source_node_id).map((node) => node.node_index);
const duplicateSourceNodeIds = [...new Set(sourceNodeIds.filter((id, index) => sourceNodeIds.indexOf(id) !== index))];
const sha256 = createHash('sha256').update(glb).digest('hex');

const manifest = {
  schema_version: 1,
  generated_by: 'scripts/inventory-hra-female.mjs',
  source: {
    filename: basename(glbPath),
    sha256,
    glb_version: version,
    bytes: glb.length,
    binary_chunk_bytes: binaryChunkBytes,
    metadata,
  },
  geometry: {
    scene_count: scenes.length,
    node_count: nodes.length,
    mesh_count: meshes.length,
    primitive_count: primitives.length,
    vertex_count: vertexCount,
    triangle_count: triangleCount,
    accessor_count: accessors.length,
    referenced_accessor_bytes: accessors.reduce((sum, accessor) => sum + accessorBytes(accessor), 0),
  },
  validation: {
    declared_length_matches: declaredLength === glb.length,
    json_chunk_present: true,
    missing_source_node_ids: missingSourceNodeIds,
    duplicate_source_node_ids: duplicateSourceNodeIds,
    source_node_ids_unique: missingSourceNodeIds.length === 0 && duplicateSourceNodeIds.length === 0,
    fma_mapping_complete: false,
    runtime_integrated: false,
  },
  nodes: nodeRecords,
};

await writeFile(resolve(outputPath), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Wrote ${outputPath}: ${nodes.length} nodes, ${meshes.length} meshes, ${primitives.length} primitives, ${vertexCount} vertices, ${triangleCount} triangles, sha256=${sha256}`);
