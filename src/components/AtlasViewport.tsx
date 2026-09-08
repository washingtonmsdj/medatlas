import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AtlasContextMode } from '../atlas/model'
import type { AtlasView } from '../atlas/systems'
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
  { id: 'FMA16036', label: 'L4–L5' },
  { id: 'FMA7088', label: 'Coração' },
  { id: 'FMA7203', label: 'Rins' },
  { id: 'FMA24485', label: 'Patela' },
  { id: 'FMA7148', label: 'Estômago' },
]

const CONTEXT_OPTIONS: Array<{
  value: AtlasContextMode
  label: string
  description: string
}> = [
  {
    value: 'none',
    label: 'Isolado',
    description: 'só a estrutura',
  },
  {
    value: 'system',
    label: 'Sistema',
    description: 'mesmo sistema',
  },
  {
    value: 'region',
    label: 'Região',
    description: 'anatomia próxima',
  },
]

const VIEW_OPTIONS: Array<{
  value: AtlasView
  label: string
  short: string
}> = [
  { value: 'three-quarter', label: 'Vista 3/4', short: '3/4' },
  { value: 'front', label: 'Vista frontal', short: 'Frente' },
  { value: 'side', label: 'Vista lateral', short: 'Lado' },
  { value: 'back', label: 'Vista posterior', short: 'Costas' },
]

