import { readFile } from 'node:fs/promises'

const scene = await readFile(
  'src/components/HumanAtlasExplorerScene.tsx',
  'utf8',
)
const explorer = await readFile(
  'src/components/ReferenceAtlasExplorer.tsx',
  'utf8',
)
const systems = await readFile('src/atlas/systems.ts', 'utf8')
const app = await readFile('src/App.tsx', 'utf8')
const focused = await readFile('src/components/HumanAtlasScene.tsx', 'utf8')
const focusedViewport = await readFile(
  'src/components/AtlasViewport.tsx',
  'utf8',
)
const patient = await readFile(
  'src/components/PatientReportPage.tsx',
  'utf8',
)
const reportComposer = await readFile(
  'src/components/ReportComposer.tsx',
  'utf8',
)
const anatomyFocus = await readFile(
  'src/components/AnatomyFocusPreview.tsx',
  'utf8',
)
const overview = await readFile('src/components/Overview.tsx', 'utf8')
const patients = await readFile('src/components/PatientsModule.tsx', 'utf8')
const consultations = await readFile(
  'src/components/ConsultationsModule.tsx',
  'utf8',
)
const documents = await readFile(
  'src/components/DocumentsModule.tsx',
  'utf8',
)
const atlasSource = await readFile('src/atlas/source.ts', 'utf8')
const styles = await readFile('src/styles.css', 'utf8')
const model = await readFile('src/atlas/model.ts', 'utf8')

const failures = []

if (!atlasSource.includes('import.meta.env.BASE_URL')) {
  failures.push(
    'atlas asset base must inherit the Vite BASE_URL for subpath deployments',
  )
}

if (!atlasSource.includes('${import.meta.env.BASE_URL}atlas-assets')) {
  failures.push(
    'atlas asset base must resolve atlas-assets relative to the deployed app base',
  )
}


const requiredEngineFragments = [
  'RoomEnvironment',
  'mergeGeometries',
  'new THREE.DataTexture',
  'partIndex',
  'selectionTexture',
  'PointerTap',
  'createExplosionLayout',
  'raycaster.intersectObject',
  'controls.autoRotate',
  'loadChunkBuffer',
  'Array.from({ length: 3 }',
  'AtlasSceneAppearance',
  "'clinical' | 'explorer' | 'patient'",
  'atlasBounds',
  'atlasCenter',
  "appearance !== 'explorer'",
  'surfacePadding',
  'cancelAnimationFrame(frame)',
  'controls.dispose()',
  'geometry.dispose()',
  'material.dispose()',
  'partStateTexture.dispose()',
  'selectionTexture.dispose()',
  'renderer.dispose()',
  'renderer.domElement.remove()',
]

for (const fragment of requiredEngineFragments) {
  if (!scene.includes(fragment)) {
    failures.push(
      'reference atlas engine missing upstream mechanism: ' + fragment,
    )
  }
}

const requiredExplorerFragments = [
  'DEFAULT_VISIBLE_SYSTEMS',
  'Sistemas anatômicos',
  'Separar anatomia',
  'Usar no relatório',
  'Isolar estrutura',
  'searchAtlasConcepts',
  'Atlas humano',
  'Camadas anatômicas',
  'INSPETOR ANATÔMICO',
  'Redefinir workspace',
  'appearance="explorer"',
]

for (const fragment of requiredExplorerFragments) {
  if (!explorer.includes(fragment)) {
    failures.push(
      'reference explorer missing interaction: ' + fragment,
    )
  }
}

const expectedSystems = [
  'skeletal',
  'muscular',
  'arterial',
  'venous',
  'nervous',
  'digestive',
  'respiratory',
  'urinary',
  'reproductive',
  'lymphatic',
  'endocrine',
  'integumentary',
  'connective',
  'sensory',
  'cardiac',
]

for (const system of expectedSystems) {
  if (!systems.includes("'" + system + "'")) {
    failures.push('missing Human Atlas system: ' + system)
  }
}

if (!app.includes('<ReferenceAtlasExplorer')) {
  failures.push('Atlas 3D module is not using ReferenceAtlasExplorer')
}

