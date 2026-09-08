import type { VisualReport } from '../domain/types'
import { deriveReportPresentation } from '../domain/report-presentation'
import { AnatomyFocusPreview } from './AnatomyFocusPreview'

interface Props {
  report: VisualReport
  onOpenReport: () => void
  onNewReport: () => void
  onOpenAtlas: () => void
}

export function ConsultationsModule({
  report,
  onOpenReport,
  onNewReport,
  onOpenAtlas,
}: Props) {
  const presentation = deriveReportPresentation(report)

  return (
    <section className="consultations-module consultations-module-v2 module-v3 mvp-surface">
      <div className="consultations-hero consultations-hero-v2 workspace-hero-v3 mvp-page-hero">
        <div className="module-hero-copy">
          <span className="section-kicker">CONSULTA</span>
          <h2>Consulta atual</h2>
          <p>Use o 3D enquanto revisa o relatório do paciente.</p>
        </div>

        <div className="consultation-progress-summary workspace-hero-badge">
          <strong className="consultation-score">
            {presentation.completed}/{presentation.total}
          </strong>
          <span>
            <small>Próximo</small>
            <b>{presentation.currentStep?.shortLabel ?? 'Concluído'}</b>
          </span>
        </div>
      </div>

      <div
        className="consultation-timeline consultation-timeline-v2 report-step-rail consultation-step-rail-v3"
        aria-label="Progresso da consulta visual"
      >
        {presentation.steps.map((step, index) => (
          <article key={step.id} className={step.state}>
            <span>{step.done ? '✓' : index + 1}</span>
            <div>
              <strong>{step.shortLabel}</strong>
              <p>{step.detail}</p>
            </div>
            <i aria-hidden="true" />
          </article>
        ))}
      </div>

      <section className="consultation-anatomy-live anatomy-showcase-v3">
        <div className="consultation-anatomy-live-copy anatomy-showcase-copy-v3">
          <span className="section-kicker">ANATOMIA 3D</span>
          <h2>{presentation.anatomy.label}</h2>
          <p>Referência visual do relatório atual.</p>
        </div>

        <AnatomyFocusPreview
          conceptId={report.finding.atlasConceptId || undefined}
          label={report.finding.anatomicalStructure}
          atlasRef={report.finding.atlasRef}
          eyebrow="HUMAN ATLAS 3D"
          contextMode="system"
          reviewRequired={report.finding.anatomyReviewRequired}
          onOpenAtlas={onOpenAtlas}
        />
      </section>

      <div className="consultation-actions consultation-actions-v2 module-action-bar-v3">
        <div>
          <strong>{report.patient.displayName}</strong>
          <span>{presentation.statusLabel}</span>
        </div>
        <div>
          <button className="primary" type="button" onClick={onOpenReport}>
            Continuar relatório
          </button>
          <button type="button" onClick={onNewReport}>
            Nova consulta
          </button>
        </div>
      </div>
    </section>
  )
}
