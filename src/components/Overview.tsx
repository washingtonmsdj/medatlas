import type { VisualReport } from '../domain/types'
import { deriveReportPresentation } from '../domain/report-presentation'
import { AnatomyFocusPreview } from './AnatomyFocusPreview'
import { WorkspacePageHeader } from './WorkspacePageHeader'

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
  const currentStep = presentation.currentStep
  const scopeLabel = [organizationName, workspaceName, unitName]
    .filter(Boolean)
    .join(' · ')
    .toUpperCase()

  return (
    <section className="overview-3d-first workspace-page mvp-surface">
      <WorkspacePageHeader
        eyebrow={scopeLabel}
        title="Atendimento em andamento"
        description={`Olá, ${professionalDisplayName}. Continue de onde parou ou crie um novo relatório visual.`}
        className="overview-welcome overview-compact-hero"
        actions={
          <button className="primary" type="button" onClick={onNewReport}>
            <span aria-hidden="true">＋</span>
            Novo relatório
          </button>
        }
      />

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

            <div className="overview-current-action">
              <span className="section-kicker">
                {currentStep ? 'PRÓXIMA ETAPA' : 'RELATÓRIO'}
              </span>
              <strong>{currentStep?.label ?? 'Relatório concluído'}</strong>
              <small>
                {currentStep?.detail ??
                  'Todas as etapas do relatório atual foram concluídas.'}
              </small>
            </div>

            <div className="overview-3d-hero-actions">
              <button className="primary" type="button" onClick={onOpenReport}>
                {currentStep ? 'Continuar relatório' : 'Abrir relatório'}
                <span aria-hidden="true">→</span>
              </button>
              <button type="button" onClick={onOpenAtlas}>
                Abrir Atlas
              </button>
            </div>
          </div>
        </div>
      </article>
    </section>
  )
}
