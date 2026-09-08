import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import {
  createFocusedAtlas,
  type AtlasContextMode,
} from '../atlas/model'
import {
  conceptDisplayName,
  findAtlasConcept,
  loadHumanAtlas,
  PORTUGUESE_LABELS,
} from '../atlas/source'
import {
  isAtlasSystemId,
  type AtlasExplorerSceneState,
  type AtlasSystemId,
  type AtlasView,
} from '../atlas/systems'
import type {
  AtlasConcept,
  HumanAtlas,
} from '../atlas/types'
import type { AtlasSceneAppearance } from './HumanAtlasExplorerScene'

const HumanAtlasExplorerScene = lazy(async () => {
  const module = await import('./HumanAtlasExplorerScene')
  return { default: module.HumanAtlasExplorerScene }
})

interface Props {
  conceptId: string
  contextMode: AtlasContextMode
  view?: AtlasView
  rotate?: boolean
  reset?: number
  appearance?: AtlasSceneAppearance
  onReady?: (
    label: string,
    selectedPartCount: number,
    contextPartCount: number,
  ) => void
  onError?: (message: string) => void
}

interface PreparedFocus {
  atlas: HumanAtlas
  concept: AtlasConcept
  selectedPartCount: number
  contextPartCount: number
  visibleSystems: AtlasSystemId[]
  partLabels: Record<string, string>
  patientPartLabels: Record<string, string>
}

interface InspectedPart {
  partId: string
  conceptId: string
  label: string
  technicalLabel: string
}

const PATIENT_INSPECTION_FALLBACK = 'Estrutura anatômica selecionada'

