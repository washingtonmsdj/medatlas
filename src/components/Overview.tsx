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
  const reviewLabel = report.finding.anatomyReviewRequired
    ? 'Anatomia pendente'
    : report.finding.explanationReviewRequired
      ? 'Revisão pendente'
      : report.status === 'published'
        ? 'Publicado'
        : 'Pronto para publicar'

  const anatomyLabel = report.finding.anatomyReviewRequired
    ? 'Reconfirmação necessária'
    : report.finding.anatomicalStructure

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
          <span>ANATOMIA</span>
          <strong>{anatomyLabel}</strong>
          <small>
            {report.finding.anatomicalStructure} · {report.finding.atlasConceptId}
          </small>
        </article>
        <article>
          <span>DATA PLANE</span>
          <strong>Modo demonstração</strong>
          <small>Backend clínico adiado para uma etapa posterior</small>
        </article>
        <article>
          <span>SEGURANÇA</span>
          <strong>Fail-closed</strong>
          <small>Laudo alterado reabre confirmação anatômica e revisão</small>
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
            ['03', 'Confirmação', 'Cada mudança de texto exige reconfirmação.'],
            ['04', 'Explicação', 'Rascunho educacional com provenance.'],
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
          <span className="section-kicker">FOCO ATUAL</span>
          <h2>MVP clínico visual sem backend</h2>
          <p>
            O contrato de backend continua preservado, mas a execução agora
            prioriza produto, UX, cenários sintéticos, anatomia 3D e validação.
            Supabase entra depois sem mudar as fronteiras principais.
          </p>
        </div>
        <div className="boundary-list">
          <span>✓ Anatomia real e curada</span>
          <span>✓ Triagem do texto</span>
          <span>✓ Rascunho educacional</span>
          <span>✓ Revisão fail-closed</span>
          <span>○ E2E visual</span>
          <span>○ Backend dedicado depois</span>
        </div>
      </div>
    </section>
  )
}
