import type { VisualReport } from './types'

export const demoReport: VisualReport = {
  id: 'rep_demo_l4l5',
  patient: {
    id: 'pat_demo_001',
    displayName: 'Paciente demonstração',
    age: 52,
  },
  title: 'Entenda seu exame — coluna lombar',
  status: 'clinician_review',
  finding: {
    id: 'finding_demo_001',
    sourceText:
      'Protusão discal posterior em L4–L5, com leve compressão do saco dural.',
    anatomicalStructure: 'Disco intervertebral L4–L5',
    atlasRef: 'BodyParts3D 4.0 / FMA',
    atlasConceptId: 'FMA16036',
    patientExplanation:
      'O laudo descreve uma alteração no disco localizado entre as vértebras L4 e L5. O disco funciona como uma estrutura de amortecimento entre as vértebras. Neste exame, parte dele se projeta para trás e toca levemente estruturas próximas.',
    clinicianNote:
      'Explicação educacional. A interpretação final do exame e a decisão de tratamento pertencem ao profissional responsável.',
  },
}
