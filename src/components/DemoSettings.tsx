import { useState } from 'react'
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
    <section className="settings-module">
      <div className="settings-hero">
        <span className="section-kicker">CONFIGURAÇÕES · DEMO</span>
        <h2>Ambiente sintético e controles locais</h2>
        <p>
          Estas opções afetam somente este navegador. Nenhuma configuração é
          enviada para backend nesta fase.
        </p>
      </div>

      <div className="settings-grid">
        <article>
          <span className="label">MODO DE DADOS</span>
          <strong>Somente fictícios</strong>
          <p>
            {demoRepositoryDescriptor.label}. Dados reais de pacientes
            continuam proibidos neste MVP.
          </p>
        </article>

        <article>
          <span className="label">LINKS LOCAIS</span>
          <strong>{shareCount}</strong>
          <p>
            Relatórios publicados temporariamente neste navegador. Cada link
            expira automaticamente em 30 minutos.
          </p>
          <button type="button" onClick={clear}>
            Limpar dados locais da demonstração
          </button>
          {message && (
            <small role="status" aria-live="polite">
              {message}
            </small>
          )}
        </article>

        <article>
          <span className="label">BACKEND</span>
          <strong>Adiado</strong>
          <p>
            Supabase, autenticação e dados clínicos reais só entram depois dos
            blockers de produção.
          </p>
        </article>

        <article>
          <span className="label">IA REMOTA</span>
          <strong>Desativada</strong>
          <p>
            O schema e o validador fail-closed existem, mas nenhum provedor
            remoto está ativo no navegador.
          </p>
        </article>
      </div>

      <div className="settings-actions">
        <button className="primary" type="button" onClick={onNewReport}>
          Iniciar novo relatório vazio
        </button>
      </div>
    </section>
  )
}
