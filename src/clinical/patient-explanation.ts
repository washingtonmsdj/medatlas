import type {
  ExplanationProvenance,
  VisualReport,
} from '../domain/types'

export interface PatientExplanationDraft {
  text: string
  provenance: ExplanationProvenance
  inputIdentity: {
    reportId: string
    sourceText: string
    atlasConceptId: string
    anatomicalStructure: string
  }
}

export interface PatientExplanationGenerator {
  generate(report: VisualReport): Promise<PatientExplanationDraft>
}

interface EducationalContext {
  location: string
  role: string
}

const CONTEXT: Record<string, EducationalContext> = {
  FMA16033: {
    location: 'entre as primeiras vértebras da região lombar',
    role: 'ajuda a distribuir cargas e permite movimento entre as vértebras',
  },
  FMA16034: {
    location: 'entre vértebras da região lombar',
    role: 'ajuda a distribuir cargas e permite movimento entre as vértebras',
  },
  FMA16035: {
    location: 'entre vértebras da região lombar',
    role: 'ajuda a distribuir cargas e permite movimento entre as vértebras',
  },
  FMA16036: {
    location: 'entre as vértebras L4 e L5, na parte inferior da coluna',
    role: 'funciona como uma estrutura de amortecimento e distribuição de carga',
  },
  FMA16037: {
    location: 'na transição entre a coluna lombar e o sacro',
    role: 'ajuda a distribuir cargas e permite movimento nessa transição',
  },
  FMA16203: {
    location: 'na parte inferior das costas',
    role: 'sustenta parte importante do peso do corpo e participa dos movimentos do tronco',
  },
  FMA9921: {
    location: 'na parte inferior da coluna vertebral',
    role: 'forma a estrutura óssea de sustentação da região lombar',
  },
  FMA24138: {
    location: 'na região do pescoço',
    role: 'sustenta a cabeça e participa dos movimentos do pescoço',
  },
  FMA9915: {
    location: 'na região do pescoço',
    role: 'compõe a estrutura óssea que sustenta e movimenta essa região',
  },
  FMA7647: {
    location: 'dentro do canal formado pela coluna vertebral',
    role: 'conduz sinais entre o cérebro e várias regiões do corpo',
  },
  FMA7088: {
    location: 'no tórax, entre os pulmões',
    role: 'bombeia o sangue para a circulação pulmonar e para o restante do corpo',
  },
  FMA7203: {
    location: 'na região posterior do abdômen',
    role: 'participa da filtragem do sangue e da formação da urina',
  },
  FMA9611: {
    location: 'na coxa',
    role: 'é o principal osso da coxa e participa da sustentação e do movimento',
  },
  FMA24485: {
    location: 'na parte anterior do joelho',
    role: 'protege a articulação e participa do mecanismo de extensão do joelho',
  },
  FMA13303: {
    location: 'no braço, entre ombro e cotovelo',
    role: 'participa da sustentação e dos movimentos do membro superior',
  },
  FMA7197: {
    location: 'na parte superior direita do abdômen',
    role: 'participa de várias funções metabólicas, digestivas e de processamento de substâncias',
  },
  FMA50801: {
    location: 'dentro do crânio',
    role: 'coordena funções do sistema nervoso, percepção, movimento e outras atividades do organismo',
  },
  FMA7148: {
    location: 'na parte superior do abdômen',
    role: 'participa da digestão e do processamento inicial dos alimentos',
  },
  FMA7198: {
    location: 'no abdômen, próximo ao estômago e ao duodeno',
    role: 'participa da digestão e do controle de glicose por meio de hormônios',
  },
  FMA7196: {
    location: 'na parte superior esquerda do abdômen',
    role: 'participa de funções do sistema imune e do processamento de células do sangue',
  },
  FMA15900: {
    location: 'na pelve',
    role: 'armazena temporariamente a urina antes da eliminação',
  },
  FMA9600: {
    location: 'na pelve, abaixo da bexiga',
    role: 'faz parte do sistema reprodutor masculino',
  },
  FMA9629: {
    location: 'na região posterior e superior do ombro',
    role: 'participa da elevação e estabilização do ombro',
  },
  FMA32546: {
    location: 'na região posterior do ombro',
    role: 'participa da rotação externa e estabilização do ombro',
  },
  FMA13413: {
    location: 'na face anterior da escápula',
    role: 'participa da rotação interna e estabilização do ombro',
  },
  FMA32550: {
    location: 'na região posterior do ombro',
    role: 'participa da rotação externa e estabilização do ombro',
  },
}

const GENERATOR_ID = 'medatlas-educational-draft'
const GENERATOR_VERSION = '1'

function genericDraft(report: VisualReport) {
  const structure = report.finding.anatomicalStructure

  return [
    `O laudo menciona a estrutura “${structure}”.`,
    'A visualização ao lado ajuda a localizar essa anatomia em um modelo humano de referência.',
    'O trecho original do laudo permanece disponível para que o profissional explique o significado clínico no seu caso.',
    'Esta explicação não determina gravidade, causa, diagnóstico ou tratamento.',
  ].join(' ')
}

function createInputIdentity(report: VisualReport) {
  return {
    reportId: report.id,
    sourceText: report.finding.sourceText,
    atlasConceptId: report.finding.atlasConceptId,
    anatomicalStructure: report.finding.anatomicalStructure,
  }
}

export class DeterministicPatientExplanationGenerator
  implements PatientExplanationGenerator
{
  async generate(report: VisualReport): Promise<PatientExplanationDraft> {
    const conceptId = report.finding.atlasConceptId

    if (!conceptId || report.finding.anatomyReviewRequired) {
      throw new Error(
        'Confirme a estrutura anatômica para o texto atual antes de gerar a explicação.',
      )
    }

    const context = CONTEXT[conceptId]
    const text = context
      ? [
          `O laudo menciona “${report.finding.anatomicalStructure}”.`,
          `Essa estrutura fica ${context.location} e ${context.role}.`,
          'A imagem 3D mostra uma anatomia humana de referência para ajudar na localização.',
          'O significado do trecho do laudo, sua importância e qualquer decisão clínica devem ser explicados pelo profissional responsável.',
        ].join(' ')
      : genericDraft(report)

    return {
      text,
      provenance: {
        origin: 'deterministic',
        generatorId: GENERATOR_ID,
        generatorVersion: GENERATOR_VERSION,
        generatedAt: new Date().toISOString(),
        clinicianEdited: false,
      },
      inputIdentity: createInputIdentity(report),
    }
  }
}

export const patientExplanationGenerator =
  new DeterministicPatientExplanationGenerator()
