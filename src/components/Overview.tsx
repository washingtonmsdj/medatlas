import type { VisualReport } from '../domain/types'

interface Props {
  report: VisualReport
  onOpenReport: () => void
  onOpenAtlas: () => void
}

export function Overview({
  report,
  onOpenReport,
  onOpenAtlas,
}: Props) {
  const reviewLabel = report.finding.explanationReviewRequired
    ? 'Revisão pendente'
    : report.status === 'published'
      ? 'Publicado'
      : 'Pronto para publicar'

  return (
    <section className="overview-module">
      <div className="overview-hero">
        <div>
          <span className="section-kicker">AMBIENTE CLÍNICO · DEMO</span>
          <h2>Do texto clínico à explicação visual.</h2>
          <p>
            O MedAtlas mantém anatomia, revisão e compartilhamento em um fluxo
            único. Todos os registros exibidos nesta etapa são sintéticos.
          </p>
        </div>

        <div className="overview-actions">
          <button className="primary" type="button" onClick={onOpenReport}>
            Abrir relatório em trabalho
          </button>
          <button type="button" onClick={onOpenAtlas}>
            Explorar Atlas 3D
          </button>
        </div>
      </div>

      <div className="overview-metrics">
        <article>
          <span>RELATÓRIO ATUAL</span>
          <strong>{reviewLabel}</strong>
          <small>{report.title}</small>
        </article>
        <article>
          <span>ANATOMIA CONFIRMADA</span>
          <strong>{report.finding.anatomicalStructure}</strong>
          <small>{report.finding.atlasConceptId}</small>
        </article>
        <article>
          <span>DATA PLANE</span>
          <strong>Modo demonstração</strong>
          <small>Supabase de produção ainda não ativado</small>
        </article>
        <article>
          <span>SEGURANÇA</span>
          <strong>Fail-closed</strong>
          <small>Publicação bloqueada quando revisão está pendente</small>
        </article>
      </div>

      <div className="overview-flow">
        <div className="overview-flow-heading">
          <div>
            <span className="section-kicker">FLUXO CANÔNICO</span>
            <h2>Uma linha clara de responsabilidade.</h2>
          </div>
          <span className="overview-status">CI validado</span>
        </div>

        <div className="overview-steps">
          {[
            ['01', 'Texto clínico', 'O profissional fornece ou edita o trecho.'],
            ['02', 'Triagem anatômica', 'Somente conceitos existentes no atlas.'],
            ['03', 'Confirmação', 'Nenhuma sugestão muda o relatório sozinha.'],
            ['04', 'Explicação', 'Conteúdo em linguagem mais simples.'],
            ['05', 'Revisão', 'Mudanças reabrem o gate clínico.'],
            ['06', 'Paciente', 'Experiência visual compartilhável.'],
          ].map(([number, title, description]) => (
            <article key={number}>
              <span>{number}</span>
              <strong>{title}</strong>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="overview-boundary">
        <div>
          <span className="section-kicker">PRÓXIMA FRONTEIRA</span>
          <h2>Backend clínico dedicado</h2>
          <p>
            O schema, RLS, Storage privado, auditoria e tokens por hash já
            existem como contrato source-first. O próximo passo de produção é
            aplicá-los em um projeto Supabase exclusivo do MedAtlas e provar
            isolamento entre tenants.
          </p>
        </div>
        <div className="boundary-list">
          <span>✓ Schema multi-tenant definido</span>
          <span>✓ RLS exigida pelo CI</span>
          <span>✓ Token bruto não persiste</span>
          <span>○ Projeto Supabase dedicado</span>
          <span>○ Auth e onboarding</span>
          <span>○ Testes cross-tenant</span>
        </div>
      </div>
    </section>
  )
}
