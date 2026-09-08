import type { VisualReport } from '../domain/types'
import { deriveReportPresentation } from '../domain/report-presentation'
import { AnatomyFocusPreview } from './AnatomyFocusPreview'
import { PilotChecklist } from './PilotChecklist'

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
    <section className="overview-module overview-saas-v2 overview-3d-first module-v3">
      <div className="overview-welcome workspace-hero-v3">
        <div>
          <span className="section-kicker">
            {organizationName.toUpperCase()} · {workspaceName.toUpperCase()}
            {unitName ? ` · ${unitName.toUpperCase()}` : ''}
          </span>
          <h2>Bom dia, {professionalDisplayName}.</h2>
          <p>
            Um único fluxo conecta texto clínico, anatomia 3D, revisão e
            comunicação com o paciente sem duplicar contexto.
          </p>
        </div>

        <div className="overview-actions overview-actions-premium">
          <button className="primary" type="button" onClick={onNewReport}>
            <span aria-hidden="true">＋</span>
            Novo relatório visual
          </button>
          <button type="button" onClick={onOpenAtlas}>
            Explorar Atlas 3D
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
            <span className="section-kicker">DIFERENCIAL MEDATLAS</span>
            <h2>O laudo deixa de ser só texto.</h2>
            <p>
              O profissional associa o achado a uma referência anatômica real,
              revisa a explicação e entrega uma experiência visual clara sem
              transformar o atlas em diagnóstico ou reconstrução do paciente.
            </p>
          </div>
          <span className="care-status">{presentation.statusLabel}</span>
        </div>

        <div className="overview-3d-hero-grid">
          <div className="overview-3d-stage-shell">
            <AnatomyFocusPreview
              conceptId={report.finding.atlasConceptId || undefined}
              label={report.finding.anatomicalStructure}
              atlasRef={report.finding.atlasRef}
              eyebrow="3D DO ATENDIMENTO · HUMAN ATLAS · MODELO DE REFERÊNCIA"
              contextMode="none"
              compact
              reviewRequired={report.finding.anatomyReviewRequired}
              onOpenAtlas={onOpenAtlas}
              description="Geometria real do Human Atlas/BodyParts3D integrada ao atendimento. Anatomia de referência — não reconstrução específica do paciente."
            />
          </div>

          <div className="overview-3d-story">
            <div className="overview-3d-story-copy">
              <span className="section-kicker">RELATÓRIO EM FOCO</span>
              <h3>{report.patient.displayName}</h3>
              <p>{report.title}</p>
            </div>

            <div className="overview-3d-current-anatomy">
              <span>Anatomia do relatório</span>
              <strong>{presentation.anatomy.label}</strong>
              <small>{presentation.anatomy.detail}</small>
            </div>

            <div className="overview-3d-progress-copy">
              <div>
                <span>Progresso do relatório</span>
                <strong>
                  {presentation.completed}/{presentation.total} etapas concluídas
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
                Abrir Atlas completo
              </button>
            </div>

            <small className="overview-3d-safety">
              Revisão clínica explícita continua obrigatória antes do
              compartilhamento com o paciente.
            </small>
          </div>
        </div>
      </article>

      <div className="overview-metrics premium-metrics overview-derived-metrics" aria-label="Estado do relatório atual">
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

      <div className="overview-command-grid overview-command-grid-v5">
        <section className="premium-flow overview-current-state">
          <div className="overview-flow-heading">
            <div>
              <span className="section-kicker">FLUXO VISUAL CLÍNICO</span>
              <h2>Uma fonte de verdade para todas as telas.</h2>
              <p>
                O mesmo estado do relatório orienta Dashboard, Pacientes,
                Consultas, Exames e Relatórios visuais.
              </p>
            </div>
            <span className="overview-status">
              {presentation.progressPercent}% concluído
            </span>
          </div>

          <div className="premium-flow-steps">
            {presentation.steps.map((step, index) => (
              <article className={step.state} key={step.id}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{step.label}</strong>
                  <p>{step.detail}</p>
                </div>
                {index < presentation.steps.length - 1 && <b aria-hidden="true">→</b>}
              </article>
            ))}
          </div>
        </section>

        <aside className="work-queue-card overview-next-actions">
          <div className="work-queue-heading">
            <div>
              <span className="section-kicker">PRÓXIMA AÇÃO</span>
              <h2>
                {presentation.currentStep?.label ?? 'Fluxo concluído'}
              </h2>
            </div>
            <span className="queue-count">
              {presentation.total - presentation.completed}
            </span>
          </div>

          {presentation.steps
            .filter((step) => !step.done)
            .map((step, index) => (
              <button
                type="button"
                className="queue-item"
                key={step.id}
                onClick={step.id === 'anatomy' ? onOpenAtlas : onOpenReport}
              >
                <span className="queue-avatar">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>
                  <strong>{step.label}</strong>
                  <small>{step.detail}</small>
                </span>
                <b>→</b>
              </button>
            ))}

          {presentation.completed === presentation.total && (
            <div className="queue-complete-state">
              <span aria-hidden="true">✓</span>
              <div>
                <strong>Relatório compartilhado</strong>
                <small>Todos os gates do fluxo atual foram concluídos.</small>
              </div>
            </div>
          )}

          <div className="queue-3d-note">
            <span aria-hidden="true">3D</span>
            <div>
              <strong>Human Atlas permanece no mesmo contexto</strong>
              <small>Abra o atlas sem perder o relatório em andamento.</small>
            </div>
          </div>
        </aside>
      </div>

      <section className="product-position-card product-position-card-v5 overview-product-contract">
        <div>
          <span className="section-kicker">CONTRATO DO PRODUTO</span>
          <h2>3D como linguagem clínica visual, não como decoração.</h2>
          <p>
            O Human Atlas aparece onde existe uma tarefa anatômica real. Áreas
            administrativas permanecem leves e sem canvas desnecessário.
          </p>
        </div>
        <div>
          <span>✓ mesmo engine em todas as superfícies anatômicas</span>
          <span>✓ inspeção visual separada da confirmação clínica</span>
          <span>✓ paciente recebe linguagem e controles simplificados</span>
          <span>✓ nenhuma publicação automática</span>
        </div>
        <button type="button" onClick={onOpenAtlas}>
          Conhecer o Atlas 3D
          <span aria-hidden="true">→</span>
        </button>
      </section>

      <PilotChecklist report={report} />
    </section>
  )
}
