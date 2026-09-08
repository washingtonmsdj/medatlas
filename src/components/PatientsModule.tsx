import type { VisualReport } from '../domain/types'
import { deriveReportPresentation } from '../domain/report-presentation'
import { AnatomyFocusPreview } from './AnatomyFocusPreview'

interface Props {
  report: VisualReport
  onOpenReport: () => void
  onOpenAtlas: () => void
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function PatientsModule({
  report,
  onOpenReport,
  onOpenAtlas,
}: Props) {
  const presentation = deriveReportPresentation(report)

  return (
    <section className="patients-module patients-module-v2 module-v3 mvp-surface">
      <div className="patients-hero patients-hero-v2 workspace-hero-v3 mvp-page-hero">
        <div className="module-hero-copy">
          <span className="section-kicker">PACIENTE</span>
          <h2>Paciente atual</h2>
          <p>Acompanhe o relatório e a anatomia em um só lugar.</p>
        </div>

        <div className="workspace-hero-badge">
          <strong>{presentation.progressPercent}%</strong>
          <small>{presentation.statusLabel}</small>
        </div>
      </div>

      <div className="patient-workspace-grid patient-workspace-grid-v2 workspace-context-grid">
        <article className="patient-profile-card patient-profile-card-v2 workspace-panel">
          <div className="patient-profile-heading">
            <span className="patient-avatar" aria-hidden="true">
              {initials(report.patient.displayName)}
            </span>
            <div>
              <span className="label">PACIENTE</span>
              <strong>{report.patient.displayName}</strong>
              <p>{report.patient.age} anos · demonstração</p>
            </div>
          </div>

          <dl className="patient-profile-meta">
            <div>
              <dt>Status</dt>
              <dd>{presentation.statusLabel}</dd>
            </div>
            <div>
              <dt>Relatório</dt>
              <dd>{report.title}</dd>
            </div>
          </dl>
        </article>

        <article className="patient-current-report patient-current-report-v2 workspace-panel">
          <header>
            <div>
              <span className="label">RELATÓRIO ATUAL</span>
              <strong>{report.title}</strong>
            </div>
            <span className={presentation.completion.share ? 'report-state-chip published' : 'report-state-chip'}>
              {presentation.statusLabel}
            </span>
          </header>

          <div className="patient-report-progress report-step-rail" aria-label="Progresso do relatório">
            {presentation.steps.map((step, index) => (
              <span className={step.state} key={step.id}>
                <i aria-hidden="true">{step.done ? '✓' : index + 1}</i>
                {step.shortLabel}
              </span>
            ))}
          </div>

          <div className="patient-workspace-actions">
            <button className="primary" type="button" onClick={onOpenReport}>
              Abrir relatório
            </button>
            <button type="button" onClick={onOpenAtlas}>
              Abrir Atlas
            </button>
          </div>
        </article>
      </div>

      <section className="patient-anatomy-live anatomy-showcase-v3">
        <div className="patient-anatomy-live-copy anatomy-showcase-copy-v3">
          <span className="section-kicker">ANATOMIA 3D</span>
          <h2>{presentation.anatomy.label}</h2>
          <p>{presentation.anatomy.detail}</p>
        </div>

        <AnatomyFocusPreview
          conceptId={report.finding.atlasConceptId || undefined}
          label={report.finding.anatomicalStructure}
          atlasRef={report.finding.atlasRef}
          eyebrow="HUMAN ATLAS 3D"
          appearance="patient"
          contextMode="system"
          reviewRequired={report.finding.anatomyReviewRequired}
          onOpenAtlas={onOpenAtlas}
          description="Anatomia de referência usada neste relatório."
        />
      </section>
    </section>
  )
}
