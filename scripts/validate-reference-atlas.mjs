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
const organDetailCatalog = await readFile(
  'src/anatomy-detail/catalog.ts',
  'utf8',
)
const organDetailScene = await readFile(
  'src/components/OrganDetailScene.tsx',
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
      'src/module-workspaces.css',
      'src/styles/concept-modules.css',
      'src/reference-atlas.css',
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

if (!atlasSource.includes('atlasPromise = undefined')) {
  failures.push(
    'rejected atlas loads must clear the cached Promise so retry can perform a real reload',
  )
}

for (const fragment of [
  'isolatedHorizontalFov',
  'isolatedFitHeight',
  'isolatedFitWidth',
  'isolatedPadding',
  "current.view === 'front'",
  '.addScaledVector(isolatedDirection, distance)',
]) {
  if (!scene.includes(fragment)) {
    failures.push(
      'isolated clinical camera fit contract missing: ' + fragment,
    )
  }
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
  'renderer.localClippingEnabled = true',
  'sectionPlane',
  'setFromNormalAndCoplanarPoint',
  'material.clippingPlanes',
  'sectionPlane.distanceToPoint(hit.point)',
  'interactionUntil',
  "addEventListener('start', pauseAutoRotate)",
  'IntersectionObserver',
  'viewportVisible',
  'pageVisible',
  "document.addEventListener('visibilitychange'",
  'if (!viewportVisible || !pageVisible) return',
  'visibilityObserver.disconnect()',
  '!currentInspectedPartId',
  '!current.section',
  'renderer.domElement.tabIndex = 0',
  "'aria-keyshortcuts'",
  "addEventListener('keydown', keyDown)",
  'new THREE.Spherical()',
  "event.key === 'Home'",
  'keyboardSpherical.radius',
  'loadChunkBuffer',
  'Array.from({ length: 3 }',
  'RingGeometry',
  'markerPositions',
  'reference-part-hover',
  'reference-inspection-callout',
  'positionInspectionCallout',
  'inspectionCallout.style.transform',
  'partIndexById',
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
  'searchAtlasConcepts',
  'resolveOrganDetail',
  "import('./OrganDetailScene')",
  'appearance="explorer"',
  'data-concept-layout="reference-atlas-workbench"',
  'reference-atlas-workspace',
  'reference-atlas-case-panel',
  'reference-atlas-body-panel',
  'reference-atlas-detail-panel',
  'reference-atlas-depth-switch',
  'reference-atlas-systems',
  'reference-atlas-presets',
  'reference-atlas-organ-stage',
  'reference-atlas-search',
  'Usar estrutura no relatório',
  'Explicação para o paciente',
  'Qualidade do modelo',
  'onOpenPatientPreview',
]

for (const obsoleteReferenceAtlasMarker of ['atlas-v3-', 'clinical-atlas-v3']) {
  if (
    explorer.includes(obsoleteReferenceAtlasMarker) ||
    referenceStyles.includes(obsoleteReferenceAtlasMarker)
  ) {
    failures.push(
      'reference atlas must use semantic class ownership: ' +
        obsoleteReferenceAtlasMarker,
    )
  }
}

for (const fragment of requiredExplorerFragments) {
  if (!explorer.includes(fragment)) {
    failures.push(
      'reference explorer missing interaction: ' + fragment,
    )
  }
}

const requiredMobileExplorerCss = [
  '.reference-atlas-workspace',
  'grid-template-columns: minmax(282px, 22%) minmax(500px, 1fr) minmax(360px, 30%)',
  '.reference-atlas-body-stage > .reference-atlas-scene',
  '.reference-atlas-detail-panel',
  '.reference-atlas-organ-stage > .organ-detail-scene',
  '.reference-atlas-presets',
  'min-height: 610px',
  '@media (max-width: 560px)',
]

for (const fragment of requiredMobileExplorerCss) {
  if (!referenceStyles.includes(fragment)) {
    failures.push(
      'mobile 3D-first explorer CSS missing: ' + fragment,
    )
  }
}

if (
  referenceStyles.includes('.reference-atlas-stage.detail-active > .reference-atlas-scene')
) {
  failures.push(
    'concept layout must keep the full body visible instead of hiding it behind organ detail',
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
  'inspectedPartLabel={inspectedPart?.label}',
  'A anatomia confirmada do relatório não foi',
  'Referência visual. Não representa o corpo individual do paciente.',
]

for (const fragment of requiredFocusedFragments) {
  if (!focused.includes(fragment)) {
    failures.push(
      'focused clinical atlas is not using the reference engine: ' + fragment,
    )
  }
}

for (const fragment of [
  'inspectedPartLabel',
  'inspectedPartMeta',
  'inspectedPartNote',
  'onClearInspection',
]) {
  if (!focused.includes(fragment)) {
    failures.push(
      'focused Human Atlas anchored-inspection contract missing: ' +
        fragment,
    )
  }
}

const requiredPatientInspectionLanguage = [
  'PORTUGUESE_LABELS',
  "PATIENT_INSPECTION_FALLBACK = 'Estrutura anatômica selecionada'",
  'patientPartLabels',
  "appearance === 'patient'",
  'Anatomia humana de referência',
  'Referência visual. Não representa o corpo individual do paciente.',
]

for (const fragment of requiredPatientInspectionLanguage) {
  if (!focused.includes(fragment)) {
    failures.push(
      'patient anatomy inspection language contract missing: ' + fragment,
    )
  }
}

for (const forbidden of [
  'Referência técnica:',
  'technicalLabel',
  'peças necessárias',
  'Carregando motor 3D',
]) {
  if (focused.includes(forbidden)) {
    failures.push(
      'patient/shared focused 3D reintroduced technical product copy: ' +
        forbidden,
    )
  }
}

const requiredClinicalWorkbenchFragments = [
  'Controles da visualização clínica 3D',
  'Abrir 3D em tela cheia',
  'Contexto anatômico',
  'HUMAN ATLAS · FOCO CLÍNICO',
  'appearance="clinical"',
  'section={detailActive ? false : section}',
  'Corte visual 3D',
  'resolveOrganDetail',
  "import('./OrganDetailScene')",
  'Nível anatômico do relatório',
  'clinical-anatomy-depth-switch',
  'Órgão em detalhe',
  'Ativar corte do órgão',
  'clinical-organ-renderer-loading',
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
  'contextMode="region"',
  'resolveOrganDetail',
  "import('./OrganDetailScene')",
  'patient-anatomy-depth-switch',
  'Nível da anatomia 3D',
  'Corpo completo',
  'Ver ',
  ' em detalhe',
  'Ativar corte do órgão',
  'patient-organ-detail-safety',
  'não representa o corpo individual do paciente',
]

for (const fragment of requiredPatient3dFragments) {
  if (!patient.includes(fragment)) {
    failures.push(
      'patient 3D surface missing simplified interaction: ' + fragment,
    )
  }
}

for (const [surface, source] of [
  ['contextual-preview', anatomyFocus],
  ['patient-view', patient],
  ['clinical-workbench', focusedViewport],
  ['full-atlas', explorer],
]) {
  for (const fragment of ['Tentar novamente', 'atlas-retry-button']) {
    if (!source.includes(fragment)) {
      failures.push(
        `3D retry contract missing on ${surface}: ${fragment}`,
      )
    }
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
  'resolveOrganDetail',
  "import('./OrganDetailScene')",
  'anatomy-focus-level-switch',
  'Corpo',
  'Órgão em detalhe',
  'anatomy-detail-breadcrumb',
  'anatomy-detail-safety-note',
  'não representa o corpo individual do paciente',
]

for (const fragment of requiredFocusPreviewFragments) {
  if (!anatomyFocus.includes(fragment)) {
    failures.push(
      'canonical contextual 3D preview missing mechanism: ' + fragment,
    )
  }
}

const requiredOrganDetailCatalogFragments = [
  "ORGAN_DETAIL_UPSTREAM_SHA",
  "8c0e6f321a47f895ae58ce098028b92774733ee9",
  "VITE_ORGAN_DETAIL_ASSET_BASE",
  "FMA7088",
  "FMA50801",
  "FMA7197",
  "FMA7203",
  "FMA7198",
  "resolveOrganDetail",
  "organDetailModelUrl",
  "` ${normalized} `.includes(` ${candidate} `)",
]

for (const fragment of requiredOrganDetailCatalogFragments) {
  if (!organDetailCatalog.includes(fragment)) {
    failures.push('organ detail catalog missing contract: ' + fragment)
  }
}

if (organDetailCatalog.includes('normalized.includes(candidate)')) {
  failures.push(
    'organ detail label matching must remain word/phrase-bounded to avoid false positives such as cor → corpo',
  )
}

const requiredOrganDetailSceneFragments = [
  'GLTFLoader',
  'OrbitControls',
  'RoomEnvironment',
  'renderer.localClippingEnabled = true',
  'sectionPlane',
  'IntersectionObserver',
  'visibilitychange',
  'if (!viewportVisible || !pageVisible) return',
  'renderer.dispose()',
  'organ-detail-scene',
]

for (const fragment of requiredOrganDetailSceneFragments) {
  if (!organDetailScene.includes(fragment)) {
    failures.push('organ detail renderer missing contract: ' + fragment)
  }
}

for (const forbidden of [
  'patient diagnosis',
  'patient-specific reconstruction',
]) {
  if (organDetailScene.includes(forbidden)) {
    failures.push('organ detail renderer contains unsafe patient claim: ' + forbidden)
  }
}

const contextual3dSurfaces = [
  {
    surface: 'dashboard',
    source: overview,
    required: [
      '<AnatomyFocusPreview',
      'contextMode="region"',
      'data-clinical-focus=',
      'FOCO CLÍNICO · HUMAN ATLAS 3D',
    ],
  },
  {
    surface: 'patients',
    source: patients,
    required: [
      '<AnatomyFocusPreview',
      'appearance="patient"',
      'contextMode="region"',
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
  'MedAtlas anatomy contract PASS: Human Atlas remains the canonical BodyParts3D/FMA authority; Atlas 3D uses the canonical three-column body + organ-detail concept layout with patient-safe supplementary depth.',
)