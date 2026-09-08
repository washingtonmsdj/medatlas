import type { VisualReport } from '../domain/types'
import { deriveReportPresentation } from '../domain/report-presentation'
import { AnatomyFocusPreview } from './AnatomyFocusPreview'

interface Props {
  report: VisualReport
  organizationName: string
  workspaceName: string
  unitName?: string
  professionalDisplayName: string
  onNewReport: () => void
  onOpenReport: () => void
  onOpenAtlas: () => void
}

const metricIconByStep = {
  source: 'T',
  anatomy: '3D',
  explanation: '✓',
  share: '↗',
} as const

export function Overview({
  report,
  organizationName,
  workspaceName,
  unitName,
  professionalDisplayName,
  onNewReport,
  onOpenReport,
  onOpenAtlas,
}: Props) {
  const presentation = deriveReportPresentation(report)

  return (
    <section className="overview-module overview-saas-v2 overview-3d-first module-v3 mvp-surface">
      <div className="overview-welcome workspace-hero-v3 mvp-page-hero">
        <div>
          <span className="section-kicker">
            {organizationName.toUpperCase()} · {workspaceName.toUpperCase()}
            {unitName ? ` · ${unitName.toUpperCase()}` : ''}
          </span>
          <h2>Seu fluxo clínico visual</h2>
          <p>
            Olá, {professionalDisplayName}. Crie o relatório, confirme a
            anatomia e compartilhe com o paciente.
          </p>
        </div>

        <div className="overview-actions overview-actions-premium">
          <button className="primary" type="button" onClick={onNewReport}>
            <span aria-hidden="true">＋</span>
            Novo relatório
          </button>
          <button type="button" onClick={onOpenAtlas}>
            Atlas 3D
          </button>
        </div>
      </div>

      <article className="continue-care-card overview-3d-hero">
        <div className="overview-3d-hero-heading">
          <div>
            <span className="overview-new-pill">
              <span aria-hidden="true">✦</span>
              HUMAN ATLAS 3D
            </span>
            <h2>Anatomia do relatório</h2>
            <p>{report.title}</p>
          </div>
          <span className="care-status">{presentation.statusLabel}</span>
        </div>

        <div className="overview-3d-hero-grid">
          <div className="overview-3d-stage-shell">
            <AnatomyFocusPreview
              conceptId={report.finding.atlasConceptId || undefined}
              label={report.finding.anatomicalStructure}
              atlasRef={report.finding.atlasRef}
              eyebrow="HUMAN ATLAS 3D"
              contextMode="none"
              compact
              reviewRequired={report.finding.anatomyReviewRequired}
              onOpenAtlas={onOpenAtlas}
              description="Anatomia humana de referência ligada ao relatório atual."
            />
          </div>

          <div className="overview-3d-story">
            <div className="overview-3d-story-copy">
              <span className="section-kicker">PACIENTE</span>
              <h3>{report.patient.displayName}</h3>
              <p>{presentation.anatomy.label}</p>
            </div>

            <div className="overview-3d-progress-copy">
              <div>
                <span>Progresso</span>
                <strong>
                  {presentation.completed}/{presentation.total} etapas
                </strong>
              </div>
              <div
                className="care-progress"
                role="progressbar"
                aria-label="Progresso do relatório"
                aria-valuemin={0}
                aria-valuemax={presentation.total}
                aria-valuenow={presentation.completed}
              >
                {presentation.steps.map((step) => (
                  <span className={step.done ? 'done' : ''} key={step.id} />
                ))}
              </div>
            </div>

            <div className="overview-step-stack">
              {presentation.steps.map((step, index) => (
                <div className={step.state} key={step.id}>
                  <span>{step.done ? '✓' : String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>{step.shortLabel}</strong>
                    <small>{step.detail}</small>
                  </div>
                </div>
              ))}
            </div>

            <div className="overview-3d-hero-actions">
              <button className="primary" type="button" onClick={onOpenReport}>
                Continuar relatório
                <span aria-hidden="true">→</span>
              </button>
              <button type="button" onClick={onOpenAtlas}>
                Abrir Atlas
              </button>
            </div>
          </div>
        </div>
      </article>

      <div className="overview-metrics premium-metrics overview-derived-metrics" aria-label="Etapas do relatório">
        {presentation.steps.map((step) => (
          <article className={`metric-card report-step-${step.state}`} key={step.id}>
            <span className="metric-icon" aria-hidden="true">
              {metricIconByStep[step.id]}
            </span>
            <div>
              <strong>{step.done ? 'Concluído' : step.state === 'current' ? 'Agora' : 'Depois'}</strong>
              <span>{step.shortLabel}</span>
              <small>{step.detail}</small>
            </div>
          </article>
        ))}
      </div>

      <section className="mvp-next-step-card">
        <div>
          <span className="section-kicker">PRÓXIMO PASSO</span>
          <h2>{presentation.currentStep?.label ?? 'Relatório concluído'}</h2>
          <p>
            {presentation.currentStep?.detail ??
              'O relatório atual já passou por todas as etapas.'}
          </p>
        </div>
        <button
          className="primary"
          type="button"
          onClick={
            presentation.currentStep?.id === 'anatomy'
              ? onOpenAtlas
              : onOpenReport
          }
        >
          {presentation.currentStep ? 'Continuar' : 'Abrir relatório'}
        </button>
      </section>
    </section>
  )
}
