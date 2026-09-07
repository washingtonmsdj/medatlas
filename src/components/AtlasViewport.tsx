import { useCallback, useState } from 'react'
import { HumanAtlasScene } from './HumanAtlasScene'

interface Props {
  selected: string
  conceptId: string
}

export function AtlasViewport({ selected, conceptId }: Props) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [sourceLabel, setSourceLabel] = useState('')
  const [error, setError] = useState('')

  const ready = useCallback((label: string) => {
    setSourceLabel(label)
    setStatus('ready')
  }, [])

  const failed = useCallback((message: string) => {
    setError(message)
    setStatus('error')
  }, [])

  return (
    <section className="atlas-card" aria-label="Atlas anatômico 3D">
      <div className="atlas-toolbar">
        <span className={status === 'error' ? 'live-dot error-dot' : 'live-dot'} />
        <span>Atlas anatômico real</span>
        <span className="atlas-badge">BodyParts3D 4.0 · {conceptId}</span>
      </div>

      <div className="atlas-stage real-stage">
        <HumanAtlasScene
          conceptId={conceptId}
          onReady={ready}
          onError={failed}
        />

        <div className="structure-label real-label">
          <strong>{selected}</strong>
          <span>
            {status === 'ready'
              ? sourceLabel
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
      </div>

      <p className="integration-note">
        Anatomia de referência BodyParts3D. A geometria não representa o corpo individual do paciente.
      </p>
    </section>
  )
}
