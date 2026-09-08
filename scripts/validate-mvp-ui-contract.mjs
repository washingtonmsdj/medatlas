import { readFile } from 'node:fs/promises'

const productSurfaces = [
  'src/App.tsx',
  'src/components/Overview.tsx',
  'src/components/ReportIntake.tsx',
  'src/components/ReportComposer.tsx',
  'src/components/PatientReportPage.tsx',
  'src/components/ReferenceAtlasExplorer.tsx',
  'src/components/AnatomyFocusPreview.tsx',
  'src/components/PatientsModule.tsx',
  'src/components/TeamModule.tsx',
  'src/components/AnalyticsModule.tsx',
  'src/components/DemoSettings.tsx',
  'src/components/TopbarUtilityActions.tsx',
  'src/components/ViewModeSwitcher.tsx',
  'src/components/ClinicalSidebar.tsx',
]

const sources = new Map(
  await Promise.all(
    productSurfaces.map(async (file) => [file, await readFile(file, 'utf8')]),
  ),
)

const failures = []

const forbiddenProductCopy = [
  'MVP sem backend',
  'neste MVP',
  'source-first',
  'SOURCE READY',
  'migration 005',
  'fronteira de produção',
  'contrato de produção',
  'renderer 3D sob demanda',
  'preparando renderer',
  'Engine canônico do MedAtlas',
  'verificada por SHA-256',
  'gate humano',
  'gate clínico',
  'chunks necessários',
  'Preparando geometria real',
  'O MedAtlas não inventa um modelo',
]

for (const [file, source] of sources) {
  for (const fragment of forbiddenProductCopy) {
    if (
      source
        .toLocaleLowerCase('pt-BR')
        .includes(fragment.toLocaleLowerCase('pt-BR'))
    ) {
      failures.push(
        `${file} exposes engineering/product-documentation copy: ${fragment}`,
      )
    }
  }
}

const app = sources.get('src/App.tsx')
const switcher = sources.get('src/components/ViewModeSwitcher.tsx')
const patient = sources.get('src/components/PatientReportPage.tsx')
const explorer = sources.get('src/components/ReferenceAtlasExplorer.tsx')
const sidebar = sources.get('src/components/ClinicalSidebar.tsx')
const focusPreview = sources.get('src/components/AnatomyFocusPreview.tsx')

const requiredAppFragments = [
  "useState<MedAtlasViewMode>('professional')",
  "if (viewMode === 'patient')",
  '<PatientReportPage',
  'previewMode',
  '<ViewModeSwitcher',
]

for (const fragment of requiredAppFragments) {
  if (!app.includes(fragment)) {
    failures.push(`App is missing the professional/patient MVP split: ${fragment}`)
  }
}

for (const removedModule of ['ConsultationsModule', 'DocumentsModule']) {
  if (app.includes(removedModule)) {
    failures.push(`App reintroduced out-of-scope standalone MVP module: ${removedModule}`)
  }
}

for (const fragment of [
  "'professional' | 'patient'",
  'Profissional',
  'Paciente',
  'aria-label="Alternar visão do MedAtlas"',
]) {
  if (!switcher.includes(fragment)) {
    failures.push(`ViewModeSwitcher is missing MVP view contract: ${fragment}`)
  }
}

for (const fragment of [
  'data-surface-priority="mobile-first"',
  'HUMAN ATLAS 3D',
  'Explicação',
  'Perguntas',
]) {
  if (!patient.includes(fragment)) {
    failures.push(`Patient view is missing task-first content: ${fragment}`)
  }
}

for (const fragment of [
  'Buscar no corpo',
  'Camadas anatômicas',
  'Usar no relatório',
  '<details className="reference-atlas-source">',
]) {
  if (!explorer.includes(fragment)) {
    failures.push(`Atlas MVP surface is missing task-first interaction: ${fragment}`)
  }
}

for (const fragment of [
  '<HumanAtlasScene',
  '3D carregado',
  'Anatomia humana de referência.',
  'Arraste para girar · clique para identificar',
]) {
  if (!focusPreview.includes(fragment)) {
    failures.push(`Shared 3D preview is missing task-first behavior: ${fragment}`)
  }
}

for (const fragment of [
  'Novo relatório',
  'Navegação principal',
  'clinical-sidebar-nav-icon',
  'clinical-sidebar-nav-text',
  'clinical-sidebar-nav-badge',
  'WORKSPACE ATIVO',
]) {
  if (!sidebar.includes(fragment)) {
    failures.push(`ClinicalSidebar is missing task-first navigation: ${fragment}`)
  }
}

if (sidebar.includes('clinic-card-chevron')) {
  failures.push('ClinicalSidebar must not imply a clickable workspace card without an action')
}

if (focusPreview.includes('atlasRef')) {
  failures.push(
    'Shared contextual 3D preview must not expose atlasRef/provenance copy in the primary MVP surface',
  )
}

if (
  patient.includes("atlasConceptId || '—'") ||
  patient.includes("atlasConceptId || 'Aguardando'")
) {
  failures.push(
    'Patient view must not expose internal anatomy concept identifiers as product copy',
  )
}

if (failures.length > 0) {
  console.error('MedAtlas MVP UI contract FAILED')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  'MedAtlas MVP UI contract PASS: professional/patient views stay separated, primary UI stays task-first, and engineering copy remains outside product surfaces.',
)
