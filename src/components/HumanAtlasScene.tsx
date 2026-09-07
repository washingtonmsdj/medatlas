import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createFocusedAtlas,
  type AtlasContextMode,
} from '../atlas/model'
import {
  findAtlasConcept,
  loadHumanAtlas,
} from '../atlas/source'
import {
  isAtlasSystemId,
  type AtlasExplorerSceneState,
  type AtlasSystemId,
} from '../atlas/systems'
import type {
  AtlasConcept,
  HumanAtlas,
} from '../atlas/types'
import { HumanAtlasExplorerScene } from './HumanAtlasExplorerScene'

interface Props {
  conceptId: string
  contextMode: AtlasContextMode
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
}

export function HumanAtlasScene({
  conceptId,
  contextMode,
  onReady,
  onError,
}: Props) {
  const [prepared, setPrepared] = useState<PreparedFocus | null>(null)

  useEffect(() => {
    let active = true
    setPrepared(null)

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

        setPrepared({
          atlas: focusedAtlas,
          concept,
          selectedPartCount,
          contextPartCount,
          visibleSystems,
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
        view: 'three-quarter',
        rotate: false,
        reset: 0,
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
      view: 'three-quarter',
      rotate: false,
      reset: 0,
    }
  }, [contextMode, prepared])

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

  if (!prepared) {
    return (
      <div className="human-atlas-scene focused-reference-loading">
        <span>Preparando anatomia de referência…</span>
      </div>
    )
  }

  return (
    <div className="human-atlas-scene">
      <HumanAtlasExplorerScene
        atlas={prepared.atlas}
        state={sceneState}
        onSelect={() => {}}
        onProgress={handleProgress}
        onError={handleError}
      />
    </div>
  )
}
