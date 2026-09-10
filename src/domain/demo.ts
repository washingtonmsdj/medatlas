import type { VisualReport } from './types'

const clinicianNote =
  'Explicação educacional. A interpretação final do exame e a decisão de tratamento pertencem ao profissional responsável.'

export const demoReport: VisualReport = {
  id: 'rep_demo_l4l5',
  version: 1,
  patient: {
    id: 'pat_demo_001',
    displayName: 'Paciente demonstração',
    age: 52,
  },
  title: 'Entenda seu exame — coluna lombar',
  status: 'clinician_review',
  reviewApproval: {
    organizationId: 'demo-org-clinica-horizonte',
    workspaceId: 'demo-workspace-ortopedia',
    approvedBy: {
      id: 'demo-member-carlos',
      displayName: 'Dr. Carlos Mendes',
      specialty: 'Ortopedia',
    },
    approvedAt: '2026-09-07T00:00:00.000Z',
  },
  finding: {
    id: 'finding_demo_001',
    sourceText:
      'Protusão discal posterior em L4–L5, com leve compressão do saco dural.',
    anatomicalStructure: 'Disco intervertebral L4–L5',
    atlasRef: 'BodyParts3D 4.0 / FMA',
    atlasConceptId: 'FMA16036',
    anatomyReviewRequired: false,
    patientExplanation:
      'O laudo descreve uma alteração no disco localizado entre as vértebras L4 e L5. O disco funciona como uma estrutura de amortecimento entre as vértebras. Neste exame, parte dele se projeta para trás e toca levemente estruturas próximas.',
    explanationReviewRequired: false,
    explanationProvenance: {
      origin: 'manual',
      clinicianEdited: true,
    },
    clinicianNote,
  },
}

export function createEmptyDemoReport(): VisualReport {
  const suffix =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : String(Date.now())

  return {
    id: `rep_demo_${suffix}`,
    version: 1,
    patient: {
      id: 'pat_demo_001',
      displayName: 'Paciente demonstração',
      age: 52,
    },
    title: 'Nova explicação visual',
    status: 'draft',
    finding: {
      id: `finding_demo_${suffix}`,
      sourceText: '',
      anatomicalStructure: 'Nenhuma estrutura confirmada',
      atlasRef: 'BodyParts3D 4.0 / FMA',
      atlasConceptId: '',
      anatomyReviewRequired: true,
      patientExplanation: '',
      explanationReviewRequired: true,
      explanationProvenance: {
        origin: 'manual',
        clinicianEdited: false,
      },
      clinicianNote,
    },
  }
}
