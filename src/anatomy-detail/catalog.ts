import { normalizeAnatomyText } from '../atlas/source'

export const ORGAN_DETAIL_UPSTREAM_SHA =
  '8c0e6f321a47f895ae58ce098028b92774733ee9'

export type OrganDetailId =
  | 'heart'
  | 'brain'
  | 'lungs'
  | 'liver'
  | 'kidneys'
  | 'eyeball'
  | 'intestine'
  | 'pancreas'
  | 'skin'

export interface OrganDetailDefinition {
  id: OrganDetailId
  label: string
  scientificName: string
  accent: string
  modelFile: string
  conceptIds: string[]
  matchTerms: string[]
}

export const ORGAN_DETAIL_CATALOG: OrganDetailDefinition[] = [
  {
    id: 'heart',
    label: 'Coração',
    scientificName: 'Cor',
    accent: '#ee7c6a',
    modelFile: 'heart.glb',
    conceptIds: ['FMA7088'],
    matchTerms: ['coração', 'coracao', 'heart', 'cor'],
  },
  {
    id: 'brain',
    label: 'Cérebro',
    scientificName: 'Encephalon',
    accent: '#c58696',
    modelFile: 'brain.glb',
    conceptIds: ['FMA50801'],
    matchTerms: ['cérebro', 'cerebro', 'brain', 'encephalon'],
  },
  {
    id: 'lungs',
    label: 'Pulmões',
    scientificName: 'Pulmones',
    accent: '#dd8f8b',
    modelFile: 'lungs.glb',
    conceptIds: [],
    matchTerms: ['pulmão', 'pulmao', 'pulmões', 'pulmoes', 'lung', 'lungs', 'pulmo'],
  },
  {
    id: 'liver',
    label: 'Fígado',
    scientificName: 'Hepar',
    accent: '#b86858',
    modelFile: 'liver.glb',
    conceptIds: ['FMA7197'],
    matchTerms: ['fígado', 'figado', 'liver', 'hepar'],
  },
  {
    id: 'kidneys',
    label: 'Rins',
    scientificName: 'Renes',
    accent: '#c96963',
    modelFile: 'kidneys.glb',
    conceptIds: ['FMA7203'],
    matchTerms: ['rim', 'rins', 'kidney', 'kidneys', 'ren', 'renes'],
  },
  {
    id: 'eyeball',
    label: 'Olho',
    scientificName: 'Oculus',
    accent: '#7294b9',
    modelFile: 'eyeball.glb',
    conceptIds: [],
    matchTerms: ['olho', 'olhos', 'eye', 'eyeball', 'oculus'],
  },
  {
    id: 'intestine',
    label: 'Intestino',
    scientificName: 'Intestinum',
    accent: '#c98572',
    modelFile: 'intestine.glb',
    conceptIds: [],
    matchTerms: ['intestino', 'intestine', 'intestinum'],
  },
  {
    id: 'pancreas',
    label: 'Pâncreas',
    scientificName: 'Pancreas',
    accent: '#d39a77',
    modelFile: 'pancreas.glb',
    conceptIds: ['FMA7198'],
    matchTerms: ['pâncreas', 'pancreas'],
  },
  {
    id: 'skin',
    label: 'Pele',
    scientificName: 'Cutis',
    accent: '#d4a58d',
    modelFile: 'skin.glb',
    conceptIds: [],
    matchTerms: ['pele', 'skin', 'cutis'],
  },
]

const configuredBase = import.meta.env.VITE_ORGAN_DETAIL_ASSET_BASE?.trim()

export const ORGAN_DETAIL_ASSET_BASE =
  configuredBase ||
  `https://raw.githubusercontent.com/thebuggeddev/anatomy/${ORGAN_DETAIL_UPSTREAM_SHA}/public/models`

export function organDetailModelUrl(detail: OrganDetailDefinition) {
  return `${ORGAN_DETAIL_ASSET_BASE.replace(/\/+$/, '')}/${detail.modelFile}`
}

export function resolveOrganDetail(
  conceptId?: string,
  label?: string,
): OrganDetailDefinition | null {
  if (!conceptId && !label) return null

  const exact = conceptId
    ? ORGAN_DETAIL_CATALOG.find((detail) =>
        detail.conceptIds.includes(conceptId),
      )
    : undefined

  if (exact) return exact

  const normalized = normalizeAnatomyText(label ?? '')
  if (!normalized) return null

  return (
    ORGAN_DETAIL_CATALOG.find((detail) =>
      detail.matchTerms.some((term) => {
        const candidate = normalizeAnatomyText(term)
        return normalized === candidate || normalized.includes(candidate)
      }),
    ) ?? null
  )
}