const requiredFocusedFragments = [
  'HumanAtlasExplorerScene',
  'createFocusedAtlas',
  'focusedAtlas',
  "contextMode === 'none'",
  'onSelect={inspectPart}',
  'focused-reference-inspector',
  'A anatomia confirmada do relatório não foi',
]

for (const fragment of requiredFocusedFragments) {
  if (!focused.includes(fragment)) {
    failures.push(
      'focused clinical atlas is not using the reference engine: ' + fragment,
    )
  }
}

const requiredClinicalWorkbenchFragments = [
  'Controles da visualização clínica 3D',
  'Abrir 3D em tela cheia',
  'Contexto anatômico',
  'HUMAN ATLAS · FOCO CLÍNICO',
  'appearance="clinical"',
]

for (const fragment of requiredClinicalWorkbenchFragments) {
  if (!focusedViewport.includes(fragment)) {
    failures.push(
      'clinical 3D workbench missing durable interaction: ' + fragment,
    )
  }
}

const requiredPatient3dFragments = [
  'Controles da anatomia 3D de referência',
  'Girar modelo 3D automaticamente',
  'appearance="patient"',
]

for (const fragment of requiredPatient3dFragments) {
  if (!patient.includes(fragment)) {
    failures.push(
      'patient 3D surface missing simplified interaction: ' + fragment,
    )
  }
}


const requiredFocusPreviewFragments = [
  'HumanAtlasScene',
  'contextMode={contextMode}',
  'appearance={appearance}',
  '3D carregado',
  'chunks necessários',
  'Reconfirmação anatômica necessária',
  'anatomy-focus-preview-review-banner',
]

for (const fragment of requiredFocusPreviewFragments) {
  if (!anatomyFocus.includes(fragment)) {
    failures.push(
      'canonical contextual 3D preview missing mechanism: ' + fragment,
    )
  }
}

const contextual3dSurfaces = [
  ['dashboard', overview, '3D DO ATENDIMENTO · HUMAN ATLAS'],
  ['patients', patients, 'PRÉVIA VISUAL DO PACIENTE · HUMAN ATLAS'],
  ['consultations', consultations, 'FOCO DA CONSULTA · HUMAN ATLAS'],
  ['documents', documents, 'REFERÊNCIA EXTRAÍDA · HUMAN ATLAS'],
  ['patient-preview', reportComposer, 'HUMAN ATLAS 3D · VISÃO DO PACIENTE'],
]

for (const [surface, source, marker] of contextual3dSurfaces) {
  if (!source.includes('<AnatomyFocusPreview')) {
    failures.push(surface + ' surface is not using canonical AnatomyFocusPreview')
  }
  if (!source.includes(marker)) {
    failures.push(surface + ' surface missing durable 3D-first marker: ' + marker)
  }
}

if (overview.includes('anatomy-preview-orbit')) {
  failures.push('dashboard still contains the legacy fake 3D orbit placeholder')
}

if (
  styles.includes('.anatomy-preview-orbit') ||
  styles.includes('.anatomy-preview-core') ||
  styles.includes('@keyframes medatlas-orbit')
) {
  failures.push('legacy fake 3D orbit CSS is still present')
}

if (reportComposer.includes('<span aria-hidden="true">3D</span>')) {
  failures.push('patient report preview still contains the legacy fake 3D badge')
}

if (!model.includes('export function createFocusedAtlas')) {
  failures.push('atlas model does not expose focused reference-atlas slicing')
}

if (
  app.includes(
    '<section className="standalone-atlas">' +
      '\n            <div className="module-intro-card">',
  )
) {
  failures.push('legacy standalone AtlasViewport shell is still active')
}

if (failures.length > 0) {
  console.error('MedAtlas Human Atlas reference-engine contract FAILED')
  for (const failure of failures) console.error('- ' + failure)
  process.exit(1)
}

console.log(
  'MedAtlas Human Atlas reference-engine contract PASS: full-system, clinical and patient surfaces share one engine while preserving MedAtlas-specific presentation modes, picking, explode layout, camera controls and chunk-bounded focused slicing.',
)
