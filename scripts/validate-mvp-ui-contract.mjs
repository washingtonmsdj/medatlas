import { readFile } from 'node:fs/promises'

const productSurfaces = [
  'src/App.tsx',
  'src/components/Overview.tsx',
  'src/components/ReportIntake.tsx',
  'src/components/ReportComposer.tsx',
  'src/components/PatientReportPage.tsx',
  'src/components/ReferenceAtlasExplorer.tsx',
  'src/components/PatientsModule.tsx',
  'src/components/TeamModule.tsx',
  'src/components/AnalyticsModule.tsx',
  'src/components/DemoSettings.tsx',
  'src/components/TopbarUtilityActions.tsx',
  'src/components/ViewModeSwitcher.tsx',
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
]

for (const [file, source] of sources) {
  for (const fragment of forbiddenProductCopy) {
    if (source.toLocaleLowerCase('pt-BR').includes(fragment.toLocaleLowerCase('pt-BR'))) {
      failures.push(`${file} exposes engineering/product-documentation copy: ${fragment}`)
    }
  }
}

const app = sources.get('src/App.tsx')
const switcher = sources.get('src/components/ViewModeSwitcher.tsx')
const patient = sources.get('src/components/PatientReportPage.tsx')
const explorer = sources.get('src/components/ReferenceAtlasExplorer.tsx')

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

if (failures.length > 0) {
  console.error('MedAtlas MVP UI contract FAILED')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  'MedAtlas MVP UI contract PASS: professional/patient views stay separated, primary UI stays task-first, and engineering copy remains outside product surfaces.',
)
