import type { HumanAtlas } from '../atlas/types'
import { conceptDisplayName } from '../atlas/source'
import {
  DEMO_CONSTRAINTS,
  patientExplanationCharacterLength,
} from '../product/constraints'
import {
  anatomySuggestionSourceToken,
  type AnatomySuggestion,
} from './anatomy-suggestions'

export const CLINICAL_EXTRACTION_SCHEMA_VERSION =
  'medatlas.clinical-extraction/1' as const

export interface StructuredAnatomyCandidate {
  conceptId: string
  confidence: number
  evidence: string
}

export interface ClinicalExtractionProvenance {
  provider: string
  model: string
  promptVersion: string
  generatedAt: string
}

export interface StructuredClinicalExtraction {
  schemaVersion: typeof CLINICAL_EXTRACTION_SCHEMA_VERSION
  sourceExcerpt: string
  candidateStructures: StructuredAnatomyCandidate[]
  patientExplanationDraft?: string
  requiresClinicianReview: true
  provenance: ClinicalExtractionProvenance
}

export interface ClinicalExtractionEngine {
  readonly id: string
  readonly mode: 'disabled' | 'remote-ai'
  extract(sourceText: string): Promise<unknown>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function assertAllowedKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  scope: string,
) {
  const unexpected = Object.keys(value).filter(
    (key) => !allowed.includes(key),
  )

  if (unexpected.length > 0) {
    throw new Error(
      `${scope} contém campos não permitidos: ${unexpected.join(', ')}.`,
    )
  }
}

function requiredString(
  value: unknown,
  field: string,
  maxLength: number,
) {
  if (
    typeof value !== 'string' ||
    value.trim().length < 1 ||
    value.length > maxLength
  ) {
    throw new Error(`Campo estruturado inválido: ${field}.`)
  }

  return value
}

function requiredConfidence(value: unknown) {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 1
  ) {
    throw new Error('Confidence precisa estar entre 0 e 1.')
  }

  return value
}

export function validateStructuredClinicalExtraction(
  input: unknown,
  atlas: HumanAtlas,
): StructuredClinicalExtraction {
  if (!isRecord(input)) {
    throw new Error('A extração estruturada precisa ser um objeto.')
  }

  assertAllowedKeys(
    input,
    [
      'schemaVersion',
      'sourceExcerpt',
      'candidateStructures',
      'patientExplanationDraft',
      'requiresClinicianReview',
      'provenance',
    ],
    'Extração',
  )

  if (input.schemaVersion !== CLINICAL_EXTRACTION_SCHEMA_VERSION) {
    throw new Error('Versão de schema de IA não reconhecida.')
  }

  const sourceExcerpt = requiredString(
    input.sourceExcerpt,
    'sourceExcerpt',
    2000,
  )

  if (input.requiresClinicianReview !== true) {
    throw new Error(
      'Saída de IA precisa exigir revisão clínica explicitamente.',
    )
  }

  if (
    !Array.isArray(input.candidateStructures) ||
    input.candidateStructures.length < 1 ||
    input.candidateStructures.length > 6
  ) {
    throw new Error(
      'A IA precisa retornar entre 1 e 6 estruturas candidatas.',
    )
  }

  const conceptsById = new Map(
    atlas.concepts.map((concept) => [concept.id, concept]),
  )
  const seen = new Set<string>()

  const candidateStructures = input.candidateStructures.map(
    (candidate, index): StructuredAnatomyCandidate => {
      if (!isRecord(candidate)) {
        throw new Error(`Candidato ${index + 1} inválido.`)
      }

      assertAllowedKeys(
        candidate,
        ['conceptId', 'confidence', 'evidence'],
        `Candidato ${index + 1}`,
      )

      const conceptId = requiredString(
        candidate.conceptId,
        'conceptId',
        40,
      )

      if (!/^FMA\d+$/.test(conceptId)) {
        throw new Error(`Concept ID inválido: ${conceptId}.`)
      }

      const concept = conceptsById.get(conceptId)

      if (!concept || concept.elements.length < 1) {
        throw new Error(
          `A IA retornou ${conceptId}, que não existe como conceito renderizável no atlas fixado.`,
        )
      }

      if (seen.has(conceptId)) {
        throw new Error(
          `A IA retornou o conceito duplicado ${conceptId}.`,
        )
      }
      seen.add(conceptId)

      return {
        conceptId,
        confidence: requiredConfidence(candidate.confidence),
        evidence: requiredString(
          candidate.evidence,
          'evidence',
          240,
        ),
      }
    },
  )

  let patientExplanationDraft: string | undefined

  if (input.patientExplanationDraft !== undefined) {
    if (
      typeof input.patientExplanationDraft !== 'string' ||
      patientExplanationCharacterLength(input.patientExplanationDraft) >
        DEMO_CONSTRAINTS.patientExplanation.maxCharacters
    ) {
      throw new Error(
        'patientExplanationDraft excede o contrato permitido.',
      )
    }

    patientExplanationDraft = input.patientExplanationDraft
  }

  if (!isRecord(input.provenance)) {
    throw new Error('Provenance da IA é obrigatória.')
  }

  assertAllowedKeys(
    input.provenance,
    ['provider', 'model', 'promptVersion', 'generatedAt'],
    'Provenance',
  )

  const generatedAt = requiredString(
    input.provenance.generatedAt,
    'generatedAt',
    80,
  )

  if (!Number.isFinite(Date.parse(generatedAt))) {
    throw new Error('generatedAt precisa ser uma data ISO válida.')
  }

  return {
    schemaVersion: CLINICAL_EXTRACTION_SCHEMA_VERSION,
    sourceExcerpt,
    candidateStructures,
    ...(patientExplanationDraft !== undefined
      ? { patientExplanationDraft }
      : {}),
    requiresClinicianReview: true,
    provenance: {
      provider: requiredString(
        input.provenance.provider,
        'provider',
        80,
      ),
      model: requiredString(
        input.provenance.model,
        'model',
        120,
      ),
      promptVersion: requiredString(
        input.provenance.promptVersion,
        'promptVersion',
        80,
      ),
      generatedAt,
    },
  }
}

export function structuredExtractionToSuggestions(
  atlas: HumanAtlas,
  extraction: StructuredClinicalExtraction,
  sourceText: string,
): AnatomySuggestion[] {
  const conceptsById = new Map(
    atlas.concepts.map((concept) => [concept.id, concept]),
  )
  const sourceToken = anatomySuggestionSourceToken(sourceText)

  return extraction.candidateStructures
    .map((candidate) => {
      const concept = conceptsById.get(candidate.conceptId)

      if (!concept) {
        throw new Error(
          `Conceito ${candidate.conceptId} deixou de existir no atlas.`,
        )
      }

      return {
        concept,
        displayName: conceptDisplayName(concept),
        evidence: candidate.evidence,
        confidence:
          candidate.confidence >= 0.8
            ? ('high' as const)
            : ('medium' as const),
        score: Math.round(candidate.confidence * 100),
        sourceToken,
      }
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.displayName.localeCompare(b.displayName),
    )
}

export class DisabledClinicalExtractionEngine
  implements ClinicalExtractionEngine
{
  readonly id = 'disabled'
  readonly mode = 'disabled' as const

  async extract(): Promise<never> {
    throw new Error(
      'IA estruturada ainda não está configurada neste MVP sem backend.',
    )
  }
}

export const clinicalExtractionEngine =
  new DisabledClinicalExtractionEngine()