export function HumanAtlasScene({
  conceptId,
  contextMode,
  view = 'three-quarter',
  rotate = false,
  reset = 0,
  appearance = 'clinical',
  onReady,
  onError,
}: Props) {
  const [prepared, setPrepared] = useState<PreparedFocus | null>(null)
  const [inspectedPart, setInspectedPart] = useState<InspectedPart | null>(null)

  useEffect(() => {
    let active = true
    setPrepared(null)
    setInspectedPart(null)

    void loadHumanAtlas()
      .then((atlas) => {
        if (!active) return

        const concept = findAtlasConcept(atlas, conceptId)
        const focusedAtlas = createFocusedAtlas(
          atlas,
          concept,
          contextMode,
          contextMode === 'region' ? 18 : 10,
        )
        const selectedIds = new Set(concept.elements)
        const selectedPartCount = focusedAtlas.parts.filter((part) =>
          selectedIds.has(part.id),
        ).length
        const contextPartCount =
          focusedAtlas.parts.length - selectedPartCount
        const visibleSystems = [
          ...new Set(
            focusedAtlas.parts
              .map((part) => part.system)
              .filter(isAtlasSystemId),
          ),
        ]
        const conceptsById = new Map(
          atlas.concepts.map((candidate) => [candidate.id, candidate]),
        )
        const focusedConceptPatientLabel = PORTUGUESE_LABELS[concept.id]
        const partLabels = Object.fromEntries(
          focusedAtlas.parts.map((part) => {
            const partConcept = conceptsById.get(part.conceptId)
            return [
              part.id,
              partConcept ? conceptDisplayName(partConcept) : part.name,
            ]
          }),
        )
        const patientPartLabels = Object.fromEntries(
          focusedAtlas.parts.map((part) => {
            const partConcept = conceptsById.get(part.conceptId)
            const translatedPartLabel = partConcept
              ? PORTUGUESE_LABELS[partConcept.id]
              : undefined
            const focusedLabel =
              part.conceptId === concept.id
                ? focusedConceptPatientLabel
                : undefined

            return [
              part.id,
              translatedPartLabel ??
                focusedLabel ??
                PATIENT_INSPECTION_FALLBACK,
            ]
          }),
        )

        setPrepared({
          atlas: focusedAtlas,
          concept,
          selectedPartCount,
          contextPartCount,
          visibleSystems,
          partLabels,
          patientPartLabels,
        })
      })
      .catch((reason) => {
        if (!active) return
        onError?.(
          reason instanceof Error
            ? reason.message
            : 'Não foi possível preparar a anatomia 3D.',
        )
      })

    return () => {
      active = false
    }
  }, [conceptId, contextMode, onError])

  const sceneState = useMemo<AtlasExplorerSceneState>(() => {
    if (!prepared) {
      return {
        explode: 0,
        visible: [],
        selected: [],
        isolate: true,
        view,
        rotate,
        reset,
      }
    }

    const selected = prepared.concept.elements.filter((id) =>
      prepared.atlas.parts.some((part) => part.id === id),
    )

    return {
      explode: 0,
      visible:
        contextMode === 'none'
          ? []
          : prepared.visibleSystems,
      selected,
      isolate: contextMode === 'none',
      view,
      rotate,
      reset,
    }
  }, [contextMode, prepared, reset, rotate, view])

  const handleProgress = useCallback(
    (progress: number) => {
      if (progress !== 100 || !prepared) return

      onReady?.(
        prepared.concept.name,
        prepared.selectedPartCount,
        prepared.contextPartCount,
      )
    },
    [onReady, prepared],
  )

  const handleError = useCallback(
    (message: string) => {
      onError?.(message)
    },
    [onError],
  )

  const inspectPart = useCallback(
    (partId: string) => {
      if (!prepared) return

      const part = prepared.atlas.parts.find((candidate) => candidate.id === partId)
      if (!part) return

      setInspectedPart({
        partId: part.id,
        conceptId: part.conceptId,
        label:
          appearance === 'patient'
            ? prepared.patientPartLabels[part.id] ?? PATIENT_INSPECTION_FALLBACK
            : prepared.partLabels[part.id] ?? part.name,
        technicalLabel: part.name,
      })
    },
    [appearance, prepared],
  )

  if (!prepared) {
    return (
      <div
        className="human-atlas-scene focused-reference-loading"
        role="status"
        aria-live="polite"
        aria-label="Preparando anatomia de referência"
      >
        <div className="focused-reference-loading-card">
          <span className="focused-reference-loader" aria-hidden="true" />
          <div>
            <strong>Preparando anatomia de referência</strong>
            <small>Carregando somente as peças necessárias para este foco.</small>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="human-atlas-scene">
      <Suspense
        fallback={
          <div
            className="focused-reference-loading renderer-module-loading"
            role="status"
            aria-live="polite"
            aria-label="Carregando motor 3D"
          >
            <div className="focused-reference-loading-card">
              <span className="focused-reference-loader" aria-hidden="true" />
              <div>
                <strong>Carregando motor 3D</strong>
                <small>O shell clínico permanece disponível enquanto o renderer é preparado.</small>
              </div>
            </div>
          </div>
        }
      >
        <HumanAtlasExplorerScene
          atlas={prepared.atlas}
          state={sceneState}
          onSelect={inspectPart}
          inspectedPartId={inspectedPart?.partId}
          onProgress={handleProgress}
          onError={handleError}
          appearance={appearance}
        />
      </Suspense>

      {inspectedPart && (
        <aside
          className="focused-reference-inspector"
          aria-label="Estrutura anatômica inspecionada"
          aria-live="polite"
        >
          <button
            type="button"
            aria-label="Fechar identificação anatômica"
            onClick={() => setInspectedPart(null)}
          >
            ×
          </button>
          <span>ESTRUTURA INSPECIONADA</span>
          <strong>{inspectedPart.label}</strong>
          <small>
            {appearance === 'patient'
              ? `Referência técnica: ${inspectedPart.technicalLabel} · ${inspectedPart.conceptId}`
              : `${inspectedPart.conceptId} · peça ${inspectedPart.partId}`}
          </small>
          <em>
            {appearance === 'patient'
              ? 'Identificação visual de anatomia humana de referência. Ela ajuda na orientação e não representa o corpo individual do paciente.'
              : 'Inspeção visual apenas. A anatomia confirmada do relatório não foi alterada.'}
          </em>
        </aside>
      )}
    </div>
  )
}
