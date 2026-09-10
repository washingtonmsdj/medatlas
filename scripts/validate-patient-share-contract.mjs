import { readFile } from 'node:fs/promises'

const [patientView, repositoryContract, repositoryBoundary, patientPage, app] =
  await Promise.all([
    readFile('src/domain/patient-report.ts', 'utf8'),
    readFile('src/data/clinical-repository.ts', 'utf8'),
    readFile('src/data/repository.ts', 'utf8'),
    readFile('src/components/PatientReportPage.tsx', 'utf8'),
    readFile('src/App.tsx', 'utf8'),
  ])

const failures = []

for (const forbidden of [
  'patient:',
  'atlasRef:',
  'explanationProvenance:',
  'organizationId:',
  'workspaceId:',
  'shareSlug:',
]) {
  if (patientView.includes(forbidden)) {
    failures.push(`patient-safe projection exposes forbidden field: ${forbidden}`)
  }
}

if (/approvedBy\s*:\s*\{[\s\S]*?\bid\s*:/m.test(patientView)) {
  failures.push('patient-safe review snapshot exposes an internal reviewer id')
}

if (/professional\s*:\s*\{[\s\S]*?\bid\s*:/m.test(patientView)) {
  failures.push('patient-safe publication snapshot exposes an internal professional id')
}

for (const fragment of [
  'sourceText: string',
  'anatomicalStructure: string',
  'atlasConceptId: string',
  'patientExplanation: string',
  'clinicianNote: string',
  'approvedAt: string',
  'workspaceName: string',
  'brandName: string',
  'patientFooterText: string',
  'publishedAt: string',
  'export function toPatientReportView',
]) {
  if (!patientView.includes(fragment)) {
    failures.push(`patient-safe projection missing required field/mapper: ${fragment}`)
  }
}

if (
  !repositoryContract.includes(
    'resolvePatientShare(token: string): Promise<PatientReportView | null>',
  )
) {
  failures.push('ClinicalRepository does not expose the patient-safe resolver type')
}

for (const fragment of [
  'toPatientReportView',
  'const report = await demoClinicalRepository.resolvePatientShare(token)',
  'return report ? toPatientReportView(report) : null',
]) {
  if (!repositoryBoundary.includes(fragment)) {
    failures.push(`repository boundary missing patient sanitization: ${fragment}`)
  }
}

if (patientPage.includes("import type { VisualReport } from '../domain/types'")) {
  failures.push('PatientReportPage is coupled to the full clinical VisualReport type')
}

if (!patientPage.includes("import type { PatientReportView } from '../domain/patient-report'")) {
  failures.push('PatientReportPage does not consume PatientReportView')
}

if (!app.includes("report: PatientReportView")) {
  failures.push('patient route state is not constrained to PatientReportView')
}

if (failures.length > 0) {
  console.error('MedAtlas patient-share contract FAILED')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  'MedAtlas patient-share contract PASS: the anonymous route consumes a dedicated patient-safe projection and the repository boundary strips internal clinical/tenant identifiers.',
)