export function AtlasViewport({
  selected,
  conceptId,
  onConfirmConcept,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'ready' | 'error'
  >(conceptId ? 'loading' : 'idle')
  const [sourceLabel, setSourceLabel] = useState('')
  const [selectedPartCount, setSelectedPartCount] = useState(0)
  const [contextPartCount, setContextPartCount] = useState(0)
  const [contextMode, setContextMode] =
    useState<AtlasContextMode>('system')
  const [view, setView] = useState<AtlasView>('three-quarter')
  const [rotate, setRotate] = useState(false)
  const [reset, setReset] = useState(0)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [error, setError] = useState('')
  const [atlas, setAtlas] = useState<HumanAtlas | null>(null)
  const [query, setQuery] = useState('')
  const [preview, setPreview] = useState<AtlasConcept | null>(null)

  useEffect(() => {
    let active = true
    setError('')

    void loadHumanAtlas()
      .then((loadedAtlas) => {
        if (!active) return
        setAtlas(loadedAtlas)

        if (conceptId) {
          setPreview(findAtlasConcept(loadedAtlas, conceptId))
          setStatus('loading')
        } else {
          setPreview(null)
          setStatus('idle')
        }
      })
      .catch((reason) => {
        if (!active) return
        setError(
          reason instanceof Error
            ? reason.message
            : 'Não foi possível abrir o Atlas 3D.',
        )
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [conceptId, loadAttempt])

  useEffect(() => {
    const syncFullscreen = () => {
      setIsFullscreen(document.fullscreenElement === stageRef.current)
    }

    document.addEventListener('fullscreenchange', syncFullscreen)
    return () => document.removeEventListener('fullscreenchange', syncFullscreen)
  }, [])

  const activeConceptId = preview?.id ?? conceptId
  const activeLabel = preview ? conceptDisplayName(preview) : selected

  const retryAtlas = () => {
    setError('')
    setStatus(activeConceptId ? 'loading' : 'idle')
    setAtlas(null)
    setRotate(false)
    setReset((current) => current + 1)
    setLoadAttempt((current) => current + 1)
  }

  useEffect(() => {
    if (!activeConceptId) {
      setStatus('idle')
      setError('')
      setSourceLabel('')
      setSelectedPartCount(0)
      setContextPartCount(0)
      setRotate(false)
      return
    }

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
    setRotate(false)
    setReset((current) => current + 1)
  }

  const chooseQuickConcept = (id: string) => {
    if (!atlas) return
    chooseConcept(findAtlasConcept(atlas, id))
  }

  const chooseView = (nextView: AtlasView) => {
    setView(nextView)
    setRotate(false)
    setReset((current) => current + 1)
  }

  const resetScene = () => {
    setView('three-quarter')
    setRotate(false)
    setReset((current) => current + 1)
  }

  const toggleFullscreen = async () => {
    const stage = stageRef.current
    if (!stage) return

    try {
      if (document.fullscreenElement === stage) {
        await document.exitFullscreen()
      } else {
        await stage.requestFullscreen()
      }
    } catch {
      // Fullscreen is optional; the scene remains usable if blocked.
    }
  }

  const activeContextLabel =
    CONTEXT_OPTIONS.find((option) => option.value === contextMode)?.label ??
    'Sistema'

  return (
    <section
      className="atlas-card clinical-atlas-card"
      aria-label="Atlas anatômico 3D"
    >
      <header className="clinical-atlas-header">
        <div className="clinical-atlas-title">
          <span
            className={status === 'error' ? 'live-dot error-dot' : 'live-dot'}
            aria-hidden="true"
          />
          <div>
            <span className="section-kicker">HUMAN ATLAS · FOCO CLÍNICO</span>
            <strong>Atlas 3D do relatório</strong>
          </div>
        </div>

        <div className="clinical-atlas-meta">
          <code>{activeConceptId || 'sem seleção'}</code>
        </div>
      </header>

      <div className="clinical-atlas-commandbar">
        <div className="clinical-atlas-search">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Buscar estrutura anatômica"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar estrutura, órgão ou FMA…"
          />

          {query.trim().length >= 2 && (
            <div className="clinical-atlas-results">
              {results.length > 0 ? (
                results.map((candidate) => (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => chooseConcept(candidate)}
                  >
                    <span>{conceptDisplayName(candidate)}</span>
                    <small>{candidate.id}</small>
                  </button>
                ))
              ) : (
                <p>Nenhuma estrutura encontrada.</p>
              )}
            </div>
          )}
        </div>

        <div className="clinical-atlas-quick" aria-label="Atalhos anatômicos">
          {QUICK_CONCEPTS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-label={'Pré-visualizar ' + item.label + ' no Atlas 3D'}
              onClick={() => chooseQuickConcept(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="atlas-stage real-stage clinical-atlas-stage"
        ref={stageRef}
      >
        {activeConceptId ? (
          <HumanAtlasScene
            key={`${activeConceptId}-${contextMode}-${loadAttempt}`}
            conceptId={activeConceptId}
            contextMode={contextMode}
            view={view}
            rotate={rotate}
            reset={reset}
            appearance="clinical"
            onReady={ready}
            onError={failed}
          />
        ) : (
          <div className="atlas-empty-state clinical-atlas-empty">
            <span aria-hidden="true">3D</span>
            <strong>Nenhuma anatomia selecionada</strong>
            <p>Pesquise uma estrutura ou use um atalho.</p>
          </div>
        )}

        <div className="clinical-atlas-ambient" aria-hidden="true" />

        <aside
          className="clinical-atlas-focus"
          role="status"
          aria-live="polite"
        >
          <span className="section-kicker">
            {status === 'ready' ? 'ESTRUTURA EM FOCO' : 'STATUS'}
          </span>
          <strong>
            {activeConceptId ? activeLabel : 'Aguardando seleção'}
          </strong>
          <small>
            {status === 'idle'
              ? 'Selecione uma estrutura.'
              : status === 'ready'
                ? sourceLabel
                : status === 'error'
                  ? 'Não foi possível carregar o 3D.'
                  : 'Carregando anatomia 3D…'}
          </small>

          {status === 'ready' && (
            <div className="clinical-atlas-focus-metrics">
              <span>
                <b>{selectedPartCount}</b>
                foco
              </span>
              <span>
                <b>{contextPartCount}</b>
                contexto
              </span>
              <span>
                <b>{activeContextLabel}</b>
                modo
              </span>
            </div>
          )}
        </aside>

        <nav
          className="clinical-atlas-view-dock"
          aria-label="Controles da visualização clínica 3D"
        >
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={view === option.value ? 'active' : ''}
              aria-pressed={view === option.value}
              aria-label={option.label}
              title={option.label}
              disabled={!activeConceptId}
              onClick={() => chooseView(option.value)}
            >
              {option.short}
            </button>
          ))}
          <i />
          <button
            type="button"
            className={rotate ? 'active' : ''}
            aria-pressed={rotate}
            aria-label={
              rotate
                ? 'Pausar rotação automática'
                : 'Ativar rotação automática'
            }
            disabled={!activeConceptId || contextMode === 'none'}
            onClick={() => setRotate((current) => !current)}
          >
            ↻
          </button>
          <button
            type="button"
            aria-label="Redefinir visualização 3D"
            disabled={!activeConceptId}
            onClick={resetScene}
          >
            ↺
          </button>
          <button
            type="button"
            aria-label={isFullscreen ? 'Sair da tela cheia' : 'Abrir 3D em tela cheia'}
            onClick={() => void toggleFullscreen()}
          >
            {isFullscreen ? '↙' : '↗'}
          </button>
        </nav>

        <div
          className="clinical-context-switcher"
          role="group"
          aria-label="Contexto anatômico"
        >
          {CONTEXT_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={contextMode === option.value ? 'active-context' : ''}
              type="button"
              title={option.description}
              aria-pressed={contextMode === option.value}
              onClick={() => {
                setContextMode(option.value)
                setRotate(false)
                setReset((current) => current + 1)
              }}
              disabled={!activeConceptId}
            >
              <span>{option.label}</span>
              <small>{option.description}</small>
            </button>
          ))}
        </div>

        {contextMode !== 'none' &&
          status === 'ready' &&
          contextPartCount > 0 && (
            <div className="clinical-context-legend" aria-hidden="true">
              <span className="legend-selected" />
              <b>foco</b>
              <span className="legend-context" />
              <b>contexto</b>
            </div>
          )}

        {status === 'error' && (
          <div className="atlas-error clinical-atlas-error" role="alert">
            <strong>Atlas 3D indisponível</strong>
            <span>Tente carregar novamente.</span>
            <button
              className="atlas-retry-button"
              type="button"
              onClick={retryAtlas}
            >
              Tentar novamente
            </button>
          </div>
        )}
      </div>

      <footer className="clinical-atlas-footer">
        <div>
          <strong>Anatomia de referência</strong>
          <span>Arraste para girar · role para aproximar · clique para identificar</span>
        </div>

        {preview && preview.id !== conceptId && (
          <button
            className="confirm-anatomy"
            type="button"
            onClick={() => onConfirmConcept(preview)}
          >
            <span>✓</span>
            Confirmar no relatório
          </button>
        )}
      </footer>
    </section>
  )
}
