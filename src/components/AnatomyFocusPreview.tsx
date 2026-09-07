import { useCallback, useEffect, useState } from 'react'
import type { AtlasContextMode } from '../atlas/model'
import type { AtlasView } from '../atlas/systems'
import type { AtlasSceneAppearance } from './HumanAtlasExplorerScene'
import { HumanAtlasScene } from './HumanAtlasScene'

interface Props {
  conceptId?: string
  label: string
  atlasRef?: string
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

export function AnatomyFocusPreview({
  conceptId,
  label,
  atlasRef,
  eyebrow = 'HUMAN ATLAS · 3D REAL',
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
  const [selectedPartCount, setSelectedPartCount] = useState(0)
  const [contextPartCount, setContextPartCount] = useState(0)
  const [error, setError] = useState('')
  const [view, setView] = useState<AtlasView>('three-quarter')
  const [rotate, setRotate] = useState(false)
  const [reset, setReset] = useState(0)

  useEffect(() => {
    setStatus(conceptId ? 'loading' : 'idle')
    setSourceLabel('')
    setSelectedPartCount(0)
    setContextPartCount(0)
    setError('')
    setView('three-quarter')
    setRotate(false)
    setReset((current) => current + 1)
  }, [conceptId, contextMode])

  const ready = useCallback(
    (
      nextLabel: string,
      nextSelectedPartCount: number,
      nextContextPartCount: number,
    ) => {
      setSourceLabel(nextLabel)
      setSelectedPartCount(nextSelectedPartCount)
      setContextPartCount(nextContextPartCount)
      setStatus('ready')
    },
    [],
  )

  const failed = useCallback((message: string) => {
    setError(message)
    setStatus('error')
  }, [])

  const chooseView = (nextView: AtlasView) => {
    setView(nextView)
    setRotate(false)
    setReset((current) => current + 1)
  }

  return (
    <section
      className={[
        'anatomy-focus-preview',
        compact ? 'anatomy-focus-preview-compact' : '',
        appearance === 'patient' ? 'anatomy-focus-preview-patient' : '',
        reviewRequired ? 'anatomy-focus-preview-review' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={conceptId ? `Anatomia 3D real: ${label}` : 'Anatomia 3D ainda não selecionada'}
    >
      <header className="anatomy-focus-preview-header">
        <div>
          <span className="section-kicker">{eyebrow}</span>
          <strong>{conceptId ? label : 'Anatomia ainda não confirmada'}</strong>
          <small>
            {conceptId
              ? `${atlasRef || 'BodyParts3D 4.0 / FMA'} · ${conceptId}`
              : 'Confirme uma estrutura do atlas para carregar a geometria real.'}
          </small>
        </div>

        <div className="anatomy-focus-preview-badges">
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

      <div className="anatomy-focus-preview-stage">
        {conceptId ? (
          <HumanAtlasScene
            conceptId={conceptId}
            contextMode={contextMode}
            view={view}
            rotate={rotate}
            reset={reset}
            appearance={appearance}
            onReady={ready}
            onError={failed}
          />
        ) : (
          <div className="anatomy-focus-preview-empty">
            <span aria-hidden="true">3D</span>
            <strong>Sem referência anatômica</strong>
            <p>
              O MedAtlas não inventa um modelo. A cena só é criada quando existe
              um conceito FMA/BodyParts3D válido.
            </p>
          </div>
        )}

        {conceptId && (
          <div className="anatomy-focus-preview-hud" role="status" aria-live="polite">
            {status === 'ready' ? (
              <>
                <span className="live-dot" aria-hidden="true" />
                <div>
                  <strong>{sourceLabel || label}</strong>
                  <small>
                    {selectedPartCount} foco · {contextPartCount} contexto · modelo de referência
                  </small>
                </div>
              </>
            ) : status === 'error' ? (
              <div>
                <strong>Não foi possível carregar o 3D</strong>
                <small>{error}</small>
              </div>
            ) : (
              <div>
                <strong>Preparando geometria real</strong>
                <small>Carregando somente os chunks necessários.</small>
              </div>
            )}
          </div>
        )}

        {conceptId && (
          <nav
            className="anatomy-focus-preview-controls"
            aria-label={`Controles do 3D de ${label}`}
          >
            {VIEW_OPTIONS.map((option) => (
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
            <button
              type="button"
              className={rotate ? 'active' : ''}
              aria-pressed={rotate}
              aria-label={rotate ? 'Pausar rotação automática' : 'Ativar rotação automática'}
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
                setReset((current) => current + 1)
              }}
            >
              ↺
            </button>
          </nav>
        )}
      </div>

      <footer className="anatomy-focus-preview-footer">
        <p>
          {description ||
            'Geometria real do Human Atlas/BodyParts3D. É anatomia humana de referência, não reconstrução específica do paciente.'}
        </p>
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
