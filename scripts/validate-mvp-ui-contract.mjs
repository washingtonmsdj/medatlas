import { readFile } from 'node:fs/promises'

const productSurfaces = [
  'src/App.tsx',
  'src/main.tsx',
  'src/components/Overview.tsx',
  'src/components/ReportIntake.tsx',
  'src/components/ReportComposer.tsx',
  'src/components/PatientReportPage.tsx',
  'src/components/ReferenceAtlasExplorer.tsx',
  'src/components/AnatomyFocusPreview.tsx',
  'src/components/HumanAtlasScene.tsx',
  'src/components/PatientsModule.tsx',
  'src/components/TeamModule.tsx',
  'src/components/AnalyticsModule.tsx',
  'src/components/DemoSettings.tsx',
  'src/components/TopbarUtilityActions.tsx',
  'src/components/ClinicalSidebar.tsx',
  'src/components/GlobalCommandSearch.tsx',
  'src/components/WorkspacePageHeader.tsx',
]

const sources = new Map(
  await Promise.all(
    productSurfaces.map(async (file) => [file, await readFile(file, 'utf8')]),
  ),
)
const readme = await readFile('README.md', 'utf8')
const designTokens = await readFile('src/styles/design-tokens.css', 'utf8')
const conceptShellStyles = await readFile('src/styles/concept-shell.css', 'utf8')
const sidebarStyles = await readFile('src/styles/clinical-sidebar.css', 'utf8')
const pageHeaderStyles = await readFile('src/styles/workspace-page-header.css', 'utf8')

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
  'peças necessárias',
  'Carregando motor 3D',
  'Referência técnica:',
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
const main = sources.get('src/main.tsx')
const patient = sources.get('src/components/PatientReportPage.tsx')
const explorer = sources.get('src/components/ReferenceAtlasExplorer.tsx')
const sidebar = sources.get('src/components/ClinicalSidebar.tsx')
const focusPreview = sources.get('src/components/AnatomyFocusPreview.tsx')
const globalSearch = sources.get('src/components/GlobalCommandSearch.tsx')
const topbar = sources.get('src/components/TopbarUtilityActions.tsx')
const team = sources.get('src/components/TeamModule.tsx')
const workspaceHeader = sources.get('src/components/WorkspacePageHeader.tsx')

