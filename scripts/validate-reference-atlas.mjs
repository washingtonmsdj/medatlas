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
const anatomyFocus = await readFile(
  'src/components/AnatomyFocusPreview.tsx',
  'utf8',
)
const overview = await readFile('src/components/Overview.tsx', 'utf8')
const patients = await readFile('src/components/PatientsModule.tsx', 'utf8')
const atlasSource = await readFile('src/atlas/source.ts', 'utf8')
const styles = (
  await Promise.all(
    [
      'src/styles.css',
      'src/styles/clinical-shell.css',
      'src/styles/supporting-modules.css',
      'src/styles/organization-analytics.css',
      'src/styles/anatomy-responsive.css',
      'src/styles/interaction-polish.css',
      'src/styles/mvp-mode.css',
      'src/module-workspaces.css',
      'src/experience-surfaces.css',
      'src/reference-atlas.css',
      'src/team-invitations.css',
    ].map((file) => readFile(file, 'utf8')),
  )
).join('\n')
const referenceStyles = await readFile('src/reference-atlas.css', 'utf8')
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
  'inspectionTexture',
  'hoverTexture',
  'partInspected',
  'partHovered',
  'outgoingLight = mix(outgoingLight',
  'PointerTap',
  'createExplosionLayout',
  'raycaster.intersectObject',
  "'pointerleave'",
  "style.cursor =",
  'controls.autoRotate',
  'loadChunkBuffer',
  'Array.from({ length: 3 }',
  'RingGeometry',
  'markerPositions',
  'reference-part-hover',
  'findProjectedTarget',
  'setViewOffset',
  'markers.visible',
  'AtlasSceneAppearance',
  "'clinical' | 'explorer' | 'patient'",
  'atlasBounds',
  'atlasCenter',
  'assembledDistance',
  'usableWidth',
  'usableHeight',
  'topReserved',
  'bottomReserved',
  "appearance !== 'explorer'",
  'surfacePadding',
  'cancelAnimationFrame(frame)',
  'controls.dispose()',
  'geometry.dispose()',
  'material.dispose()',
  'partStateTexture.dispose()',
  'selectionTexture.dispose()',
  'inspectionTexture.dispose()',
  'hoverTexture.dispose()',
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
  'Camadas anatômicas',
  'INSPETOR ANATÔMICO',
  'appearance="explorer"',
  'Fontes do Atlas 3D',
  'https://github.com/ashemag/human-atlas',
  'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
  'Ferramentas do Atlas no celular',
  'reference-mobile-tools',
  'mobilePanel',
  'reference-mobile-panel-close',
]

for (const fragment of requiredExplorerFragments) {
  if (!explorer.includes(fragment)) {
    failures.push(
      'reference explorer missing interaction: ' + fragment,
    )
  }
}

const requiredMobileExplorerCss = [
  '.reference-mobile-tools',
  '.reference-atlas-systems.mobile-open',
  '.reference-inspector-card.mobile-open',
  '.reference-atlas-stage > .reference-atlas-scene',
  'min-height: 790px',
]

for (const fragment of requiredMobileExplorerCss) {
  if (!referenceStyles.includes(fragment)) {
    failures.push(
      'mobile 3D-first explorer CSS missing: ' + fragment,
    )
  }
}

if (referenceStyles.includes('top: 646px')) {
  failures.push(
    'mobile explorer must not push the canonical 3D scene below stacked panels',
  )
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
  'inspectedPartId={inspectedPart?.partId}',
  'focused-reference-inspector',
  'A anatomia confirmada do relatório não foi',
  'Identificação visual de anatomia humana de referência',
]

for (const fragment of requiredFocusedFragments) {
  if (!focused.includes(fragment)) {
    failures.push(
      'focused clinical atlas is not using the reference engine: ' + fragment,
    )
  }
}

const requiredPatientInspectionLanguage = [
  'PORTUGUESE_LABELS',
  "PATIENT_INSPECTION_FALLBACK = 'Estrutura anatômica selecionada'",
  'patientPartLabels',
  "appearance === 'patient'",
  'Referência técnica:',
  'technicalLabel',
]

for (const fragment of requiredPatientInspectionLanguage) {
  if (!focused.includes(fragment)) {
    failures.push(
      'patient anatomy inspection language contract missing: ' + fragment,
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
  'onReady={ready}',
  'onError={failed}',
  'chooseView',
  '3D carregado',
  'anatomy-focus-preview-review-banner',
  'anatomy-focus-preview-interaction-hint',
  'INTERATIVO',
  'onOpenAtlas',
]

for (const fragment of requiredFocusPreviewFragments) {
  if (!anatomyFocus.includes(fragment)) {
    failures.push(
      'canonical contextual 3D preview missing mechanism: ' + fragment,
    )
  }
}

const contextual3dSurfaces = [
  {
    surface: 'dashboard',
    source: overview,
    required: ['<AnatomyFocusPreview', 'contextMode="none"'],
  },
  {
    surface: 'patients',
    source: patients,
    required: [
      '<AnatomyFocusPreview',
      'appearance="patient"',
      'contextMode="system"',
    ],
  },
]

for (const { surface, source, required } of contextual3dSurfaces) {
  for (const fragment of required) {
    if (!source.includes(fragment)) {
      failures.push(
        surface +
          ' surface missing canonical contextual 3D mechanism: ' +
          fragment,
      )
    }
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
  'MedAtlas Human Atlas reference-engine contract PASS: full-system, clinical and patient surfaces share one engine while preserving MedAtlas-specific presentation modes, picking, patient-safe inspection language, explode layout, camera controls and chunk-bounded focused slicing.',
)
