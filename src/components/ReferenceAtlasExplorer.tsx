import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import '../reference-atlas.css'
import {
  conceptDisplayName,
  findAtlasConcept,
  loadHumanAtlas,
  searchAtlasConcepts,
} from '../atlas/source'
import {
  ATLAS_SYSTEMS,
  DEFAULT_VISIBLE_SYSTEMS,
  type AtlasExplorerSceneState,
  type AtlasSystemId,
  type AtlasView,
} from '../atlas/systems'
import type { AtlasConcept, AtlasPart, HumanAtlas } from '../atlas/types'

const HumanAtlasExplorerScene = lazy(async () => {
  const module = await import('./HumanAtlasExplorerScene')
  return { default: module.HumanAtlasExplorerScene }
})

interface Props {
  initialConceptId?: string
  onConfirmConcept: (concept: AtlasConcept) => void
}

const ORGAN_SYSTEMS: AtlasSystemId[] = [
  'cardiac',
  'respiratory',
  'digestive',
  'urinary',
  'endocrine',
  'reproductive',
]

const VIEW_OPTIONS: Array<{
  id: AtlasView
  label: string
  short: string
}> = [
  { id: 'three-quarter', label: 'Vista 3/4', short: '3/4' },
  { id: 'front', label: 'Frente', short: 'Frente' },
  { id: 'side', label: 'Lateral', short: 'Lado' },
  { id: 'back', label: 'Costas', short: 'Costas' },
]

const ATLAS_SOURCES = {
  humanAtlas: 'https://github.com/ashemag/human-atlas',
  bodyParts3d: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
} as const

function initialState(): AtlasExplorerSceneState {
  return {
    explode: 0,
    visible: DEFAULT_VISIBLE_SYSTEMS,
    selected: [],
    isolate: false,
    view: 'three-quarter',
    rotate: false,
    reset: 0,
  }
}

function partConcept(atlas: HumanAtlas, part: AtlasPart) {
  return (
    atlas.concepts.find((concept) => concept.id === part.conceptId) ?? {
      id: part.conceptId,
      name: part.name,
      elements: [part.id],
    }
  )
}