const requiredAppFragments = [
  "useState<'professional' | 'patient'>('professional')",
  "if (viewMode === 'patient')",
  '<PatientReportPage',
  'previewMode',
  'onOpenPatientPreview',
  'medatlas-v2-topbar',
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

for (const legacyShell of [
  '<OrganizationSwitcher',
  '<ViewModeSwitcher',
  'topbar topbar-saas',
  'doctor-chip-button',
]) {
  if (app.includes(legacyShell)) {
    failures.push(`App reintroduced legacy shell UI: ${legacyShell}`)
  }
}

if (main.includes('team-invitations.css')) {
  failures.push(
    'App entrypoint must not load invitation UI styles while invitations are out of MVP scope',
  )
}

if (!main.includes("import './styles/workspace-page-header.css'")) {
  failures.push(
    'App entrypoint must load the canonical WorkspacePageHeader stylesheet',
  )
}


if (!main.includes("import './styles/design-tokens.css'")) {
  failures.push('App entrypoint must load the canonical MVP design tokens')
}

if (
  main.indexOf("import './styles/design-tokens.css'") >
  main.indexOf("import './styles.css'")
) {
  failures.push('Canonical design tokens must load before legacy/base styles')
}

for (const token of [
  '--font-sans',
  '--surface-app',
  '--surface-workspace',
  '--text-primary',
  '--text-secondary',
  '--line-subtle',
  '--accent-primary',
]) {
  if (!designTokens.includes(token)) {
    failures.push(`Design foundation is missing semantic token: ${token}`)
  }
}

if (conceptShellStyles.includes('font-family:')) {
  failures.push(
    'Concept shell must inherit the canonical font token instead of redefining a font stack',
  )
}

if (/#[0-9a-f]{3,8}/i.test(sidebar)) {
  failures.push(
    'ClinicalSidebar JSX must not contain hardcoded visual hex colors',
  )
}

for (const [name, stylesheet] of [
  ['concept-shell.css', conceptShellStyles],
  ['clinical-sidebar.css', sidebarStyles],
  ['workspace-page-header.css', pageHeaderStyles],
]) {
  if (!stylesheet.includes('var(--')) {
    failures.push(`${name} must consume semantic design tokens`)
  }

  if (/#[0-9a-f]{3,8}\b|rgba?\(/i.test(stylesheet)) {
    failures.push(
      `${name} must not define visual color literals outside design-tokens.css`,
    )
  }
}

for (const fragment of [
  'workspace-page-header',
  'workspace-page-header-copy',
  'workspace-page-header-tools',
  'workspace-page-header-actions',
]) {
  if (!workspaceHeader.includes(fragment)) {
    failures.push(`WorkspacePageHeader is missing canonical structure: ${fragment}`)
  }
}

for (const file of [
  'src/components/Overview.tsx',
  'src/components/PatientsModule.tsx',
  'src/components/TeamModule.tsx',
  'src/components/AnalyticsModule.tsx',
  'src/components/DemoSettings.tsx',
]) {
  if (!sources.get(file).includes('<WorkspacePageHeader')) {
    failures.push(`${file} must use the canonical WorkspacePageHeader`)
  }
}

for (const fragment of [
  'data-surface-priority="mobile-first"',
  'HUMAN ATLAS 3D',
  'Explicação',
  'Perguntas',
  'patient-return-professional',
  'Voltar ao profissional',
]) {
  if (!patient.includes(fragment)) {
    failures.push(`Patient view is missing task-first content: ${fragment}`)
  }
}

for (const fragment of [
  'Buscar no corpo',
  'Sistemas anatômicos',
  'Usar estrutura no relatório',
  'atlas-v3-workspace',
  'atlas-v3-case-panel',
  'atlas-v3-body-panel',
  'atlas-v3-detail-panel',
  'Explicação para o paciente',
  'confirmedLabel',
  'selectionState',
  'Estrutura já confirmada',
  'Explorando ·',
  'Identificador anatômico ·',
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
  'Navegação principal',
  'Clinical 3D Workbench',
  'clinical-sidebar-nav-icon',
  'clinical-sidebar-nav-text',
  'Conhecimento',
  'vidas mais longas.',
]) {
  if (!sidebar.includes(fragment)) {
    failures.push(`ClinicalSidebar is missing concept navigation: ${fragment}`)
  }
}

for (const removedLabel of ["'Consultas'", "'Exames'"]) {
  if (sidebar.includes(removedLabel)) {
    failures.push(
      `ClinicalSidebar reintroduced out-of-scope standalone MVP module: ${removedLabel}`,
    )
  }
}

if (sidebar.includes('clinic-card-chevron')) {
  failures.push('ClinicalSidebar must not imply a clickable workspace card without an action')
}

for (const fragment of [
  "aria-controls=\"medatlas-tasks-panel\"",
  "? `${pendingSteps.length} ações pendentes`",
  ": 'Nenhuma ação pendente'",
  'notification-count-badge',
  "pendingSteps.length > 9 ? '9+' : pendingSteps.length",
  'Ações pendentes',
  'Perfil do profissional',
]) {
  if (!topbar.includes(fragment)) {
    failures.push(`Topbar must stay task-first: ${fragment}`)
  }
}

for (const forbidden of ['Ajuda rápida do MedAtlas', 'Como funciona']) {
  if (topbar.includes(forbidden)) {
    failures.push(`Topbar reintroduced explanatory tutorial UI: ${forbidden}`)
  }
}

if (
  !globalSearch.includes(
    'Buscar paciente, relatório, anatomia ou módulo',
  )
) {
  failures.push(
    'Global search copy must match the current MVP scope',
  )
}

for (const forbidden of [
  'Adicionar membro',
  'Convites em breve',
  'próxima versão',
]) {
  if (team.includes(forbidden)) {
    failures.push(
      `Team MVP must not expose unavailable future invitation UI: ${forbidden}`,
    )
  }
}

for (const required of [
  'Membros da organização',
  'Permissões por papel',
]) {
  if (!team.includes(required)) {
    failures.push(`Team MVP is missing active functionality: ${required}`)
  }
}

for (const forbiddenDocFragment of [
  '- **Consultas**',
  '- **Exames**',
  'módulo Exames funcional',
  'módulos Pacientes e Consultas funcionais',
]) {
  if (readme.includes(forbiddenDocFragment)) {
    failures.push(
      `README reintroduced out-of-scope standalone MVP module: ${forbiddenDocFragment}`,
    )
  }
}

if (
  !readme.includes(
    'Consultas e exames não são módulos independentes no MVP; esse contexto pertence ao fluxo de **Relatórios visuais**.',
  )
) {
  failures.push(
    'README must keep consultations/exams inside the Relatórios visuais MVP flow',
  )
}

if (focusPreview.includes('atlasRef')) {
  failures.push(
    'Shared contextual 3D preview must not expose atlasRef/provenance copy in the primary MVP surface',
  )
}

if (patient.includes('ViewModeSwitcher')) {
  failures.push(
    'Patient preview must use the canonical single return action, not the removed view switcher',
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
  'MedAtlas MVP UI contract PASS: professional/patient views stay separated, core modules share one canonical page-header system, primary UI stays task-first, standalone consultations/exams stay out of scope, and engineering copy remains outside product surfaces.',
)
