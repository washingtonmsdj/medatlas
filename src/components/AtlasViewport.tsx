import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AtlasContextMode } from '../atlas/model'
import type { AtlasConcept, HumanAtlas } from '../atlas/types'
import {
  conceptDisplayName,
  findAtlasConcept,
  loadHumanAtlas,
  searchAtlasConcepts,
} from '../atlas/source'
import { HumanAtlasScene } from './HumanAtlasScene'

interface Props {
  selected: string
  conceptId: string
  onConfirmConcept: (concept: AtlasConcept) => void
}

const QUICK_CONCEPTS = [
  { id: 'FMA7203', label: 'Rins' },
  { id: 'FMA9611', label: 'Fêmures' },
  { id: 'FMA24485', label: 'Patelas' },
  { id: 'FMA7148', label: 'Estômago' },
  { id: 'FMA7198', label: 'Pâncreas' },
]

const CONTEXT_OPTIONS: Array<{
  value: AtlasContextMode
  label: string
  description: string
}> = [
  {
    value: 'none',
    label: 'Isolado',
    description: 'somente a estrutura selecionada',
  },
  {
    value: 'system',
    label: 'Sistema',
    description: 'estruturas próximas do mesmo sistema',
  },
  {
    value: 'region',
    label: 'Região',
    description: 'contexto local de vários sistemas',
  },
]

export function AtlasViewport({
  selected,
  conceptId,
  onConfirmConcept,
}: Props) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [sourceLabel, setSourceLabel] = useState('')
  const [selectedPartCount, setSelectedPartCount] = useState(0)
  const [contextPartCount, setContextPartCount] = useState(0)
  const [contextMode, setContextMode] =
    useState<AtlasContextMode>('system')
  const [error, setError] = useState('')
  const [atlas, setAtlas] = useState<HumanAtlas | null>(null)
  const [query, setQuery] = useState('')
  const [preview, setPreview] = useState<AtlasConcept | null>(null)

  useEffect(() => {
    let active = true

    void loadHumanAtlas()
      .then((loadedAtlas) => {
        if (!active) return
        setAtlas(loadedAtlas)
        setPreview(findAtlasConcept(loadedAtlas, conceptId))
      })
      .catch((reason) => {
        if (!active) return
        setError(
          reason instanceof Error
            ? reason.message
            : 'Não foi possível abrir o catálogo anatômico.',
        )
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [conceptId])

  const activeConceptId = preview?.id ?? conceptId
  const activeLabel = preview ? conceptDisplayName(preview) : selected

  useEffect(() => {
    setStatus('loading')
    setError('')
    setSourceLabel('')
    setSelectedPartCount(0)
    setContextPartCount(0)
  }, [activeConceptId, contextMode])

  const results = useMemo(
    () => (atlas ? searchAtlasConcepts(atlas, query) : []),
    [atlas, query],
  )

  const ready = useCallback(
    (label: string, selectedCount: number, contextCount: number) => {
      setSourceLabel(label)
      setSelectedPartCount(selectedCount)
      setContextPartCount(contextCount)
      setStatus('ready')
    },
    [],
  )

  const failed = useCallback((message: string) => {
    setError(message)
    setStatus('error')
  }, [])

  const chooseConcept = (candidate: AtlasConcept) => {
    setPreview(candidate)
    setQuery('')
  }

  const chooseQuickConcept = (id: string) => {
    if (!atlas) return
    chooseConcept(findAtlasConcept(atlas, id))
  }

  return (
    <section className="atlas-card" aria-label="Atlas anatômico 3D">
      <div className="atlas-toolbar">
        <span className={status === 'error' ? 'live-dot error-dot' : 'live-dot'} />
        <span>Atlas anatômico real</span>
        <span className="atlas-badge">
          BodyParts3D 4.0 · {activeConceptId}
        </span>
      </div>

      <div className="atlas-search-panel">
        <div className="atlas-search-copy">
          <span className="section-kicker">CONFIRMAR ANATOMIA</span>
          <strong>Busque uma estrutura e pré-visualize antes de confirmar.</strong>
        </div>

        <div className="atlas-search-box">
          <input
            aria-label="Buscar estrutura anatômica"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ex.: coração, rim, fêmur, stomach, FMA7088…"
          />

          {query.trim().length >= 2 && (
            <div className="atlas-search-results">
              {results.length > 0 ? (
                results.map((candidate) => (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => chooseConcept(candidate)}
                  >
                    <span>{conceptDisplayName(candidate)}</span>
                    <small>
                      {candidate.name} · {candidate.id} · {candidate.elements.length}{' '}
                      peça{candidate.elements.length === 1 ? '' : 's'}
                    </small>
                  </button>
                ))
              ) : (
                <p>Nenhuma estrutura encontrada neste atlas.</p>
              )}
            </div>
          )}
        </div>

        <div className="quick-concepts">
          {QUICK_CONCEPTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => chooseQuickConcept(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="atlas-stage real-stage">
        <HumanAtlasScene
          conceptId={activeConceptId}
          contextMode={contextMode}
          onReady={ready}
          onError={failed}
        />

        <div className="structure-label real-label" role="status" aria-live="polite">
          <strong>{activeLabel}</strong>
          <span>
            {status === 'ready'
              ? `${sourceLabel} · ${selectedPartCount} selecionada${selectedPartCount === 1 ? '' : 's'}${contextPartCount ? ` + ${contextPartCount} de contexto` : ''}`
              : status === 'error'
                ? 'falha ao carregar a referência'
                : 'carregando geometria de referência…'}
          </span>
        </div>

        {contextMode !== 'none' &&
          status === 'ready' &&
          contextPartCount > 0 && (
            <div className="context-legend">
              <span className="legend-selected" />
              <b>Estrutura</b>
              <span className="legend-context" />
              <b>
                {contextMode === 'system'
                  ? 'Mesmo sistema'
                  : 'Região próxima'}
              </b>
            </div>
          )}

        {status === 'error' && (
          <div className="atlas-error" role="alert">
            <strong>Atlas 3D indisponível</strong>
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="atlas-actions">
        <div className="context-mode-group" role="group" aria-label="Contexto anatômico">
          {CONTEXT_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={contextMode === option.value ? 'active-context' : ''}
              type="button"
              title={option.description}
              onClick={() => setContextMode(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {preview && preview.id !== conceptId && (
          <button
            className="confirm-anatomy"
            type="button"
            onClick={() => onConfirmConcept(preview)}
          >
            Confirmar no relatório
          </button>
        )}
      </div>

      <p className="integration-note">
        As trocas de contexto reutilizam chunks anatômicos em memória. O modo
        Região usa somente peças próximas presentes nos blocos já necessários
        à estrutura, evitando transformar cada clique em um novo download do
        atlas completo.
      </p>
    </section>
  )
}
