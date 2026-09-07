import type { VisualReport } from '../domain/types'

interface Props {
  report: VisualReport
  onOpenReport: () => void
  onNewReport: () => void
}

export function ConsultationsModule({
  report,
  onOpenReport,
  onNewReport,
}: Props) {
  const stages = [
    {
      label: 'Texto clínico',
      detail: 'Fonte do relatório',
      done: report.finding.sourceText.trim().length > 0,
    },
    {
      label: 'Anatomia confirmada',
      detail: report.finding.atlasConceptId || 'Referência FMA',
      done:
        Boolean(report.finding.atlasConceptId) &&
        !report.finding.anatomyReviewRequired,
    },
    {
      label: 'Explicação revisada',
      detail: 'Gate profissional',
      done:
        Boolean(report.finding.patientExplanation.trim()) &&
        !report.finding.explanationReviewRequired,
    },
    {
      label: 'Handoff ao paciente',
      detail: 'Link temporário',
      done:
        report.status === 'published' &&
        Boolean(report.shareSlug),
    },
  ]
  const completed = stages.filter((stage) => stage.done).length
  const nextStage = stages.find((stage) => !stage.done)?.label ?? 'Fluxo concluído'

  return (
    <section className="consultations-module consultations-module-v2">
      <div className="consultations-hero consultations-hero-v2">
        <div className="module-hero-copy">
          <span className="section-kicker">CONSULTA · WORKFLOW VISUAL</span>
          <h2>Sessão clínica visual em andamento</h2>
          <p>
            Representa apenas o fluxo do relatório atual. Agenda, prontuário e
            histórico persistente continuam fora deste MVP.
          </p>
        </div>

        <div className="consultation-progress-summary">
          <strong className="consultation-score">
            {completed}/{stages.length}
          </strong>
          <span>
            <small>Próxima etapa</small>
            <b>{nextStage}</b>
          </span>
        </div>
      </div>

      <div
        className="consultation-timeline consultation-timeline-v2"
        aria-label="Progresso da consulta visual"
      >
        {stages.map((stage, index) => (
          <article key={stage.label} className={stage.done ? 'done' : ''}>
            <span>{stage.done ? '✓' : index + 1}</span>
            <div>
              <strong>{stage.label}</strong>
              <p>{stage.done ? 'Concluído' : stage.detail}</p>
            </div>
            <i aria-hidden="true" />
          </article>
        ))}
      </div>

      <div className="consultation-summary consultation-summary-v2">
        <article>
          <span className="label">PACIENTE</span>
          <strong>{report.patient.displayName}</strong>
          <p>{report.patient.age} anos · contexto fictício</p>
        </article>

        <article>
          <span className="label">ANATOMIA DE REFERÊNCIA</span>
          <strong>
            {report.finding.atlasConceptId
              ? report.finding.anatomicalStructure
              : 'Ainda não confirmada'}
          </strong>
          <p>{report.finding.atlasConceptId || 'sem FMA confirmado'}</p>
        </article>

        <article>
          <span className="label">PUBLICAÇÃO</span>
          <strong>
            {report.status === 'published' ? 'Compartilhado' : 'Não publicado'}
          </strong>
          <p>
            {report.status === 'published'
              ? 'link demo temporário ativo'
              : report.finding.explanationReviewRequired
                ? 'revisão humana ainda necessária'
                : 'pronto para handoff'}
          </p>
        </article>
      </div>

      <div className="consultation-actions consultation-actions-v2">
        <div>
          <strong>Continue exatamente de onde parou</strong>
          <span>
            O estado atual do relatório é preservado localmente nesta sessão.
          </span>
        </div>
        <div>
          <button className="primary" type="button" onClick={onOpenReport}>
            Continuar relatório atual
          </button>
          <button type="button" onClick={onNewReport}>
            Iniciar nova sessão sintética
          </button>
        </div>
      </div>
    </section>
  )
}
