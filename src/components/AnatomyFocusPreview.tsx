import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { AtlasContextMode } from '../atlas/model'
import type { AtlasView } from '../atlas/systems'
import { resolveOrganDetail } from '../anatomy-detail/catalog'
import type { AtlasSceneAppearance } from './HumanAtlasExplorerScene'
import { HumanAtlasScene } from './HumanAtlasScene'

const OrganDetailScene = lazy(async () => {
  const module = await import('./OrganDetailScene')
  return { default: module.OrganDetailScene }
})

interface Props {
  conceptId?: string
  label: string
  eyebrow?: string
  description?: string
  contextMode?: AtlasContextMode
  appearance?: AtlasSceneAppearance
  compact?: boolean
  reviewRequired?: boolean
  onOpenAtlas?: () => void
}

const VIEW_OPTIONS: Array<{
  value: AtlasView
  label: string
  short: string
}> = [
  { value: 'three-quarter', label: 'Vista 3/4', short: '3/4' },
  { value: 'front', label: 'Vista frontal', short: 'Frente' },
  { value: 'side', label: 'Vista lateral', short: 'Lado' },
]

type AnatomyLevel = 'body' | 'detail'

export function AnatomyFocusPreview({
  conceptId,
  label,
  eyebrow = 'HUMAN ATLAS 3D',
  description,
  contextMode = 'system',
  appearance = 'clinical',
  compact = false,
  reviewRequired = false,
  onOpenAtlas,
}: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    conceptId ? 'loading' : 'idle',
  )
  const [sourceLabel, setSourceLabel] = useState('')
  const [view, setView] = useState<AtlasView>('three-quarter')
  const [rotate, setRotate] = useState(false)
  const [section, setSection] = useState(false)
  const [reset, setReset] = useState(0)
  const [sceneAttempt, setSceneAttempt] = useState(0)
  const [level, setLevel] = useState<AnatomyLevel>('body')

  const organDetail = useMemo(
    () => resolveOrganDetail(conceptId, label),
    [conceptId, label],
  )
  const detailActive = level === 'detail' && Boolean(organDetail)

  useEffect(() => {
    setStatus(conceptId ? 'loading' : 'idle')
    setSourceLabel('')
    setView('three-quarter')
    setRotate(false)
    setSection(false)
    setLevel('body')
    setReset((current) => current + 1)
  }, [conceptId, contextMode])

  const ready = useCallback((nextLabel: string) => {
    setSourceLabel(nextLabel)
    setStatus('ready')
  }, [])

  const failed = useCallback(() => {
    setStatus('error')
  }, [])

  const retryScene = () => {
    setStatus('loading')
    setSourceLabel('')
    setRotate(false)
    setSection(false)
    setSceneAttempt((current) => current + 1)
    setReset((current) => current + 1)
  }

  const chooseView = (nextView: AtlasView) => {
    setView(nextView)
    setRotate(false)
    setReset((current) => current + 1)
  }

  const chooseLevel = (nextLevel: AnatomyLevel) => {
    if (nextLevel === 'detail' && !organDetail) return
    setLevel(nextLevel)
    setStatus('loading')
    setSourceLabel('')
    setRotate(false)
    setSection(false)
    setReset((current) => current + 1)
  }

  return (
    <section
      className={[
        'anatomy-focus-preview',
        compact ? 'anatomy-focus-preview-compact' : '',
        appearance === 'patient' ? 'anatomy-focus-preview-patient' : '',
        reviewRequired ? 'anatomy-focus-preview-review' : '',
        detailActive ? 'anatomy-focus-preview-detail-active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={
        conceptId
          ? `Anatomia 3D: ${label}`
          : 'Anatomia 3D ainda não selecionada'
      }
    >
      <header className="anatomy-focus-preview-header">
        <div>
          <span className="section-kicker">{eyebrow}</span>
          <strong>{conceptId ? label : 'Anatomia ainda não confirmada'}</strong>
          <small>
            {conceptId
              ? detailActive
                ? appearance === 'patient'
                  ? 'Detalhe anatômico de referência'
                  : 'Detalhe anatômico complementar'
                : appearance === 'patient'
                  ? 'Referência visual do relatório'
                  : 'Anatomia de referência'
              : 'Selecione uma estrutura para visualizar em 3D.'}
          </small>
        </div>

        <div className="anatomy-focus-preview-badges">
          {organDetail && (
            <span className="has-detail">
              detalhe disponível
            </span>
          )}
          <span className={status === 'ready' ? 'is-live' : ''}>
            {status === 'ready'
              ? '3D carregado'
              : status === 'error'
                ? '3D indisponível'
                : conceptId
                  ? 'carregando'
                  : 'aguardando'}
          </span>
          {reviewRequired && <span className="needs-review">reconfirmar</span>}
        </div>
      </header>

      {conceptId && reviewRequired && (
        <div
          className="anatomy-focus-preview-review-banner"
          role="status"
          aria-live="polite"
        >
          <span aria-hidden="true">!</span>
          <div>
            <strong>Confirme novamente a anatomia</strong>
            <small>O texto do relatório foi alterado.</small>
          </div>
        </div>
      )}

      <div className="anatomy-focus-preview-stage">
        {conceptId && organDetail && (
          <nav
            className="anatomy-focus-level-switch"
            aria-label="Nível de detalhe anatômico"
          >
            <button
              type="button"
              className={level === 'body' ? 'active' : ''}
              aria-pressed={level === 'body'}
              onClick={() => chooseLevel('body')}
            >
              <span>Corpo</span>
              <small>contexto completo</small>
            </button>
            <button
              type="button"
              className={detailActive ? 'active' : ''}
              aria-pressed={detailActive}
              onClick={() => chooseLevel('detail')}
            >
              <span>Órgão em detalhe</span>
              <small>{organDetail.label}</small>
            </button>
          </nav>
        )}

        {detailActive && organDetail && (
          <div
            className="anatomy-detail-breadcrumb"
            aria-label="Contexto do detalhe anatômico"
          >
            <span>Corpo completo</span>
            <b aria-hidden="true">›</b>
            <strong>{organDetail.label}</strong>
            <em>modelo detalhado</em>
          </div>
        )}

        {conceptId ? (
          detailActive && organDetail ? (
            <Suspense
              fallback={
                <div
                  className="focused-reference-loading renderer-module-loading"
                  role="status"
                  aria-live="polite"
                >
                  <div className="focused-reference-loading-card">
                    <span
                      className="focused-reference-loader"
                      aria-hidden="true"
                    />
                    <div>
                      <strong>Carregando detalhe 3D</strong>
                      <small>Preparando {organDetail.label}.</small>
                    </div>
                  </div>
                </div>
              }
            >
              <OrganDetailScene
                key={`${organDetail.id}-${sceneAttempt}`}
                organ={organDetail}
                appearance={appearance}
                rotate={rotate}
                section={section}
                reset={reset}
                onReady={ready}
                onError={failed}
              />
            </Suspense>
          ) : (
            <HumanAtlasScene
              key={`${conceptId}-${contextMode}-${sceneAttempt}`}
              conceptId={conceptId}
              contextMode={contextMode}
              view={view}
              rotate={rotate}
              reset={reset}
              appearance={appearance}
              onReady={ready}
              onError={failed}
            />
          )
        ) : (
          <div className="anatomy-focus-preview-empty">
            <span aria-hidden="true">3D</span>
            <strong>Nenhuma estrutura selecionada</strong>
            <p>Escolha uma estrutura para abrir a anatomia 3D.</p>
          </div>
        )}

        {conceptId && (
          <div
            className={
              status === 'error'
                ? 'anatomy-focus-preview-hud has-error'
                : 'anatomy-focus-preview-hud'
            }
            role="status"
            aria-live="polite"
          >
            {status === 'ready' ? (
              <>
                <span className="live-dot" aria-hidden="true" />
                <div>
                  <strong>{sourceLabel || label}</strong>
                  <small>
                    {detailActive
                      ? 'Detalhe anatômico complementar'
                      : 'Anatomia humana de referência'}
                  </small>
                </div>
              </>
            ) : status === 'error' ? (
              <div>
                <strong>3D indisponível</strong>
                <small>Tente novamente.</small>
                <button
                  className="atlas-retry-button"
                  type="button"
                  onClick={retryScene}
                >
                  Tentar novamente
                </button>
              </div>
            ) : (
              <div>
                <strong>
                  {detailActive
                    ? 'Carregando detalhe anatômico'
                    : 'Carregando anatomia 3D'}
                </strong>
                <small>Preparando visualização.</small>
              </div>
            )}
          </div>
        )}

        {conceptId && (
          <nav
            className="anatomy-focus-preview-controls"
            aria-label={`Controles do 3D de ${label}`}
          >
            {!detailActive &&
              VIEW_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={view === option.value ? 'active' : ''}
                  aria-pressed={view === option.value}
                  aria-label={option.label}
                  onClick={() => chooseView(option.value)}
                >
                  {option.short}
                </button>
              ))}
            {detailActive && (
              <button
                type="button"
                className={section ? 'active' : ''}
                aria-pressed={section}
                aria-label={
                  section
                    ? 'Desativar corte do órgão'
                    : 'Ativar corte do órgão'
                }
                onClick={() => {
                  setSection((current) => !current)
                  setRotate(false)
                }}
              >
                Corte
              </button>
            )}
            <button
              type="button"
              className={rotate ? 'active' : ''}
              aria-pressed={rotate}
              aria-label={
                rotate
                  ? 'Pausar rotação automática'
                  : 'Ativar rotação automática'
              }
              onClick={() => setRotate((current) => !current)}
            >
              ↻
            </button>
            <button
              type="button"
              aria-label="Redefinir visualização 3D"
              onClick={() => {
                setView('three-quarter')
                setRotate(false)
                setSection(false)
                setReset((current) => current + 1)
              }}
            >
              ↺
            </button>
          </nav>
        )}
      </div>

      <footer className="anatomy-focus-preview-footer">
        <div className="anatomy-focus-preview-footer-copy">
          <p>{description || 'Anatomia humana de referência.'}</p>
          {conceptId && status === 'ready' && (
            <span className="anatomy-focus-preview-interaction-hint">
              <b>INTERATIVO</b>
              {detailActive
                ? 'Arraste para girar · role para aproximar · use corte para explorar'
                : 'Arraste para girar · clique para identificar'}
            </span>
          )}
          {detailActive && appearance === 'patient' && (
            <span className="anatomy-detail-safety-note">
              O modelo detalhado é uma referência anatômica e não representa o
              corpo individual do paciente.
            </span>
          )}
        </div>
        {onOpenAtlas && (
          <button type="button" onClick={onOpenAtlas}>
            Abrir Atlas completo
            <span aria-hidden="true">→</span>
          </button>
        )}
      </footer>
    </section>
  )
}
