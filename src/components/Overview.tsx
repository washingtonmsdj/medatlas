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

type IconName =
  | 'patient'
  | 'report'
  | 'review'
  | 'activity'
  | 'atlas'
  | 'queue'
  | 'summary'
  | 'calendar'
  | 'arrow'

function OverviewIcon({ name }: { name: IconName }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  switch (name) {
    case 'patient':
      return <svg {...common}><circle cx="9" cy="8" r="3" /><circle cx="17" cy="10" r="2.5" /><path d="M3.5 20c.7-4 2.5-6 5.5-6s4.8 2 5.5 6M14.5 15c2.8-.4 4.8 1.2 6 4.5" /></svg>
    case 'report':
      return <svg {...common}><path d="M6 3h9l3 3v15H6z" /><path d="M15 3v4h4M9 11h6M9 15h6" /></svg>
    case 'review':
      return <svg {...common}><path d="M20 11a8 8 0 1 1-2.3-5.7" /><path d="M20 4v7h-7" /><path d="m9.5 12 1.7 1.7 3.5-4" /></svg>
    case 'activity':
      return <svg {...common}><path d="M5 20V11M12 20V5M19 20v-8" /></svg>
    case 'atlas':
      return <svg {...common}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></svg>
    case 'queue':
      return <svg {...common}><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></svg>
    case 'summary':
      return <svg {...common}><path d="M5 20V12M12 20V7M19 20V4" /></svg>
    case 'calendar':
      return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>
    case 'arrow':
      return <svg {...common}><path d="M5 12h14M14 7l5 5-5 5" /></svg>
  }
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
  const pendingSteps = presentation.steps.filter((step) => !step.done)
  const currentStep = presentation.currentStep
  const scopeLabel = [organizationName, workspaceName, unitName]
    .filter(Boolean)
    .join(' · ')

  const kpis = [
    {
      icon: 'patient' as const,
      value: '01',
      label: 'Paciente em foco',
      detail: report.patient.displayName,
    },
    {
      icon: 'report' as const,
      value: `v${report.version}`,
      label: 'Versão do relatório',
      detail: presentation.statusLabel,
    },
    {
      icon: 'review' as const,
      value: `${presentation.progressPercent}%`,
      label: 'Fluxo concluído',
      detail: `${presentation.completed} de ${presentation.total} etapas`,
    },
    {
      icon: 'activity' as const,
      value: String(pendingSteps.length).padStart(2, '0'),
      label: 'Ações pendentes',
      detail: pendingSteps.length === 0 ? 'Nenhuma pendência' : currentStep?.label ?? 'Revisar fluxo',
    },
  ]

  return (
    <section className="overview-dashboard workspace-page">
      <WorkspacePageHeader
        eyebrow="VISÃO CLÍNICA"
        title="Visão geral"
        description="Acompanhe o paciente, o relatório e a anatomia clínica em um só lugar."
        className="overview-dashboard-heading"
        meta={
          <span className="overview-demo-context">
            Demonstração · {scopeLabel}
          </span>
        }
      />

      <section className="overview-kpi-grid" aria-label="Resumo do atendimento demonstrativo">
        {kpis.map((item) => (
          <article className="overview-kpi-card" key={item.label}>
            <span className="overview-kpi-icon"><OverviewIcon name={item.icon} /></span>
            <div>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
            <small>{item.detail}</small>
          </article>
        ))}
      </section>

      <section className="overview-primary-grid">
        <article className="overview-atlas-panel">
          <header className="overview-panel-heading">
            <span className="overview-panel-icon"><OverviewIcon name="atlas" /></span>
            <div>
              <h2>Atlas 3D interativo</h2>
              <p>Explore a anatomia humana real vinculada ao relatório atual.</p>
            </div>
            <button className="overview-text-action" type="button" onClick={onOpenAtlas}>
              Abrir Atlas <OverviewIcon name="arrow" />
            </button>
          </header>

          <div className="overview-atlas-stage">
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
        </article>

        <article className="overview-flow-panel">
          <header className="overview-panel-heading">
            <span className="overview-panel-icon"><OverviewIcon name="queue" /></span>
            <div>
              <h2>Atendimento em andamento</h2>
              <p>Etapas do relatório demonstrativo.</p>
            </div>
          </header>

          <div className="overview-flow-list">
            {presentation.steps.map((step, index) => (
              <button key={step.id} type="button" onClick={step.id === 'anatomy' ? onOpenAtlas : onOpenReport}>
                <span className="overview-flow-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="overview-flow-copy">
                  <strong>{step.label}</strong>
                  <small>{step.detail}</small>
                </span>
                <span className={`overview-status-pill ${step.state}`}>
                  {step.done ? 'Concluído' : step.state === 'current' ? 'Em revisão' : 'Aguardando'}
                </span>
              </button>
            ))}
          </div>
        </article>

        <aside className="overview-summary-panel">
          <header className="overview-panel-heading">
            <span className="overview-panel-icon"><OverviewIcon name="summary" /></span>
            <div>
              <h2>Resumo do dia</h2>
              <p>Ambiente demonstrativo</p>
            </div>
          </header>

          <div className="overview-summary-copy">
            <span className="overview-summary-rule" aria-hidden="true" />
            <h3>Bom trabalho, {professionalDisplayName}.</h3>
            <p>
              {currentStep
                ? `O relatório está em ${presentation.progressPercent}% do fluxo. A próxima etapa é “${currentStep.label}”.`
                : 'O relatório atual concluiu todas as etapas do fluxo clínico.'}
            </p>
            <blockquote>“Anatomia clara. Conversa melhor.”</blockquote>
          </div>

          <button className="overview-new-report-button" type="button" onClick={onNewReport}>
            <span aria-hidden="true">＋</span>
            Novo laudo
          </button>
        </aside>
      </section>

      <section className="overview-secondary-grid">
        <article className="overview-current-report-panel">
          <header className="overview-panel-heading">
            <span className="overview-panel-icon"><OverviewIcon name="report" /></span>
            <div>
              <h2>Relatório atual</h2>
              <p>Dados sintéticos do cenário ativo.</p>
            </div>
            <button className="overview-text-action" type="button" onClick={onOpenReport}>
              Abrir relatório <OverviewIcon name="arrow" />
            </button>
          </header>

          <div className="overview-report-table" role="table" aria-label="Relatório demonstrativo atual">
            <div className="overview-report-row overview-report-row-head" role="row">
              <span>Paciente</span><span>Anatomia</span><span>Versão</span><span>Status</span>
            </div>
            <button className="overview-report-row" role="row" type="button" onClick={onOpenReport}>
              <span><b>{report.patient.displayName.slice(0, 1)}</b>{report.patient.displayName}</span>
              <span>{report.finding.anatomicalStructure}</span>
              <span>v{report.version}</span>
              <span><i className="overview-status-pill done">{presentation.statusLabel}</i></span>
            </button>
          </div>
        </article>

        <article className="overview-next-panel">
          <header className="overview-panel-heading">
            <span className="overview-panel-icon"><OverviewIcon name="calendar" /></span>
            <div>
              <h2>Próximas ações</h2>
              <p>Prioridades do fluxo atual.</p>
            </div>
          </header>

          <div className="overview-next-list">
            {(pendingSteps.length > 0 ? pendingSteps : presentation.steps.slice(-2)).map((step, index) => (
              <button type="button" key={step.id} onClick={step.id === 'anatomy' ? onOpenAtlas : onOpenReport}>
                <span className="overview-next-dot">{index + 1}</span>
                <span><strong>{step.label}</strong><small>{step.detail}</small></span>
                <OverviewIcon name="arrow" />
              </button>
            ))}
          </div>
        </article>
      </section>
    </section>
  )
}
