import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'

const assetRoot = 'public/atlas-assets'
const atlas = JSON.parse(
  await readFile(path.join(assetRoot, 'atlas.json'), 'utf8'),
)
const demo = JSON.parse(
  await readFile('src/clinical/demo-scenarios.json', 'utf8'),
)

const failures = []

const focusedSceneSource = await readFile(
  'src/components/HumanAtlasScene.tsx',
  'utf8',
)
const explorerSource = await readFile(
  'src/components/ReferenceAtlasExplorer.tsx',
  'utf8',
)
const modelSource = await readFile(
  'src/atlas/model.ts',
  'utf8',
)
const anatomyFocusSource = await readFile(
  'src/components/AnatomyFocusPreview.tsx',
  'utf8',
)
const organDetailCatalogSource = await readFile(
  'src/anatomy-detail/catalog.ts',
  'utf8',
)
const organDetailSceneSource = await readFile(
  'src/components/OrganDetailScene.tsx',
  'utf8',
)
const patientReportSource = await readFile(
  'src/components/PatientReportPage.tsx',
  'utf8',
)
const staticRendererImport =
  /import\s*\{[^}]*HumanAtlasExplorerScene[^}]*\}\s*from\s*['"]\.\/HumanAtlasExplorerScene['"]/

if (
  modelSource.includes("from 'three'") ||
  modelSource.includes('from "three"')
) {
  failures.push(
    'atlas/model.ts must remain Three-free so focused slicing does not pull the renderer into the initial bundle',
  )
}

if (
  organDetailCatalogSource.includes("from 'three'") ||
  organDetailCatalogSource.includes('from "three"')
) {
  failures.push(
    'anatomy-detail/catalog.ts must remain Three-free so organ detail stays out of the initial bundle',
  )
}

if (
  !anatomyFocusSource.includes("import('./OrganDetailScene')") ||
  anatomyFocusSource.includes(
    "import { OrganDetailScene } from './OrganDetailScene'",
  )
) {
  failures.push(
    'contextual organ detail renderer must be lazy-loaded from AnatomyFocusPreview',
  )
}

if (
  !explorerSource.includes("import('./OrganDetailScene')") ||
  explorerSource.includes(
    "import { OrganDetailScene } from './OrganDetailScene'",
  )
) {
  failures.push(
    'full-atlas organ detail renderer must be lazy-loaded from ReferenceAtlasExplorer',
  )
}

if (
  !patientReportSource.includes("import('./OrganDetailScene')") ||
  patientReportSource.includes(
    "import { OrganDetailScene } from './OrganDetailScene'",
  )
) {
  failures.push(
    'patient organ detail renderer must be lazy-loaded from PatientReportPage',
  )
}

for (const fragment of [
  'GLTFLoader',
  'IntersectionObserver',
  "document.addEventListener('visibilitychange'",
  'if (!viewportVisible || !pageVisible) return',
  'renderer.dispose()',
]) {
  if (!organDetailSceneSource.includes(fragment)) {
    failures.push('organ detail renderer performance contract missing: ' + fragment)
  }
}

for (const [surface, source] of [
  ['focused', focusedSceneSource],
  ['explorer', explorerSource],
]) {
  if (staticRendererImport.test(source)) {
    failures.push(
      `${surface}: HumanAtlasExplorerScene must not be statically imported`,
    )
  }

  if (!source.includes("import('./HumanAtlasExplorerScene')")) {
    failures.push(
      `${surface}: canonical HumanAtlas renderer is not lazy-loaded`,
    )
  }

  if (!source.includes('Suspense')) {
    failures.push(
      `${surface}: deferred renderer is missing a Suspense boundary`,
    )
  }
}

const catalogBytes = (await stat(path.join(assetRoot, 'atlas.json'))).size
const assetEntries = await readdir(assetRoot)

const assetSizes = new Map()
let totalVendoredBytes = 0

for (const filename of assetEntries) {
  const info = await stat(path.join(assetRoot, filename))
  if (!info.isFile()) continue
  assetSizes.set(filename, info.size)
  totalVendoredBytes += info.size
}

const conceptById = new Map(
  atlas.concepts.map((concept) => [concept.id, concept]),
)
const partById = new Map(
  atlas.parts.map((part) => [part.id, part]),
)

const budgets = {
  catalogBytes: 1_500_000,
  scenarioGeometryBytes: 6_000_000,
  scenarioInitialBytes: 7_500_000,
  scenarioChunks: 3,
  totalVendoredBytes: 40_000_000,
}

if (catalogBytes > budgets.catalogBytes) {
  failures.push(
    `atlas.json is ${catalogBytes} bytes; budget is ${budgets.catalogBytes}`,
  )
}

if (totalVendoredBytes > budgets.totalVendoredBytes) {
  failures.push(
    `vendored anatomy closure is ${totalVendoredBytes} bytes; budget is ${budgets.totalVendoredBytes}`,
  )
}

const measurements = []

for (const scenario of demo.scenarios) {
  const concept = conceptById.get(scenario.expectedConceptId)

  if (!concept) {
    failures.push(
      `${scenario.id}: concept ${scenario.expectedConceptId} is missing`,
    )
    continue
  }

  const chunkIndexes = [
    ...new Set(
      concept.elements
        .map((elementId) => partById.get(elementId)?.chunk)
        .filter((chunkIndex) => chunkIndex !== undefined),
    ),
  ]

  const chunkFiles = chunkIndexes.map((chunkIndex) =>
    path.basename(atlas.chunks[chunkIndex].gzip ?? ''),
  )

  const geometryBytes = chunkFiles.reduce(
    (total, filename) => total + (assetSizes.get(filename) ?? 0),
    0,
  )
  const initialBytes = catalogBytes + geometryBytes

  measurements.push({
    scenario: scenario.id,
    concept: scenario.expectedConceptId,
    chunks: chunkIndexes.length,
    geometryBytes,
    initialBytes,
  })

  if (chunkIndexes.length > budgets.scenarioChunks) {
    failures.push(
      `${scenario.id}: requires ${chunkIndexes.length} chunks; budget is ${budgets.scenarioChunks}`,
    )
  }

  if (geometryBytes > budgets.scenarioGeometryBytes) {
    failures.push(
      `${scenario.id}: geometry payload is ${geometryBytes} bytes; budget is ${budgets.scenarioGeometryBytes}`,
    )
  }

  if (initialBytes > budgets.scenarioInitialBytes) {
    failures.push(
      `${scenario.id}: initial atlas payload is ${initialBytes} bytes; budget is ${budgets.scenarioInitialBytes}`,
    )
  }
}

if (failures.length > 0) {
  console.error('MedAtlas anatomy performance budget FAILED')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  console.error(JSON.stringify(measurements, null, 2))
  process.exit(1)
}

console.log('MedAtlas anatomy performance budget PASS')
for (const item of measurements) {
  console.log(
    `- ${item.scenario}: ${item.chunks} chunk(s), ${item.geometryBytes} geometry bytes, ${item.initialBytes} bytes incl. catalog`,
  )
}
