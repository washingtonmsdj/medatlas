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
  | 'clock'
  | 'share'
  | 'attention'
  | 'spark'

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
    case 'clock':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
    case 'share':
      return <svg {...common}><path d="M5 12h10M11 8l4 4-4 4" /><path d="M15 5h4v14h-4" /></svg>
    case 'attention':
      return <svg {...common}><path d="M12 3 2.8 20h18.4z" /><path d="M12 9v4M12 17h.01" /></svg>
    case 'spark':
      return <svg {...common}><path d="M12 3c.8 4.6 2.4 6.2 7 7-4.6.8-6.2 2.4-7 7-.8-4.6-2.4-6.2-7-7 4.6-.8 6.2-2.4 7-7Z" /></svg>
    case 'arrow':
      return <svg {...common}><path d="M5 12h14M14 7l5 5-5 5" /></svg>
  }
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join('')
}

function overviewDateLabel() {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })
    .format(new Date())
    .replace('-feira', '-FEIRA')
    .toUpperCase()
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
  const patientInitials = initials(report.patient.displayName)
  const focusLabel = report.finding.atlasConceptId
    ? report.finding.anatomicalStructure
    : 'Anatomia ainda não confirmada'

  const kpis = [
    {
      icon: 'report' as const,
      value: '1',
      label: 'Relatório atual',
      detail: `Versão v${report.version} · ${presentation.statusLabel}`,
    },
    {
      icon: 'clock' as const,
      value: String(pendingSteps.length),
      label: 'Aguardando ação',
      detail: currentStep?.label ?? 'Fluxo concluído',
    },
    {
      icon: 'review' as const,
      value: `${presentation.progressPercent}%`,
      label: 'Fluxo concluído',
      detail: `${presentation.completed} de ${presentation.total} etapas`,
    },
  ]

  return (
    <section className="overview-dashboard overview-case-dashboard workspace-page">
      <WorkspacePageHeader
        eyebrow={overviewDateLabel()}
        title={`Bom dia, ${professionalDisplayName}.`}
        description="Clareza para cada paciente. Continuidade para o seu dia."
        className="overview-dashboard-heading overview-case-heading"
        meta={
          <span className="overview-demo-context">
            Demonstração · {scopeLabel}
          </span>
        }
        actions={
          <button className="overview-header-new-report" type="button" onClick={onNewReport}>
            <span aria-hidden="true">＋</span>
            Novo relatório
          </button>
        }
      />

      <section className="overview-kpi-grid overview-case-kpis" aria-label="Resumo do atendimento demonstrativo">
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
        <div className="overview-period-card" aria-label="Período do resumo">
          <OverviewIcon name="calendar" />
          <span>Atendimento atual</span>
        </div>
      </section>

      <section className="overview-case-layout">
        <article className="overview-atlas-panel overview-resume-card">
          <header className="overview-resume-heading">
            <div>
              <span className="section-kicker">CASO ATIVO</span>
              <h2>Continue de onde parou</h2>
              <p>O foco anatômico acompanha o problema confirmado neste relatório.</p>
            </div>
            <span className="overview-status-pill current">Em andamento</span>
          </header>

          <div className="overview-resume-grid">
            <div className="overview-atlas-stage overview-case-focus-stage" data-clinical-focus={report.finding.atlasConceptId || 'unconfirmed'}>
              <AnatomyFocusPreview
                conceptId={report.finding.atlasConceptId || undefined}
                label={focusLabel}
                eyebrow="FOCO CLÍNICO · HUMAN ATLAS 3D"
                contextMode="region"
                compact
                reviewRequired={report.finding.anatomyReviewRequired}
                onOpenAtlas={onOpenAtlas}
                description="Região anatômica vinculada ao problema do paciente, com contexto local de referência."
              />
            </div>

            <aside className="overview-case-progress" aria-label="Atendimento em andamento">
              <div className="overview-case-patient">
                <span className="overview-case-avatar">{patientInitials}</span>
                <div>
                  <span>RELATÓRIO ATUAL</span>
                  <h3>{report.patient.displayName}</h3>
                  <strong>{focusLabel}</strong>
                  <small>{report.title}</small>
                </div>
              </div>

              <div className="overview-case-focus-copy">
                <span className="section-kicker">FOCO DO CASO</span>
                <strong>{focusLabel}</strong>
                <p>{report.finding.sourceText || 'Adicione o laudo para definir o foco clínico.'}</p>
              </div>

              <div className="overview-case-flow-summary">
                <div>
                  <strong>{presentation.completed} de {presentation.total} etapas</strong>
                  <span>{presentation.progressPercent}% concluído</span>
                </div>
                <div
                  className="overview-case-progress-bar"
                  role="progressbar"
                  aria-label="Progresso do relatório"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={presentation.progressPercent}
                >
                  <span style={{ width: `${presentation.progressPercent}%` }} />
                </div>
              </div>

              <h3 className="overview-current-flow-heading">Atendimento em andamento</h3>
              <div className="overview-flow-list overview-case-flow-list">
                {presentation.steps.map((step, index) => (
                  <button key={step.id} type="button" onClick={step.id === 'anatomy' ? onOpenAtlas : onOpenReport}>
                    <span className="overview-flow-index">{step.done ? '✓' : String(index + 1)}</span>
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

              <div className="overview-next-action">
                <span>PRÓXIMA ETAPA</span>
                <strong>{currentStep?.label ?? 'Fluxo concluído'}</strong>
              </div>

              <button className="overview-continue-button" type="button" onClick={onOpenReport}>
                Continuar relatório <OverviewIcon name="arrow" />
              </button>
              <button className="overview-open-atlas-button" type="button" onClick={onOpenAtlas}>
                Abrir no Atlas 3D <OverviewIcon name="arrow" />
              </button>
            </aside>
          </div>
        </article>

        <aside className="overview-case-side-rail">
          <article className="overview-attention-panel">
            <header className="overview-panel-heading">
              <span className="overview-panel-icon"><OverviewIcon name="attention" /></span>
              <div>
                <h2>Precisa da sua atenção</h2>
                <p>{pendingSteps.length} {pendingSteps.length === 1 ? 'ação pendente' : 'ações pendentes'} no caso atual.</p>
              </div>
            </header>

            <div className="overview-attention-list">
              {(pendingSteps.length > 0 ? pendingSteps : presentation.steps.slice(-1)).map((step, index) => (
                <button type="button" key={step.id} onClick={step.id === 'anatomy' ? onOpenAtlas : onOpenReport}>
                  <span className="overview-attention-avatar">{patientInitials}</span>
                  <span>
                    <strong>{report.patient.displayName}</strong>
                    <small>{step.label} · {focusLabel}</small>
                  </span>
                  <i className={step.done ? 'done' : 'pending'}>{step.done ? 'Concluído' : 'Pendente'}</i>
                  <OverviewIcon name="arrow" />
                </button>
              ))}
            </div>
          </article>

          <article className="overview-insight-panel">
            <span className="overview-insight-icon"><OverviewIcon name="spark" /></span>
            <div>
              <h2>Uma boa explicação começa pelo olhar.</h2>
              <p>Explore o foco do caso em 3D e abra o corpo completo apenas quando precisar ampliar o contexto.</p>
            </div>
            <button type="button" onClick={onOpenAtlas}>
              Explorar Atlas 3D <OverviewIcon name="arrow" />
            </button>
          </article>
        </aside>
      </section>

      <section className="overview-recent-panel">
        <header className="overview-panel-heading">
          <span className="overview-panel-icon"><OverviewIcon name="report" /></span>
          <div>
            <h2>Relatório recente</h2>
            <p>Registro real disponível no cenário demonstrativo atual.</p>
          </div>
          <button className="overview-text-action" type="button" onClick={onOpenReport}>
            Ver relatório <OverviewIcon name="arrow" />
          </button>
        </header>

        <div className="overview-report-table" aria-label="Relatório demonstrativo atual">
          <div className="overview-report-row overview-report-row-head">
            <span>Paciente</span><span>Foco anatômico</span><span>Versão</span><span>Status</span>
          </div>
          <button className="overview-report-row" type="button" onClick={onOpenReport}>
            <span><b>{patientInitials}</b>{report.patient.displayName}</span>
            <span>{focusLabel}</span>
            <span>v{report.version}</span>
            <span><i className="overview-status-pill done">{presentation.statusLabel}</i></span>
          </button>
        </div>
      </section>
    </section>
  )
}
