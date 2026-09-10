import type { AtlasConcept, HumanAtlas } from '../atlas/types'
import {
  conceptDisplayName,
  normalizeAnatomyText,
  PORTUGUESE_ALIASES,
} from '../atlas/source'

export interface AnatomySuggestion {
  concept: AtlasConcept
  displayName: string
  evidence: string
  confidence: 'high' | 'medium'
  score: number
  sourceToken: string
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^$(){}|[\]\\]/g, '\\$&')
}

function containsTerm(text: string, term: string) {
  const escaped = escapeRegExp(term)
  return new RegExp(
    `(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`,
    'i',
  ).test(text)
}

function normalizedSourceToken(normalizedText: string) {
  let hash = 2166136261

  for (let index = 0; index < normalizedText.length; index += 1) {
    hash ^= normalizedText.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return `${normalizedText.length}:${(hash >>> 0).toString(16).padStart(8, '0')}`
}

export function anatomySuggestionSourceToken(sourceText: string) {
  return normalizedSourceToken(normalizeAnatomyText(sourceText))
}

export function suggestAnatomyFromText(
  atlas: HumanAtlas,
  sourceText: string,
  limit = 6,
): AnatomySuggestion[] {
  const text = normalizeAnatomyText(sourceText)

  if (text.length < 3) return []

  const sourceToken = normalizedSourceToken(text)
  const conceptsById = new Map(
    atlas.concepts.map((concept) => [concept.id, concept]),
  )
  const candidates = new Map<string, AnatomySuggestion>()

  for (const [alias, conceptIds] of Object.entries(PORTUGUESE_ALIASES)) {
    const normalizedAlias = normalizeAnatomyText(alias)

    if (!containsTerm(text, normalizedAlias)) continue

    for (const conceptId of conceptIds) {
      const concept = conceptsById.get(conceptId)
      if (!concept) continue

      const score = 100 + Math.min(normalizedAlias.length, 40)
      const existing = candidates.get(conceptId)

      if (!existing || existing.score < score) {
        candidates.set(conceptId, {
          concept,
          displayName: conceptDisplayName(concept),
          evidence: alias,
          confidence: 'high',
          score,
          sourceToken,
        })
      }
    }
  }

  for (const concept of atlas.concepts) {
    const normalizedName = normalizeAnatomyText(concept.name)

    if (
      normalizedName.length < 6 ||
      normalizedName.split(/\s+/).length > 7 ||
      !containsTerm(text, normalizedName)
    ) {
      continue
    }

    const score = 50 + Math.min(normalizedName.length, 35)
    const existing = candidates.get(concept.id)

    if (!existing || existing.score < score) {
      candidates.set(concept.id, {
        concept,
        displayName: conceptDisplayName(concept),
        evidence: concept.name,
        confidence: 'medium',
        score,
        sourceToken,
      })
    }
  }

  return [...candidates.values()]
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.displayName.localeCompare(b.displayName),
    )
    .slice(0, limit)
}
