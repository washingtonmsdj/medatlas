import { useState } from 'react'
import { AttributionNotice } from './AttributionNotice'
import {
  getActivePatientShareCount,
  revokeAllActivePatientShares,
} from '../data/repository'
import { organizationRuntime } from '../organization/runtime'
import { demoShareTtlLabel } from '../product/constraints'
import { WorkspacePageHeader } from './WorkspacePageHeader'

interface Props {
  onSharesCleared: () => void
}

type CleanupMessage =
  | { kind: 'success'; text: string }
  | { kind: 'error'; text: string }
  | null

export function DemoSettings({ onSharesCleared }: Props) {
  const [shareCount, setShareCount] = useState(() =>
    getActivePatientShareCount(),
  )
  const [message, setMessage] = useState<CleanupMessage>(null)
  const branding = organizationRuntime.branding

  const clear = () => {
    setMessage(null)

    try {
      const removed = revokeAllActivePatientShares()
      onSharesCleared()
      setShareCount(0)
      setMessage({
        kind: 'success',
        text:
          removed > 0
            ? `${removed} link(s) removido(s).`
            : 'Nenhum link para remover.',
      })
    } catch (error) {
      setMessage({
        kind: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Não foi possível confirmar a revogação de todos os links ativos.',
      })
    }
  }

  return (
    <section className="workspace-page">
      <WorkspacePageHeader
        eyebrow="CONFIGURAÇÕES"
        title="Configurações do workspace"
        description="Identidade da clínica, dados de demonstração e links ativos."
        className="settings-hero"
        meta={
          <div className="environment-badge workspace-hero-badge">
            <i aria-hidden="true" />
            <span>
              <strong>Ambiente demo</strong>
              <small>somente dados fictícios</small>
            </span>
          </div>
        }
      />

      <div className="settings-grid">
        <article className="settings-branding-card">
          <div className="settings-card-heading">
            <span
              className="settings-icon branding"
              aria-hidden="true"
              style={{ background: branding.primaryColorHex }}
            >
              {branding.markText}
            </span>
            <div>
              <span className="label">CLÍNICA</span>
              <strong>{branding.brandName}</strong>
            </div>
          </div>
          <p>Identidade exibida na experiência do paciente.</p>
          <span className="settings-card-state readonly">
            Somente leitura no demo
          </span>
        </article>

        <article>
          <div className="settings-card-heading">
            <span className="settings-icon safe" aria-hidden="true">
              S
            </span>
            <div>
              <span className="label">DADOS</span>
              <strong>Somente fictícios</strong>
            </div>
          </div>
          <p>Uso de dados reais permanece bloqueado neste ambiente.</p>
          <span className="settings-card-state enabled">ativo</span>
        </article>

        <article>
          <div className="settings-card-heading">
            <span className="settings-icon links" aria-hidden="true">
              L
            </span>
            <div>
              <span className="label">LINKS ATIVOS</span>
              <strong>{shareCount}</strong>
            </div>
          </div>
          <p>Expiram em {demoShareTtlLabel()}.</p>
          <button type="button" onClick={clear}>
            Limpar links
          </button>
          {message && (
            <small
              className={`settings-message ${message.kind}`}
              role={message.kind === 'error' ? 'alert' : 'status'}
            >
              {message.text}
            </small>
          )}
        </article>
      </div>

      <details className="settings-attribution-details">
        <summary>Licenças e atribuições do Atlas</summary>
        <AttributionNotice />
      </details>
    </section>
  )
}