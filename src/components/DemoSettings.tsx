import { useState } from 'react'
import { AttributionNotice } from './AttributionNotice'
import {
  clearDemoShares,
  getStoredDemoShareCount,
} from '../data/demo-clinical-repository'
import { organizationRuntime } from '../organization/runtime'
import { demoShareTtlLabel } from '../product/constraints'
import { WorkspacePageHeader } from './WorkspacePageHeader'

interface Props {
  onNewReport: () => void
  onSharesCleared: () => void
}

export function DemoSettings({
  onNewReport,
  onSharesCleared,
}: Props) {
  const [shareCount, setShareCount] = useState(() => getStoredDemoShareCount())
  const [message, setMessage] = useState('')
  const branding = organizationRuntime.branding

  const clear = () => {
    const removed = clearDemoShares()
    onSharesCleared()
    setShareCount(0)
    setMessage(
      removed > 0
        ? `${removed} link(s) removido(s).`
        : 'Nenhum link para remover.',
    )
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
          <button type="button" disabled>
            Editar identidade
          </button>
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
            <small className="settings-message" role="status">
              {message}
            </small>
          )}
        </article>
      </div>

      <details className="settings-attribution-details">
        <summary>Licenças e atribuições do Atlas</summary>
        <AttributionNotice />
      </details>

      <div className="settings-actions">
        <div>
          <strong>Novo relatório</strong>
          <span>Inicie um novo fluxo clínico visual.</span>
        </div>
        <button className="primary" type="button" onClick={onNewReport}>
          Criar relatório
        </button>
      </div>
    </section>
  )
}
