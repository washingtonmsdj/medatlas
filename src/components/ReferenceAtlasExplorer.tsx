import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
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
import { resolveOrganDetail } from '../anatomy-detail/catalog'
import type { VisualReport } from '../domain/types'

const HumanAtlasExplorerScene = lazy(async () => {
  const module = await import('./HumanAtlasExplorerScene')
  return { default: module.HumanAtlasExplorerScene }
})

const OrganDetailScene = lazy(async () => {
  const module = await import('./OrganDetailScene')
  return { default: module.OrganDetailScene }
})

interface Props {
  initialConceptId?: string
  report: VisualReport
  onConfirmConcept: (concept: AtlasConcept) => void
  onOpenReport: () => void
  onOpenPatientPreview: () => void
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
  { id: 'front', label: 'Vista frontal', short: 'Frente' },
  { id: 'three-quarter', label: 'Vista 3/4', short: '3/4' },
  { id: 'side', label: 'Vista lateral', short: 'Lado' },
  { id: 'back', label: 'Vista posterior', short: 'Costas' },
]

function initialState(): AtlasExplorerSceneState {
  return {
    explode: 0,
    visible: DEFAULT_VISIBLE_SYSTEMS,
    selected: [],
    isolate: false,
    view: 'front',
    rotate: false,
    section: false,
    reset: 0,
    zoomStep: 0,
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

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return (
    (parts[0]?.[0] ?? 'P') +
    (parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '')
  ).toUpperCase()
}

function reportStatusLabel(report: VisualReport) {
  if (report.status === 'published') return 'Publicado'
  if (
    report.finding.anatomyReviewRequired ||
    report.finding.explanationReviewRequired
  ) {
    return 'Revisão pendente'
  }
  return 'Revisão clínica'
}

function organSummary(label: string) {
  const normalized = label.toLocaleLowerCase('pt-BR')
  if (normalized.includes('coração')) {
    return 'Estrutura muscular central do sistema cardiovascular. O modelo detalhado permite explorar forma externa, câmaras e grandes vasos como referência anatômica.'
  }
  if (normalized.includes('rim')) {
    return 'Órgão do sistema urinário responsável por funções essenciais de filtração e equilíbrio do organismo. O detalhe 3D complementa a orientação no corpo completo.'
  }
  if (normalized.includes('fígado')) {
    return 'Órgão abdominal de grande volume ligado a funções metabólicas e digestivas. O detalhe 3D complementa a localização confirmada no Human Atlas.'
  }
  if (normalized.includes('cérebro')) {
    return 'Estrutura principal do sistema nervoso central. O modelo detalhado é uma referência anatômica complementar ao contexto do corpo completo.'
  }
  return 'Modelo anatômico detalhado usado como referência visual complementar. A estrutura confirmada e a fonte clínica continuam sendo o Human Atlas / BodyParts3D.'
}

export function ReferenceAtlasExplorer({
  initialConceptId,
  report,
  onConfirmConcept,
  onOpenReport,
  onOpenPatientPreview,
}: Props) {
  const [atlas, setAtlas] = useState<HumanAtlas | null>(null)
  const [state, setState] = useState<AtlasExplorerSceneState>(initialState)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [query, setQuery] = useState('')
  const [chosen, setChosen] = useState<AtlasConcept | null>(null)
  const [focusMode, setFocusMode] = useState<'body' | 'detail'>('body')
  const [detailTab, setDetailTab] = useState<
    'info' | 'context' | 'notes' | 'references'
  >('info')
  const [detailRotate, setDetailRotate] = useState(false)
  const [detailSection, setDetailSection] = useState(false)
  const [detailReset, setDetailReset] = useState(0)
  const [caseTab, setCaseTab] = useState<'summary' | 'exams' | 'history' | 'files'>(
    'summary',
  )
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let active = true
    setError('')
    setProgress(0)

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
          // Atlas remains usable when a stored concept is unavailable.
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
  }, [initialConceptId, loadAttempt])

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
    () => (atlas ? searchAtlasConcepts(atlas, query, 24) : []),
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

  const chosenDetail = useMemo(
    () =>
      chosen
        ? resolveOrganDetail(chosen.id, conceptDisplayName(chosen))
        : null,
    [chosen],
  )

  const bodyLabel = chosen
    ? conceptDisplayName(chosen)
    : report.finding.anatomicalStructure

  const selectedMatchesReport =
    Boolean(chosen) && chosen?.id === report.finding.atlasConceptId

  const sourceHighlights = useMemo(() => {
    return report.finding.sourceText
      .split(/[.!?]\s+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 4)
  }, [report.finding.sourceText])

  const chooseConcept = (concept: AtlasConcept) => {
    setChosen(concept)
    setFocusMode(resolveOrganDetail(concept.id, conceptDisplayName(concept)) ? 'detail' : 'body')
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
      setFocusMode(resolveOrganDetail(concept.id, conceptDisplayName(concept)) ? 'detail' : 'body')
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
    setState((current) => ({
      ...current,
      isolate: false,
      visible: current.visible.includes(systemId)
        ? current.visible.filter((id) => id !== systemId)
        : [...current.visible, systemId],
    }))
  }

  const showOnlySystem = (systemId: AtlasSystemId) => {
    setState((current) => ({
      ...current,
      isolate: false,
      visible: [systemId],
      explode: 0,
      reset: current.reset + 1,
    }))
  }

  const showPreset = (visible: AtlasSystemId[], view: AtlasView = 'front') => {
    setFocusMode('body')
    setState((current) => ({
      ...current,
      isolate: false,
      visible,
      explode: 0,
      rotate: false,
      section: false,
      view,
      zoomStep: 0,
      reset: current.reset + 1,
    }))
  }

  const chooseHeart = () => {
    if (!atlas) return
    try {
      chooseConcept(findAtlasConcept(atlas, 'FMA7088'))
    } catch {
      // Curated catalog gate guarantees FMA7088 in normal builds.
    }
  }

  const reset = () => {
    setFocusMode('body')
    setQuery('')
    setDetailRotate(false)
    setDetailSection(false)
    setChosen(null)
    setState((current) => ({
      ...initialState(),
      reset: current.reset + 1,
    }))
  }

  const retryAtlas = () => {
    setError('')
    setProgress(0)
    setAtlas(null)
    setLoadAttempt((current) => current + 1)
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

  const detailAvailable = Boolean(chosenDetail)

  return (
    <section
      className="atlas-v3-workspace"
      aria-label="Atlas 3D clínico MedAtlas"
      data-concept-layout="clinical-atlas-v3"
    >
      <aside className="atlas-v3-case-panel" aria-label="Resumo clínico atual">
        <header className="atlas-v3-patient-heading">
          <span className="atlas-v3-patient-avatar">
            {initials(report.patient.displayName)}
          </span>
          <div>
            <strong>{report.patient.displayName}</strong>
            <small>
              {report.patient.age} anos · {report.patient.id}
            </small>
          </div>
          <span className="atlas-v3-patient-more" aria-hidden="true">
            ⋮
          </span>
        </header>

        <nav className="atlas-v3-case-tabs" aria-label="Seções do caso">
          {[
            ['summary', 'Resumo'],
            ['exams', 'Exames'],
            ['history', 'Histórico'],
            ['files', 'Arquivos'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={caseTab === id ? 'active' : ''}
              aria-pressed={caseTab === id}
              onClick={() =>
                setCaseTab(id as 'summary' | 'exams' | 'history' | 'files')
              }
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="atlas-v3-case-scroll">
          {caseTab === 'summary' && (
            <section>
              <div className="atlas-v3-section-title">
                <strong>Resumo do exame</strong>
                <span>{reportStatusLabel(report)}</span>
              </div>
              <small className="atlas-v3-report-title">{report.title}</small>
              <p>{report.finding.sourceText || 'Nenhum texto clínico informado.'}</p>
            </section>
          )}

          {caseTab === 'exams' && (
            <section className="atlas-v3-case-tab-content">
              <span className="atlas-v3-label">Exame atual</span>
              <strong>{report.title}</strong>
              <p>{report.finding.sourceText || 'Sem descrição clínica disponível.'}</p>
              <small>{reportStatusLabel(report)}</small>
            </section>
          )}

          {caseTab === 'history' && (
            <section className="atlas-v3-case-tab-content">
              <span className="atlas-v3-label">Histórico deste fluxo</span>
              <strong>{report.patient.displayName}</strong>
              <p>
                O relatório atual está em {reportStatusLabel(report).toLocaleLowerCase('pt-BR')}.
                Alterações no texto ou na anatomia exigem nova revisão antes da publicação.
              </p>
            </section>
          )}

          {caseTab === 'files' && (
            <section className="atlas-v3-case-tab-content">
              <span className="atlas-v3-label">Arquivos do caso</span>
              <strong>Fonte clínica atual</strong>
              <p>
                O conteúdo desta demonstração está vinculado ao relatório visual atual.
                Nenhum arquivo adicional foi anexado.
              </p>
            </section>
          )}

          <section>
            <span className="atlas-v3-label">Estrutura confirmada</span>
            <button
              type="button"
              className="atlas-v3-structure-card"
              onClick={() => setFocusMode(detailAvailable ? 'detail' : 'body')}
            >
              <span aria-hidden="true">◉</span>
              <div>
                <strong>{bodyLabel}</strong>
                <small>{selectedSystem?.name ?? 'Human Atlas 3D'}</small>
              </div>
              <b aria-hidden="true">›</b>
            </button>
          </section>

          <section>
            <span className="atlas-v3-label">Achados principais</span>
            <div className="atlas-v3-findings">
              {(sourceHighlights.length > 0
                ? sourceHighlights
                : ['Aguardando conteúdo clínico.']
              ).map((item) => (
                <p key={item}>
                  <i aria-hidden="true" />
                  {item}
                </p>
              ))}
            </div>
          </section>

          <section>
            <span className="atlas-v3-label">Estado</span>
            <div className="atlas-v3-tags">
              <span className="blue">
                {report.finding.atlasConceptId ? 'Anatomia confirmada' : 'Selecionar anatomia'}
              </span>
              {selectedSystem && <span className="rose">{selectedSystem.name}</span>}
              <span className="green">{reportStatusLabel(report)}</span>
            </div>
          </section>

          <button
            className="atlas-v3-primary-action"
            type="button"
            onClick={() => {
              if (chosen) {
                onConfirmConcept(chosen)
                setFocusMode(detailAvailable ? 'detail' : 'body')
              } else {
                searchRef.current?.focus()
              }
            }}
          >
            {chosen ? 'Usar estrutura no relatório' : 'Buscar estrutura anatômica'}
            <span aria-hidden="true">→</span>
          </button>

          <div className="atlas-v3-secondary-actions">
            <button type="button" onClick={onOpenReport}>Gerar relatório</button>
            <button type="button" onClick={onOpenPatientPreview}>Compartilhar</button>
          </div>

          <div
            className={
              report.finding.anatomyReviewRequired ||
              report.finding.explanationReviewRequired
                ? 'atlas-v3-review-banner pending'
                : 'atlas-v3-review-banner'
            }
          >
            <span aria-hidden="true">
              {report.finding.anatomyReviewRequired ||
              report.finding.explanationReviewRequired
                ? '!'
                : '✓'}
            </span>
            <div>
              <strong>
                {report.finding.anatomyReviewRequired ||
                report.finding.explanationReviewRequired
                  ? 'Revisão clínica obrigatória'
                  : 'Revisão clínica registrada'}
              </strong>
              <small>
                O conteúdo visual complementa, mas não substitui a avaliação profissional.
              </small>
            </div>
          </div>
        </div>
      </aside>

      <main className="atlas-v3-body-panel">
        <div className="atlas-v3-depth-switch" aria-label="Nível anatômico">
          <button
            type="button"
            className={focusMode === 'body' ? 'active' : ''}
            aria-pressed={focusMode === 'body'}
            onClick={() => setFocusMode('body')}
          >
            Corpo
          </button>
          <button
            type="button"
            className={focusMode === 'detail' ? 'active' : ''}
            aria-pressed={focusMode === 'detail'}
            disabled={!detailAvailable}
            onClick={() => detailAvailable && setFocusMode('detail')}
          >
            Órgão em detalhe
          </button>
        </div>

        <div className="atlas-v3-search">
          <span aria-hidden="true">⌕</span>
          <input
            ref={searchRef}
            id="reference-atlas-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar estrutura no corpo..."
            aria-label="Buscar no corpo"
          />
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

        <aside className="atlas-v3-systems" aria-label="Sistemas anatômicos">
          <header>
            <strong>Sistemas</strong>
            <span>{state.visible.length}</span>
          </header>
          <div>
            {activeSystems.map((system) => {
              const enabled = state.visible.includes(system.id)
              return (
                <button
                  type="button"
                  className={enabled ? 'active' : ''}
                  key={system.id}
                  aria-pressed={enabled}
                  onClick={() => toggleSystem(system.id)}
                  onDoubleClick={() => showOnlySystem(system.id)}
                >
                  <i style={{ background: system.color }} />
                  <span>{system.name}</span>
                </button>
              )
            })}
          </div>
        </aside>

        <nav className="atlas-v3-body-tools" aria-label="Ferramentas do corpo 3D">
          <button
            type="button"
            aria-label="Aproximar visualização"
            onClick={() =>
              setState((current) => ({
                ...current,
                zoomStep: Math.min(8, (current.zoomStep ?? 0) + 1),
              }))
            }
          >
            +
          </button>
          <button
            type="button"
            aria-label="Afastar visualização"
            onClick={() =>
              setState((current) => ({
                ...current,
                zoomStep: Math.max(-5, (current.zoomStep ?? 0) - 1),
              }))
            }
          >
            −
          </button>
          <button
            type="button"
            aria-label={state.rotate ? 'Pausar rotação automática' : 'Ativar rotação automática'}
            aria-pressed={state.rotate}
            className={state.rotate ? 'active' : ''}
            onClick={() =>
              setState((current) => ({ ...current, rotate: !current.rotate }))
            }
          >
            ↻
          </button>
          <button
            type="button"
            aria-label={state.section ? 'Desativar corte anatômico' : 'Ativar corte anatômico'}
            aria-pressed={state.section}
            className={state.section ? 'active' : ''}
            onClick={() =>
              setState((current) => ({
                ...current,
                section: !current.section,
                rotate: false,
              }))
            }
          >
            ◈
          </button>
          <button type="button" aria-label="Redefinir Atlas 3D" onClick={reset}>
            ⌖
          </button>
        </nav>

        <div className="atlas-v3-body-stage">
          {atlas && (
            <Suspense
              fallback={
                <div className="atlas-v3-loading" role="status" aria-live="polite">
                  <span className="focused-reference-loader" aria-hidden="true" />
                  <strong>Carregando corpo 3D</strong>
                </div>
              }
            >
              <HumanAtlasExplorerScene
                key={loadAttempt}
                atlas={atlas}
                state={state}
                onSelect={choosePart}
                onProgress={onProgress}
                onError={onError}
                appearance="explorer"
              />
            </Suspense>
          )}

          {!atlas && !error && (
            <div className="atlas-v3-loading" role="status" aria-live="polite">
              <span className="focused-reference-loader" aria-hidden="true" />
              <strong>Preparando Human Atlas</strong>
            </div>
          )}

          {error && (
            <div className="atlas-v3-error" role="alert">
              <strong>3D indisponível</strong>
              <p>{error}</p>
              <button className="atlas-retry-button" type="button" onClick={retryAtlas}>
                Tentar novamente
              </button>
            </div>
          )}

          {chosen && (
            <button
              type="button"
              className="atlas-v3-body-callout"
              onClick={() => detailAvailable && setFocusMode('detail')}
            >
              <strong>{conceptDisplayName(chosen)}</strong>
              <small>
                {detailAvailable
                  ? 'Clique para ver o modelo detalhado'
                  : selectedSystem?.name ?? 'Estrutura selecionada'}
              </small>
            </button>
          )}

          <div className="atlas-v3-orientation" aria-hidden="true">
            <span>S</span>
            <b>D ◇ E</b>
            <span>I</span>
          </div>

          <div className="atlas-v3-view-toggle">
            {VIEW_OPTIONS.slice(0, 2).map((option) => (
              <button
                type="button"
                key={option.id}
                className={state.view === option.id ? 'active' : ''}
                aria-pressed={state.view === option.id}
                onClick={() => setView(option.id)}
              >
                {option.short}
              </button>
            ))}
          </div>
        </div>

        <nav className="atlas-v3-presets" aria-label="Atalhos do Atlas 3D">
          <button
            type="button"
            className="active"
            onClick={() => showPreset(DEFAULT_VISIBLE_SYSTEMS, 'front')}
          >
            <span className="mini-body" aria-hidden="true">♙</span>
            <small>Corpo completo</small>
          </button>
          <button type="button" onClick={() => showPreset(DEFAULT_VISIBLE_SYSTEMS)}>
            <span aria-hidden="true">◎</span>
            <small>Sistemas</small>
          </button>
          <button
            type="button"
            onClick={() => showPreset(['cardiac', 'respiratory', 'skeletal'])}
          >
            <span aria-hidden="true">◫</span>
            <small>Tórax</small>
          </button>
          <button type="button" onClick={chooseHeart}>
            <span aria-hidden="true">♥</span>
            <small>Coração</small>
          </button>
          <button type="button" onClick={() => showPreset(ORGAN_SYSTEMS)}>
            <span aria-hidden="true">◉</span>
            <small>Órgãos</small>
          </button>
          <button type="button" onClick={() => showPreset(['skeletal'])}>
            <span aria-hidden="true">♧</span>
            <small>Esqueleto</small>
          </button>
        </nav>

        <div className="atlas-v3-progress" aria-live="polite">
          <i style={{ width: `${Math.max(4, progress)}%` }} />
          <span>{progress >= 100 ? 'Atlas pronto' : `Carregando ${Math.round(progress)}%`}</span>
        </div>
      </main>

      <aside
        className={
          focusMode === 'detail' && detailAvailable
            ? 'atlas-v3-detail-panel active'
            : 'atlas-v3-detail-panel'
        }
        aria-label="Detalhe anatômico"
      >
        <header className="atlas-v3-detail-breadcrumb">
          <button type="button" onClick={() => setFocusMode('body')}>
            Corpo completo
          </button>
          <span aria-hidden="true">›</span>
          <strong>{chosen ? conceptDisplayName(chosen) : 'Estrutura'}</strong>
          <span aria-hidden="true">›</span>
          <b>Modelo detalhado</b>
        </header>

        <div className="atlas-v3-detail-heading">
          <span className="atlas-v3-organ-icon" aria-hidden="true">
            {chosenDetail?.id === 'heart' ? '♥' : '◉'}
          </span>
          <div>
            <strong>{chosenDetail?.label ?? bodyLabel}</strong>
            <small>
              {detailAvailable
                ? 'Modelo anatômico detalhado'
                : 'Detalhe indisponível para esta estrutura'}
            </small>
          </div>
          <select
            aria-label="Vista do modelo detalhado"
            value={detailRotate ? 'rotating' : 'anterior'}
            onChange={(event) => setDetailRotate(event.target.value === 'rotating')}
            disabled={!detailAvailable}
          >
            <option value="anterior">Vista anterior</option>
            <option value="rotating">Rotação automática</option>
          </select>
        </div>

        <div className="atlas-v3-organ-stage">
          {chosenDetail ? (
            <Suspense
              fallback={
                <div className="atlas-v3-loading" role="status" aria-live="polite">
                  <span className="focused-reference-loader" aria-hidden="true" />
                  <strong>Carregando modelo detalhado</strong>
                </div>
              }
            >
              <OrganDetailScene
                organ={chosenDetail}
                appearance="explorer"
                rotate={detailRotate}
                section={detailSection}
                reset={detailReset}
                onReady={() => undefined}
                onError={onError}
              />
            </Suspense>
          ) : (
            <div className="atlas-v3-detail-empty">
              <span aria-hidden="true">3D</span>
              <strong>Selecione um órgão compatível</strong>
              <p>
                Coração, cérebro, pulmões, fígado, rins, olho, intestino,
                pâncreas e pele possuem modelos detalhados.
              </p>
            </div>
          )}

          <nav className="atlas-v3-organ-tools" aria-label="Ferramentas do órgão detalhado">
            <button
              type="button"
              aria-label={detailRotate ? 'Pausar rotação do órgão' : 'Girar órgão automaticamente'}
              aria-pressed={detailRotate}
              className={detailRotate ? 'active' : ''}
              disabled={!detailAvailable}
              onClick={() => setDetailRotate((current) => !current)}
            >
              ↻
            </button>
            <button
              type="button"
              aria-label={detailSection ? 'Desativar corte do órgão' : 'Ativar corte do órgão'}
              aria-pressed={detailSection}
              className={detailSection ? 'active' : ''}
              disabled={!detailAvailable}
              onClick={() => {
                setDetailSection((current) => !current)
                setDetailRotate(false)
              }}
            >
              ◫
            </button>
            <button
              type="button"
              aria-label="Redefinir órgão detalhado"
              disabled={!detailAvailable}
              onClick={() => {
                setDetailRotate(false)
                setDetailSection(false)
                setDetailReset((current) => current + 1)
              }}
            >
              ⌖
            </button>
          </nav>
        </div>

        <nav className="atlas-v3-detail-tabs" aria-label="Informações do detalhe">
          {[
            ['info', 'Informações'],
            ['context', 'Contexto anatômico'],
            ['notes', 'Anotações'],
            ['references', 'Referências'],
          ].map(([id, label]) => (
            <button
              type="button"
              key={id}
              className={detailTab === id ? 'active' : ''}
              onClick={() =>
                setDetailTab(
                  id as 'info' | 'context' | 'notes' | 'references',
                )
              }
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="atlas-v3-detail-content">
          {detailTab === 'info' && (
            <>
              <p>{organSummary(chosenDetail?.label ?? bodyLabel)}</p>
              <div className="atlas-v3-detail-metrics">
                <article>
                  <span>Sistema</span>
                  <strong>{selectedSystem?.name ?? 'Anatomia'}</strong>
                  <small>Human Atlas</small>
                </article>
                <article>
                  <span>Referência</span>
                  <strong>{chosen?.id ?? '—'}</strong>
                  <small>FMA confirmado</small>
                </article>
                <article>
                  <span>Modelo</span>
                  <strong>{detailAvailable ? 'Detalhado' : 'Corpo'}</strong>
                  <small>{detailAvailable ? 'GLB local' : 'BodyParts3D'}</small>
                </article>
              </div>
            </>
          )}

          {detailTab === 'context' && (
            <div className="atlas-v3-tab-copy">
              <strong>Contexto no corpo completo</strong>
              <p>
                A seleção permanece vinculada ao Human Atlas. O modelo detalhado
                não altera a estrutura clínica confirmada.
              </p>
              {chosen && (
                <button
                  type="button"
                  onClick={() =>
                    setState((current) => ({
                      ...current,
                      isolate: !current.isolate,
                      reset: current.reset + 1,
                    }))
                  }
                >
                  {state.isolate ? 'Mostrar contexto' : 'Isolar no corpo'}
                </button>
              )}
            </div>
          )}

          {detailTab === 'notes' && (
            <div className="atlas-v3-tab-copy">
              <strong>Anotação clínica</strong>
              <p>
                {selectedMatchesReport
                  ? report.finding.clinicianNote
                  : 'A estrutura selecionada ainda não está vinculada ao relatório atual.'}
              </p>
            </div>
          )}

          {detailTab === 'references' && (
            <div className="atlas-v3-tab-copy">
              <strong>Proveniência anatômica</strong>
              <p>
                Human Atlas / BodyParts3D permanece como fonte de verdade. O
                modelo de órgão é uma visualização suplementar validada e
                vinculada ao contexto anatômico.
              </p>
            </div>
          )}
        </div>

        <section className="atlas-v3-patient-explanation">
          <span aria-hidden="true">✦</span>
          <div>
            <strong>Explicação para o paciente</strong>
            <p>
              {selectedMatchesReport && report.finding.patientExplanation
                ? report.finding.patientExplanation
                : 'Use a estrutura confirmada no relatório para gerar uma explicação simples e revisada pelo profissional.'}
            </p>
            <button type="button" onClick={onOpenPatientPreview}>
              Ver em linguagem simples
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>

        <footer className="atlas-v3-model-quality">
          <span aria-hidden="true">✓</span>
          <div>
            <strong>Qualidade do modelo</strong>
            <small>Modelo anatômico local validado para esta visualização.</small>
          </div>
          <b>HD</b>
        </footer>
      </aside>
    </section>
  )
}
