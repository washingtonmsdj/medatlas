import { useCallback, useEffect, useMemo, useState } from 'react'
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

export function AtlasViewport({
  selected,
  conceptId,
  onConfirmConcept,
}: Props) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [sourceLabel, setSourceLabel] = useState('')
  const [partCount, setPartCount] = useState(0)
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
    setPartCount(0)
  }, [activeConceptId])

  const results = useMemo(
    () => (atlas ? searchAtlasConcepts(atlas, query) : []),
    [atlas, query],
  )

  const ready = useCallback((label: string, count: number) => {
    setSourceLabel(label)
    setPartCount(count)
    setStatus('ready')
  }, [])

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
          onReady={ready}
          onError={failed}
        />

        <div className="structure-label real-label">
          <strong>{activeLabel}</strong>
          <span>
            {status === 'ready'
              ? `${sourceLabel} · ${partCount} peça${partCount === 1 ? '' : 's'}`
              : status === 'error'
                ? 'falha ao carregar a referência'
                : 'carregando geometria de referência…'}
          </span>
        </div>

        {status === 'error' && (
          <div className="atlas-error" role="alert">
            <strong>Atlas 3D indisponível</strong>
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="atlas-actions">
        <button type="button">Arraste para girar</button>
        <button type="button">Role para aproximar</button>

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
        Explorar outra estrutura não altera o relatório. A mudança só acontece
        após confirmação explícita do profissional. Anatomia de referência
        BodyParts3D — não representa o corpo individual do paciente.
      </p>
    </section>
  )
}
