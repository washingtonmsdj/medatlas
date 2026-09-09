import { useState } from 'react'
import { AttributionNotice } from './AttributionNotice'
import {
  clearDemoShares,
  getStoredDemoShareCount,
} from '../data/demo-clinical-repository'
import { DEMO_ORGANIZATION_BRANDING } from '../organization/demo-organization'
import { demoShareTtlLabel } from '../product/constraints'
import { WorkspacePageHeader } from './WorkspacePageHeader'

interface Props {
  onNewReport: () => void
}

export function DemoSettings({ onNewReport }: Props) {
  const [shareCount, setShareCount] = useState(() => getStoredDemoShareCount())
  const [message, setMessage] = useState('')

  const clear = () => {
    const removed = clearDemoShares()
    setShareCount(0)
    setMessage(
      removed > 0
        ? `${removed} link(s) removido(s).`
        : 'Nenhum link para remover.',
    )
  }

  return (
    <section className="module-v3 mvp-surface">
      <WorkspacePageHeader
        eyebrow="CONFIGURAÇÕES"
        title="Configurações"
        description="Preferências da clínica, privacidade e links compartilhados."
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

      <div className="settings-grid settings-grid-v2 settings-grid-v3 mvp-settings-grid">
        <article className="settings-branding-card">
          <div className="settings-card-heading">
            <span
              className="settings-icon branding"
              aria-hidden="true"
              style={{ background: DEMO_ORGANIZATION_BRANDING.primaryColorHex }}
            >
              {DEMO_ORGANIZATION_BRANDING.markText}
            </span>
            <div>
              <span className="label">CLÍNICA</span>
              <strong>{DEMO_ORGANIZATION_BRANDING.brandName}</strong>
            </div>
          </div>
          <p>Identidade usada na visão do paciente.</p>
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
          <p>Nenhum dado real deve ser usado nesta versão.</p>
          <span className="settings-card-state enabled">ativo</span>
        </article>

        <article>
          <div className="settings-card-heading">
            <span className="settings-icon links" aria-hidden="true">
              L
            </span>
            <div>
              <span className="label">LINKS</span>
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

      <details className="mvp-technical-details">
        <summary>Licenças e atribuições do Atlas</summary>
        <AttributionNotice />
      </details>

      <div className="settings-actions settings-actions-v2 module-action-bar-v3">
        <div>
          <strong>Novo relatório</strong>
          <span>Reinicia o fluxo atual.</span>
        </div>
        <button className="primary" type="button" onClick={onNewReport}>
          Criar relatório
        </button>
      </div>
    </section>
  )
}
