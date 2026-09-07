import demoScenarios from './demo-scenarios.json'

export interface ReportExample {
  id: string
  label: string
  title: string
  sourceText: string
  expectedConceptId: string
  expectedEvidence: string
}

export const REPORT_EXAMPLES =
  demoScenarios.scenarios as ReportExample[]
