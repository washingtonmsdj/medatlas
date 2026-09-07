import type { VisualReport } from '../domain/types'

interface Props {
  report: VisualReport
}

export function PilotChecklist({ report }: Props) {
  const steps = [
    {
      label: 'Texto clínico inserido',
      done: report.finding.sourceText.trim().length > 0,
    },
    {
      label: 'Anatomia confirmada',
      done:
        Boolean(report.finding.atlasConceptId) &&
        !report.finding.anatomyReviewRequired,
    },
    {
      label: 'Explicação preparada',
      done: report.finding.patientExplanation.trim().length > 0,
    },
    {
      label: 'Revisão clínica concluída',
      done:
        !report.finding.anatomyReviewRequired &&
        !report.finding.explanationReviewRequired &&
        report.finding.patientExplanation.trim().length > 0,
    },
    {
      label: 'Handoff do paciente gerado',
      done:
        report.status === 'published' &&
        Boolean(report.shareSlug),
    },
  ]

  const completed = steps.filter((step) => step.done).length

  return (
    <section className="pilot-card" aria-labelledby="pilot-title">
      <div className="pilot-heading">
        <div>
          <span className="section-kicker">PILOTO SINTÉTICO</span>
          <h2 id="pilot-title">Critérios de aceite do fluxo</h2>
          <p>
            Progresso calculado somente a partir do relatório fictício em
            trabalho. Nenhuma telemetria externa é enviada.
          </p>
        </div>
        <strong className="pilot-score">
          {completed}/{steps.length}
        </strong>
      </div>

      <div className="pilot-steps">
        {steps.map((step, index) => (
          <article
            key={step.label}
            className={step.done ? 'done' : ''}
          >
            <span aria-hidden="true">
              {step.done ? '✓' : String(index + 1).padStart(2, '0')}
            </span>
            <p>{step.label}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
