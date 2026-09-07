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
      done: report.finding.sourceText.trim().length > 0,
    },
    {
      label: 'Anatomia confirmada',
      done:
        Boolean(report.finding.atlasConceptId) &&
        !report.finding.anatomyReviewRequired,
    },
    {
      label: 'Explicação revisada',
      done:
        Boolean(report.finding.patientExplanation.trim()) &&
        !report.finding.explanationReviewRequired,
    },
    {
      label: 'Handoff ao paciente',
      done:
        report.status === 'published' &&
        Boolean(report.shareSlug),
    },
  ]
  const completed = stages.filter((stage) => stage.done).length

  return (
    <section className="consultations-module">
      <div className="consultations-hero">
        <div>
          <span className="section-kicker">CONSULTA · DEMO SINTÉTICA</span>
          <h2>Sessão clínica visual em andamento</h2>
          <p>
            Sem agenda ou prontuário persistente nesta fase. A sessão representa
            somente o workflow visual do relatório atual.
          </p>
        </div>
        <strong className="consultation-score">
          {completed}/{stages.length}
        </strong>
      </div>

      <div className="consultation-timeline" aria-label="Progresso da consulta visual">
        {stages.map((stage, index) => (
          <article key={stage.label} className={stage.done ? 'done' : ''}>
            <span>{stage.done ? '✓' : index + 1}</span>
            <div>
              <strong>{stage.label}</strong>
              <p>{stage.done ? 'Concluído no estado atual' : 'Pendente'}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="consultation-summary">
        <article>
          <span className="label">PACIENTE</span>
          <strong>{report.patient.displayName}</strong>
          <p>{report.patient.age} anos · fictício</p>
        </article>
        <article>
          <span className="label">RELATÓRIO</span>
          <strong>{report.title}</strong>
          <p>
            {report.finding.atlasConceptId
              ? report.finding.anatomicalStructure
              : 'sem anatomia confirmada'}
          </p>
        </article>
        <article>
          <span className="label">PUBLICAÇÃO</span>
          <strong>
            {report.status === 'published' ? 'Compartilhado' : 'Não publicado'}
          </strong>
          <p>
            {report.status === 'published'
              ? 'link demo temporário ativo'
              : 'gate humano ainda preservado'}
          </p>
        </article>
      </div>

      <div className="consultation-actions">
        <button className="primary" type="button" onClick={onOpenReport}>
          Continuar relatório atual
        </button>
        <button type="button" onClick={onNewReport}>
          Iniciar nova sessão sintética
        </button>
      </div>
    </section>
  )
}
