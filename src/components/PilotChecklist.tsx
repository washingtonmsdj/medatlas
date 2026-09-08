import { deriveReportPresentation } from '../domain/report-presentation'
import type { VisualReport } from '../domain/types'

interface Props {
  report: VisualReport
}

export function PilotChecklist({ report }: Props) {
  const presentation = deriveReportPresentation(report)
  const steps = [
    {
      id: 'source',
      label: 'Texto clínico inserido',
      done: presentation.completion.source,
    },
    {
      id: 'anatomy',
      label: 'Anatomia confirmada',
      done: presentation.completion.anatomy,
    },
    {
      id: 'draft',
      label: 'Explicação preparada',
      done: presentation.explanation.state !== 'empty',
    },
    {
      id: 'review',
      label: 'Revisão clínica concluída',
      done: presentation.completion.explanation,
    },
    {
      id: 'share',
      label: 'Handoff do paciente gerado',
      done: presentation.completion.share,
    },
  ]

  const completed = steps.filter((step) => step.done).length

  return (
    <section className="pilot-card pilot-card-v3" aria-labelledby="pilot-title">
      <div className="pilot-heading">
        <div>
          <span className="section-kicker">VALIDAÇÃO DO FLUXO DEMO</span>
          <h2 id="pilot-title">Critérios de aceite do fluxo</h2>
          <p>
            A mesma fonte de estado usada nas telas clínicas alimenta esta
            validação. Nenhuma telemetria externa ou etapa paralela é criada.
          </p>
        </div>
        <strong className="pilot-score">
          {completed}/{steps.length}
        </strong>
      </div>

      <div className="pilot-steps">
        {steps.map((step, index) => (
          <article
            key={step.id}
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
