import { useState } from 'react'
import { AttributionNotice } from './AttributionNotice'
import {
  clearDemoShares,
  demoRepositoryDescriptor,
  getStoredDemoShareCount,
} from '../data/demo-clinical-repository'

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
    <section className="settings-module settings-module-v2">
      <div className="settings-hero settings-hero-v2">
        <div className="module-hero-copy">
          <span className="section-kicker">CONFIGURAÇÕES · AMBIENTE DEMO</span>
          <h2>Ambiente sintético e controles locais</h2>
          <p>
            Este painel descreve o que está realmente ativo no MVP. Recursos de
            produção permanecem visivelmente bloqueados em vez de simulados.
          </p>
        </div>

        <div className="environment-badge">
          <i aria-hidden="true" />
          <span>
            <strong>Modo demonstração</strong>
            <small>somente este navegador</small>
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

      <div className="settings-grid settings-grid-v2">
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
            Relatórios temporários neste navegador. Cada link expira
            automaticamente em 30 minutos.
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
            Supabase, autenticação e dados clínicos reais entram somente depois
            dos blockers de produção e do fechamento visual do MVP.
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

      <section className="settings-governance">
        <div>
          <span className="section-kicker">ATRIBUIÇÃO E GOVERNANÇA</span>
          <strong>Dependências anatômicas permanecem explícitas</strong>
          <p>
            Licenças e proveniência não são escondidas atrás do visual premium.
          </p>
        </div>
        <AttributionNotice />
      </section>

      <div className="settings-actions settings-actions-v2">
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
