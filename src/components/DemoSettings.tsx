import { useState } from 'react'
import { AttributionNotice } from './AttributionNotice'
import {
  clearDemoShares,
  demoRepositoryDescriptor,
  getStoredDemoShareCount,
} from '../data/demo-clinical-repository'
import { DEMO_ORGANIZATION_BRANDING } from '../organization/demo-organization'
import { demoShareTtlLabel } from '../product/constraints'

interface Props {
  onNewReport: () => void
}

export function DemoSettings({ onNewReport }: Props) {
  const [shareCount, setShareCount] = useState(() =>
    getStoredDemoShareCount(),
  )
  const [message, setMessage] = useState('')

  const clear = () => {
    const removed = clearDemoShares()
    setShareCount(0)
    setMessage(
      removed > 0
        ? `${removed} link(s) local(is) removido(s).`
        : 'Não havia links locais armazenados.',
    )
  }

  return (
    <section className="settings-module settings-module-v2 module-v3">
      <div className="settings-hero settings-hero-v2 workspace-hero-v3">
        <div className="module-hero-copy">
          <span className="section-kicker">CONFIGURAÇÕES · AMBIENTE DEMO</span>
          <h2>Ambiente sintético e controles locais</h2>
          <p>
            Este painel é um inventário do que está realmente ativo. Recursos
            dependentes de produção aparecem como indisponíveis, sem botões
            falsos nem estados simulados.
          </p>
        </div>

        <div className="environment-badge workspace-hero-badge">
          <i aria-hidden="true" />
          <span>
            <strong>Modo demonstração</strong>
            <small>{demoRepositoryDescriptor.label}</small>
          </span>
        </div>
      </div>

      <section className="settings-status-strip" aria-label="Estado do ambiente">
        <span className="active">
          <i aria-hidden="true">✓</i>
          Dados sintéticos
        </span>
        <span className="active">
          <i aria-hidden="true">✓</i>
          Atlas local
        </span>
        <span>
          <i aria-hidden="true">—</i>
          Backend adiado
        </span>
        <span>
          <i aria-hidden="true">—</i>
          IA remota desativada
        </span>
      </section>

      <div className="settings-grid settings-grid-v2 settings-grid-v3">
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
              <span className="label">BRANDING DA CLÍNICA</span>
              <strong>{DEMO_ORGANIZATION_BRANDING.brandName}</strong>
            </div>
          </div>
          <p>
            Identidade demonstrativa centralizada no contrato de organização.
          </p>
          <div className="settings-branding-preview">
            <span>
              <i
                aria-hidden="true"
                style={{
                  background: DEMO_ORGANIZATION_BRANDING.primaryColorHex,
                }}
              />
              Cor primária
            </span>
            <code>{DEMO_ORGANIZATION_BRANDING.primaryColorHex}</code>
          </div>
          <button
            type="button"
            disabled
            title="Disponível somente após autenticação e backend de produção"
          >
            Editar identidade visual
          </button>
        </article>

        <article>
          <div className="settings-card-heading">
            <span className="settings-icon safe" aria-hidden="true">S</span>
            <div>
              <span className="label">MODO DE DADOS</span>
              <strong>Somente fictícios</strong>
            </div>
          </div>
          <p>
            {demoRepositoryDescriptor.label}. Dados reais de pacientes
            continuam proibidos neste MVP.
          </p>
          <span className="settings-card-state enabled">ativo e fail-closed</span>
        </article>

        <article>
          <div className="settings-card-heading">
            <span className="settings-icon links" aria-hidden="true">L</span>
            <div>
              <span className="label">LINKS LOCAIS</span>
              <strong>{shareCount}</strong>
            </div>
          </div>
          <p>
            Relatórios temporários deste navegador. Cada link expira
            automaticamente em {demoShareTtlLabel()}.
          </p>
          <button type="button" onClick={clear}>
            Limpar dados locais da demonstração
          </button>
          {message && (
            <small className="settings-message" role="status" aria-live="polite">
              {message}
            </small>
          )}
        </article>

        <article>
          <div className="settings-card-heading">
            <span className="settings-icon locked" aria-hidden="true">B</span>
            <div>
              <span className="label">BACKEND</span>
              <strong>Adiado</strong>
            </div>
          </div>
          <p>
            Persistência clínica e autenticação só entram após validação do
            ambiente dedicado e dos testes de isolamento por organização.
          </p>
          <span className="settings-card-state blocked">não conectado</span>
        </article>

        <article>
          <div className="settings-card-heading">
            <span className="settings-icon locked" aria-hidden="true">IA</span>
            <div>
              <span className="label">IA REMOTA</span>
              <strong>Desativada</strong>
            </div>
          </div>
          <p>
            Schema, validador e review gate existem, mas nenhum provedor remoto
            recebe conteúdo no navegador atual.
          </p>
          <span className="settings-card-state blocked">provider disabled</span>
        </article>
      </div>

      <section className="settings-governance settings-governance-v3">
        <div>
          <span className="section-kicker">ATRIBUIÇÃO E GOVERNANÇA</span>
          <strong>Dependências anatômicas permanecem explícitas</strong>
          <p>
            Licenças e proveniência fazem parte do produto e não ficam
            escondidas atrás da apresentação visual.
          </p>
        </div>
        <AttributionNotice />
      </section>

      <div className="settings-actions settings-actions-v2 module-action-bar-v3">
        <div>
          <strong>Reiniciar contexto clínico</strong>
          <span>
            Cria um relatório vazio sem preservar os dados do relatório atual.
          </span>
        </div>
        <button className="primary" type="button" onClick={onNewReport}>
          Iniciar novo relatório vazio
        </button>
      </div>
    </section>
  )
}