export function ReferenceAtlasExplorer({
  initialConceptId,
  onConfirmConcept,
}: Props) {
  const [atlas, setAtlas] = useState<HumanAtlas | null>(null)
  const [state, setState] = useState<AtlasExplorerSceneState>(initialState)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [chosen, setChosen] = useState<AtlasConcept | null>(null)
  const [mobilePanel, setMobilePanel] = useState<
    'layers' | 'inspector' | null
  >(null)

  useEffect(() => {
    let active = true

    void loadHumanAtlas()
      .then((loadedAtlas) => {
        if (!active) return
        setAtlas(loadedAtlas)

        if (!initialConceptId) return

        try {
          const concept = findAtlasConcept(loadedAtlas, initialConceptId)
          setChosen(concept)
          setState((current) => ({
            ...current,
            selected: concept.elements,
          }))
        } catch {
          // The explorer remains usable when the report concept is unavailable.
        }
      })
      .catch((reason) => {
        if (!active) return
        setError(
          reason instanceof Error
            ? reason.message
            : 'Não foi possível abrir o Atlas 3D.',
        )
      })

    return () => {
      active = false
    }
  }, [initialConceptId])

  const partsById = useMemo(
    () => new Map(atlas?.parts.map((part) => [part.id, part]) ?? []),
    [atlas],
  )

  const counts = useMemo(() => {
    const next = new Map<string, number>()
    if (!atlas) return next

    for (const part of atlas.parts) {
      next.set(part.system, (next.get(part.system) ?? 0) + 1)
    }

    return next
  }, [atlas])

  const activeSystems = useMemo(
    () =>
      ATLAS_SYSTEMS.filter((system) => (counts.get(system.id) ?? 0) > 0),
    [counts],
  )

  const results = useMemo(
    () => (atlas ? searchAtlasConcepts(atlas, query, 40) : []),
    [atlas, query],
  )

  const selectedParts = useMemo(
    () =>
      state.selected
        .map((id) => partsById.get(id))
        .filter((part): part is AtlasPart => Boolean(part)),
    [partsById, state.selected],
  )

  const selectedSystem = selectedParts[0]
    ? ATLAS_SYSTEMS.find((system) => system.id === selectedParts[0].system)
    : undefined

  const visibleCount = useMemo(() => {
    if (!atlas) return 0

    const visible = new Set(state.visible)
    const selected = new Set(state.selected)

    return atlas.parts.filter((part) =>
      state.isolate
        ? selected.has(part.id)
        : visible.has(part.system as AtlasSystemId) || selected.has(part.id),
    ).length
  }, [atlas, state.isolate, state.selected, state.visible])

  const chooseConcept = (concept: AtlasConcept) => {
    setChosen(concept)
    setMobilePanel('inspector')
    setState((current) => ({
      ...current,
      selected: concept.elements,
      isolate: false,
      rotate: false,
      explode: 0,
      reset: current.reset + 1,
    }))
    setQuery('')
  }

  const choosePart = useCallback(
    (partId: string) => {
      if (!atlas) return
      const part = partsById.get(partId)
      if (!part) return

      const concept = partConcept(atlas, part)
      setChosen(concept)
      setMobilePanel('inspector')
      setState((current) => ({
        ...current,
        selected: [part.id],
        isolate: false,
        rotate: false,
      }))
    },
    [atlas, partsById],
  )

  const toggleSystem = (systemId: AtlasSystemId) => {
    setChosen(null)
    setState((current) => ({
      ...current,
      selected: [],
      isolate: false,
      visible: current.visible.includes(systemId)
        ? current.visible.filter((id) => id !== systemId)
        : [...current.visible, systemId],
    }))
  }

  const showOnlySystem = (systemId: AtlasSystemId) => {
    setChosen(null)
    setState((current) => ({
      ...current,
      selected: [],
      isolate: false,
      visible: [systemId],
      explode: 0,
      reset: current.reset + 1,
    }))
  }

  const showPreset = (visible: AtlasSystemId[]) => {
    setChosen(null)
    setState((current) => ({
      ...current,
      selected: [],
      isolate: false,
      visible,
      explode: 0,
      rotate: false,
      reset: current.reset + 1,
    }))
  }

  const reset = () => {
    setChosen(null)
    setQuery('')
    setMobilePanel(null)
    setState((current) => ({
      ...initialState(),
      reset: current.reset + 1,
    }))
  }

  const setView = (view: AtlasView) => {
    setState((current) => ({
      ...current,
      view,
      reset: current.reset + 1,
      rotate: false,
    }))
  }

  const onProgress = useCallback((value: number) => {
    setProgress(value)
  }, [])

  const onError = useCallback((message: string) => {
    setError(message)
  }, [])

  return (
    <section
      className="reference-atlas-explorer reference-atlas-workbench"
      aria-label="Explorador Human Atlas adaptado"
    >
      <header className="reference-workbench-header">
        <div>
          <span className="section-kicker">HUMAN ATLAS</span>
          <h2>
            Atlas <b>3D</b>
          </h2>
          <p>Pesquise, explore e escolha uma estrutura para o relatório.</p>
        </div>

        <div className="reference-workbench-status">
          <span className={error ? 'has-error' : progress === 100 ? 'ready' : ''}>
            <i aria-hidden="true" />
            {error ? '3D indisponível' : progress === 100 ? 'Pronto' : 'Carregando'}
          </span>
          <button type="button" onClick={reset}>
            Redefinir
          </button>
        </div>
      </header>

      <div className="reference-atlas-stage">
        {atlas && (
          <Suspense
            fallback={
              <div
                className="reference-renderer-loading"
                role="status"
                aria-live="polite"
              >
                <span className="focused-reference-loader" aria-hidden="true" />
                <div>
                  <strong>Carregando Atlas 3D</strong>
                  <small>Preparando anatomia interativa.</small>
                </div>
              </div>
            }
          >
            <HumanAtlasExplorerScene
              atlas={atlas}
              state={state}
              onSelect={choosePart}
              onProgress={onProgress}
              onError={onError}
              appearance="explorer"
            />
          </Suspense>
        )}

        <div className="reference-atlas-search reference-command-palette">
          <label htmlFor="reference-atlas-search">Buscar no corpo</label>
          <div>
            <span aria-hidden="true">⌕</span>
            <input
              id="reference-atlas-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Estrutura, órgão, osso ou FMA…"
            />
            <kbd>FMA</kbd>
          </div>

          {query.trim().length >= 2 && (
            <div className="reference-atlas-results">
              {results.length > 0 ? (
                results.map((concept) => (
                  <button
                    key={concept.id}
                    type="button"
                    onClick={() => chooseConcept(concept)}
                  >
                    <span>{conceptDisplayName(concept)}</span>
                    <small>{concept.id}</small>
                  </button>
                ))
              ) : (
                <p>Nenhuma estrutura encontrada.</p>
              )}
            </div>
          )}
        </div>

        <nav
          className="reference-mobile-tools"
          aria-label="Ferramentas do Atlas no celular"
        >
          <button
            type="button"
            aria-expanded={mobilePanel === 'layers'}
            aria-controls="reference-atlas-layers"
            onClick={() =>
              setMobilePanel((current) =>
                current === 'layers' ? null : 'layers',
              )
            }
          >
            Camadas
            <span>{visibleCount.toLocaleString('pt-BR')}</span>
          </button>
          <button
            type="button"
            aria-expanded={mobilePanel === 'inspector'}
            aria-controls="reference-atlas-inspector"
            onClick={() =>
              setMobilePanel((current) =>
                current === 'inspector' ? null : 'inspector',
              )
            }
          >
            Estrutura
            <span>{chosen ? '1' : '—'}</span>
          </button>
        </nav>

        <aside
          id="reference-atlas-layers"
          className={
            'reference-atlas-systems ' +
            (mobilePanel === 'layers' ? 'mobile-open' : '')
          }
          aria-label="Sistemas anatômicos"
        >
          <div className="reference-panel-heading">
            <div>
              <span className="section-kicker">CAMADAS</span>
              <strong>Camadas anatômicas</strong>
            </div>
            <span>{activeSystems.length}</span>
            <button
              type="button"
              className="reference-mobile-panel-close"
              aria-label="Fechar camadas anatômicas"
              onClick={() => setMobilePanel(null)}
            >
              ×
            </button>
          </div>

          <div className="reference-presets">
            <button
              type="button"
              onClick={() => showPreset(activeSystems.map((system) => system.id))}
            >
              Corpo
            </button>
            <button type="button" onClick={() => showPreset(['skeletal'])}>
              Esqueleto
            </button>
            <button type="button" onClick={() => showPreset(ORGAN_SYSTEMS)}>
              Órgãos
            </button>
          </div>

          <div className="reference-system-list">
            {activeSystems.map((system) => {
              const enabled = state.visible.includes(system.id)

              return (
                <div className={enabled ? 'enabled' : ''} key={system.id}>
                  <button
                    type="button"
                    className="reference-system-name"
                    onClick={() => showOnlySystem(system.id)}
                    title={'Mostrar somente ' + system.name}
                  >
                    <span
                      className="reference-system-dot"
                      style={{ background: system.color }}
                    />
                    <span>{system.name}</span>
                    <small>{counts.get(system.id)?.toLocaleString('pt-BR')}</small>
                  </button>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    aria-label={'Mostrar ' + system.name}
                    className="reference-system-switch"
                    onClick={() => toggleSystem(system.id)}
                  >
                    <span />
                  </button>
                </div>
              )
            })}
          </div>

          <div className="reference-panel-foot">
            <span>
              <b>{visibleCount.toLocaleString('pt-BR')}</b> estruturas visíveis
            </span>
            <button type="button" onClick={() => showPreset([])}>
              Ocultar
            </button>
          </div>
        </aside>

        <aside
          id="reference-atlas-inspector"
          className={
            'reference-structure-card reference-inspector-card ' +
            (mobilePanel === 'inspector' ? 'mobile-open' : '')
          }
        >
          <button
            type="button"
            className="reference-mobile-panel-close reference-mobile-inspector-close"
            aria-label="Fechar inspetor anatômico"
            onClick={() => setMobilePanel(null)}
          >
            ×
          </button>

          {chosen ? (
            <>
              <span
                className="reference-structure-accent"
                style={{ background: selectedSystem?.color }}
              />
              <span className="section-kicker">ESTRUTURA SELECIONADA</span>
              <h3>{conceptDisplayName(chosen)}</h3>
              <p>{chosen.name}</p>

              <div className="reference-structure-meta">
                <span>
                  Referência
                  <strong>{chosen.id}</strong>
                </span>
                <span>
                  Sistema
                  <strong>{selectedSystem?.name ?? 'Anatomia'}</strong>
                </span>
              </div>

              <button
                className="primary"
                type="button"
                onClick={() =>
                  setState((current) => ({
                    ...current,
                    isolate: !current.isolate,
                    explode: 0,
                    rotate: false,
                    reset: current.reset + 1,
                  }))
                }
              >
                {state.isolate ? 'Mostrar anatomia ao redor' : 'Isolar estrutura'}
              </button>

              <button type="button" onClick={() => onConfirmConcept(chosen)}>
                Usar no relatório
              </button>

              <button
                type="button"
                onClick={() => {
                  setChosen(null)
                  setState((current) => ({
                    ...current,
                    selected: [],
                    isolate: false,
                  }))
                }}
              >
                Limpar seleção
              </button>
            </>
          ) : (
            <>
              <span className="section-kicker">INSPETOR ANATÔMICO</span>
              <h3>Selecione uma estrutura.</h3>
              <p>Pesquise ou clique diretamente no corpo.</p>
              <div className="reference-inspector-tips">
                <span>
                  <b>01</b> Arraste para girar
                </span>
                <span>
                  <b>02</b> Role para aproximar
                </span>
                <span>
                  <b>03</b> Clique para selecionar
                </span>
              </div>
            </>
          )}
        </aside>

        <nav
          className="reference-view-controls"
          aria-label="Controles de câmera do Atlas 3D"
        >
          {VIEW_OPTIONS.map((viewOption) => (
            <button
              key={viewOption.id}
              type="button"
              className={state.view === viewOption.id ? 'active' : ''}
              aria-pressed={state.view === viewOption.id}
              title={viewOption.label}
              onClick={() => setView(viewOption.id)}
            >
              {viewOption.short}
            </button>
          ))}
          <i />
          <button
            type="button"
            className={state.rotate ? 'active' : ''}
            aria-pressed={state.rotate}
            aria-label={
              state.rotate
                ? 'Pausar rotação automática'
                : 'Ativar rotação automática'
            }
            onClick={() =>
              setState((current) => ({
                ...current,
                rotate: !current.rotate,
              }))
            }
          >
            ↻
          </button>
          <button type="button" aria-label="Resetar Atlas 3D" onClick={reset}>
            ↺
          </button>
        </nav>

        <div className="reference-explode-control">
          <div>
            <label htmlFor="reference-explode">Separar anatomia</label>
            <output>{Math.round(state.explode * 100)}%</output>
          </div>
          <input
            id="reference-explode"
            type="range"
            min="0"
            max="100"
            step="1"
            value={Math.round(state.explode * 100)}
            onChange={(event) => {
              const explode = Number(event.target.value) / 100
              setState((current) => ({
                ...current,
                explode,
                view: explode > 0.8 ? 'front' : current.view,
                rotate: false,
              }))
            }}
          />
          <div className="reference-explode-labels">
            <span>Corpo</span>
            <span>Separado</span>
          </div>
        </div>

        <div className="reference-atlas-hud">
          <span>
            <i className="reference-hud-selected" aria-hidden="true" />
            {chosen ? conceptDisplayName(chosen) : 'Nenhuma seleção'}
          </span>
          <span>
            {state.isolate
              ? 'Estrutura isolada'
              : state.explode > 0.05
                ? 'Anatomia separada'
                : 'Exploração livre'}
          </span>
        </div>

        {progress < 100 && !error && (
          <div className="reference-atlas-loading" role="status">
            <strong>Carregando Atlas 3D</strong>
            <span>{progress}%</span>
            <div>
              <i style={{ width: String(progress) + '%' }} />
            </div>
          </div>
        )}

        {error && (
          <div className="reference-atlas-error" role="alert">
            <strong>Atlas 3D indisponível</strong>
            <span>{error}</span>
          </div>
        )}

        <footer className="reference-atlas-caption">
          <span>ANATOMIA HUMANA DE REFERÊNCIA</span>
          <small>Não representa anatomia individual do paciente.</small>
        </footer>
      </div>

      <details className="reference-atlas-source">
        <summary>Fontes do Atlas 3D</summary>
        <span>Human Atlas · BodyParts3D 4.0</span>
        <nav aria-label="Fontes do Atlas 3D">
          <a href={ATLAS_SOURCES.humanAtlas} target="_blank" rel="noreferrer">
            Human Atlas
          </a>
          <a href={ATLAS_SOURCES.bodyParts3d} target="_blank" rel="noreferrer">
            Licença BodyParts3D
          </a>
        </nav>
      </details>
    </section>
  )
}
