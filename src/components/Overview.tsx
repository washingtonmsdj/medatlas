import { useMemo, useState } from 'react'
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
  | 'report'
  | 'review'
  | 'ready'
  | 'share'
  | 'clock'
  | 'eye'
  | 'arrow'
  | 'upload'
  | 'spark'
  | 'more'

function OverviewIcon({ name }: { name: IconName }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  switch (name) {
    case 'report':
      return <svg {...common}><path d="M6 3h9l3 3v15H6z" /><path d="M15 3v4h4M9 11h6M9 15h6" /></svg>
    case 'review':
      return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></svg>
    case 'ready':
      return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12.3 2.3 2.3 4.8-5" /></svg>
    case 'share':
      return <svg {...common}><circle cx="18" cy="5" r="2" /><circle cx="6" cy="12" r="2" /><circle cx="18" cy="19" r="2" /><path d="m7.7 11 8.6-5M7.7 13l8.6 5" /></svg>
    case 'clock':
      return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></svg>
    case 'eye':
      return <svg {...common}><path d="M2.5 12s3.4-5 9.5-5 9.5 5 9.5 5-3.4 5-9.5 5-9.5-5-9.5-5Z" /><circle cx="12" cy="12" r="2.5" /></svg>
    case 'arrow':
      return <svg {...common}><path d="M5 12h14M14 7l5 5-5 5" /></svg>
    case 'upload':
      return <svg {...common}><path d="M12 16V4M8 8l4-4 4 4" /><path d="M5 14v5h14v-5" /></svg>
    case 'spark':
      return <svg {...common}><path d="M12 3c.8 4.6 2.4 6.2 7 7-4.6.8-6.2 2.4-7 7-.8-4.6-2.4-6.2-7-7 4.6-.8 6.2-2.4 7-7Z" /></svg>
    case 'more':
      return <svg {...common}><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></svg>
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

type QueueState = 'review' | 'anatomy' | 'ready' | 'shared'
type QueueFilter = 'all' | 'in-progress' | 'review' | 'ready' | 'shared'

interface QueueItem {
  id: string
  name: string
  initials: string
  report: string
  anatomy: string
  step: string
  wait: string
  state: QueueState
  action: string
  owner: string
}

const statusLabel: Record<QueueState, string> = {
  review: 'Revisão pendente',
  anatomy: 'Anatomia pendente',
  ready: 'Pronto',
  shared: 'Compartilhado',
}

const actionFor: Record<QueueState, string> = {
  review: 'Revisar',
  anatomy: 'Confirmar',
  ready: 'Compartilhar',
  shared: 'Abrir',
}

function statusClass(state: QueueState) {
  return state === 'review' || state === 'anatomy'
    ? 'is-pending'
    : state === 'shared'
      ? 'is-shared'
      : 'is-ready'
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
  const [scopeMode, setScopeMode] = useState<'personal' | 'clinic'>('personal')
  const [queueTab, setQueueTab] = useState<'pending' | 'all'>('pending')
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('all')
  const [namesHidden, setNamesHidden] = useState(false)
  const [responsibleFilter, setResponsibleFilter] = useState('all')
  const currentPatientInitials = initials(report.patient.displayName)
  const focusLabel = report.finding.atlasConceptId
    ? report.finding.anatomicalStructure
    : 'Anatomia ainda não confirmada'
  const currentStep = presentation.currentStep
  const currentState: QueueState = report.finding.anatomyReviewRequired
    ? 'anatomy'
    : currentStep?.id === 'share'
      ? 'ready'
      : report.status === 'published'
        ? 'shared'
        : 'review'

  const queueRows = useMemo<QueueItem[]>(
    () => [
      {
        id: report.id,
        name: report.patient.displayName,
        initials: currentPatientInitials,
        report: report.title,
        anatomy: focusLabel.replace('Disco intervertebral ', ''),
        step: currentStep?.shortLabel ?? 'Publicação',
        wait: '12 min',
        state: currentState,
        action: actionFor[currentState],
        owner: professionalDisplayName,
      },
      {
        id: 'demo_ana_souza',
        name: 'Ana Souza',
        initials: 'AS',
        report: 'Coluna lombar',
        anatomy: 'L4–L5',
        step: 'Explicação',
        wait: '2 h',
        state: 'review',
        action: actionFor.review,
        owner: 'Dra. Helena Ribeiro',
      },
      {
        id: 'demo_pedro_lima',
        name: 'Pedro Lima',
        initials: 'PL',
        report: 'Joelho direito',
        anatomy: 'Menisco medial',
        step: 'Anatomia',
        wait: '45 min',
        state: 'anatomy',
        action: actionFor.anatomy,
        owner: 'Dr. Carlos Mendes',
      },
      {
        id: 'demo_lucas_alves',
        name: 'Lucas Alves',
        initials: 'LA',
        report: 'Coluna cervical',
        anatomy: 'C5–C6',
        step: 'Publicação',
        wait: '15 min',
        state: 'ready',
        action: actionFor.ready,
        owner: 'Dra. Helena Ribeiro',
      },
      {
        id: 'demo_carolina_mendes',
        name: 'Carolina Mendes',
        initials: 'CM',
        report: 'Ombro esquerdo',
        anatomy: 'Manguito rotador',
        step: 'Paciente',
        wait: '1 h',
        state: 'shared',
        action: actionFor.shared,
        owner: 'Dr. Carlos Mendes',
      },
    ],
    [currentPatientInitials, currentState, currentStep?.shortLabel, focusLabel, professionalDisplayName, report.id, report.patient.displayName, report.title],
  )

  const visibleRows = queueRows.filter((row) => {
    if (queueFilter === 'in-progress' && row.state !== 'review' && row.state !== 'anatomy') return false
    if (queueFilter === 'review' && row.state !== 'review') return false
    if (queueFilter === 'ready' && row.state !== 'ready') return false
    if (queueFilter === 'shared' && row.state !== 'shared') return false
    if (queueTab === 'pending' && row.state === 'shared') return false
    if (responsibleFilter !== 'all' && row.owner !== responsibleFilter) return false
    return true
  })

  const displayName = (name: string) => namesHidden ? 'Nome oculto' : name
  const rowAction = (row: QueueItem) => {
    if (row.id === report.id && row.state === 'anatomy') {
      onOpenAtlas()
      return
    }
    onOpenReport()
  }

  const selectKpi = (filter: QueueFilter) => {
    setQueueTab('all')
    setQueueFilter(filter)
    document.querySelector('.overview-work-queue-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="overview-dashboard overview-case-dashboard overview-concept-dashboard workspace-page">
      <h2 className="overview-compat-heading">Atendimento em andamento</h2>

      <WorkspacePageHeader
        eyebrow={overviewDateLabel()}
        title="Seu dia, com clareza."
        description="Retome casos, revise explicações e acompanhe os compartilhamentos."
        className="overview-dashboard-heading overview-concept-heading"
        actions={
          <div className="overview-header-actions">
            <button className="overview-import-report" type="button" onClick={onNewReport}><OverviewIcon name="upload" />Importar laudo</button>
            <button className="overview-header-new-report" type="button" onClick={onNewReport}><span aria-hidden="true">＋</span>Novo relatório</button>
          </div>
        }
      />

      <div className="overview-concept-toolbar">
        <div className="overview-scope-toggle" role="group" aria-label="Escopo da visão geral">
          <button type="button" className={scopeMode === 'personal' ? 'active' : ''} aria-pressed={scopeMode === 'personal'} onClick={() => setScopeMode('personal')}>Meu trabalho</button>
          <button type="button" className={scopeMode === 'clinic' ? 'active' : ''} aria-pressed={scopeMode === 'clinic'} onClick={() => setScopeMode('clinic')}>Clínica</button>
        </div>
        <label className="overview-filter-select"><span className="overview-visually-hidden">Período</span><select defaultValue="today" aria-label="Período"><option value="today">Hoje</option><option value="week">Esta semana</option></select></label>
        <label className="overview-filter-select"><span className="overview-visually-hidden">Unidade</span><select defaultValue="unit" aria-label="Unidade"><option value="unit">Minha unidade</option><option value="all">Todas as unidades</option></select></label>
        {scopeMode === 'clinic' && <label className="overview-filter-select"><span className="overview-visually-hidden">Responsável</span><select value={responsibleFilter} onChange={(event) => setResponsibleFilter(event.target.value)} aria-label="Responsável"><option value="all">Toda equipe</option><option value="Dra. Helena Ribeiro">Dra. Helena</option><option value="Dr. Carlos Mendes">Dr. Carlos</option></select></label>}
        <button className="overview-hide-names" type="button" aria-pressed={namesHidden} onClick={() => setNamesHidden((current) => !current)}><OverviewIcon name="eye" />{namesHidden ? 'Mostrar nomes' : 'Ocultar nomes'}</button>
      </div>

      <section className="overview-kpi-grid overview-concept-kpis" aria-label="Indicadores acionáveis">
        <button type="button" className={`overview-kpi-card overview-action-kpi ${queueFilter === 'in-progress' ? 'selected' : ''}`} onClick={() => selectKpi('in-progress')}><span className="overview-kpi-icon"><OverviewIcon name="report" /></span><strong>8</strong><span>Em andamento</span></button>
        <button type="button" className={`overview-kpi-card overview-action-kpi ${queueFilter === 'review' ? 'selected' : ''}`} onClick={() => selectKpi('review')}><span className="overview-kpi-icon is-coral"><OverviewIcon name="review" /></span><strong>3</strong><span>Aguardando revisão</span></button>
        <button type="button" className={`overview-kpi-card overview-action-kpi ${queueFilter === 'ready' ? 'selected' : ''}`} onClick={() => selectKpi('ready')}><span className="overview-kpi-icon"><OverviewIcon name="ready" /></span><strong>2</strong><span>Prontos para compartilhar</span></button>
        <button type="button" className={`overview-kpi-card overview-action-kpi ${queueFilter === 'shared' ? 'selected' : ''}`} onClick={() => selectKpi('shared')}><span className="overview-kpi-icon"><OverviewIcon name="share" /></span><strong>5</strong><span>Compartilhados hoje</span></button>
      </section>

      <section className="overview-concept-main-grid">
        <article className="overview-work-queue-panel">
          <header className="overview-concept-panel-heading"><div><span className="section-kicker">PRÓXIMA AÇÃO</span><h2>Sua fila de trabalho</h2><p>Priorize pela próxima ação</p></div><span className="overview-demo-badge">{scopeMode === 'clinic' ? 'Visão da clínica' : 'Meu trabalho'}</span></header>
          <div className="overview-queue-toolbar"><div className="overview-queue-tabs" role="tablist" aria-label="Filtro da fila"><button type="button" role="tab" aria-selected={queueTab === 'pending'} className={queueTab === 'pending' ? 'active' : ''} onClick={() => { setQueueTab('pending'); setQueueFilter('all') }}>Pendentes <b>5</b></button><button type="button" role="tab" aria-selected={queueTab === 'all'} className={queueTab === 'all' ? 'active' : ''} onClick={() => { setQueueTab('all'); setQueueFilter('all') }}>Todos</button></div>{queueFilter !== 'all' && <button type="button" className="overview-clear-filter" onClick={() => setQueueFilter('all')}>Limpar filtro</button>}</div>
          <div className="overview-queue-table" aria-label="Fila de trabalho demonstrativa">
            <div className="overview-queue-row overview-queue-head"><span>Paciente / relatório</span><span>Etapa</span><span>Espera</span><span>Próxima ação</span><span aria-hidden="true" /></div>
            {visibleRows.map((row) => <div className={`overview-queue-row ${row.id === report.id ? 'is-current' : ''}`} key={row.id}><button className="overview-queue-patient" type="button" onClick={() => rowAction(row)}><b>{row.initials}</b><span><strong>{displayName(row.name)}</strong><small>{row.report} · {row.anatomy}</small></span></button><span className={`overview-queue-status ${statusClass(row.state)}`}>{statusLabel[row.state]}</span><span className="overview-queue-wait"><OverviewIcon name="clock" />{row.wait}</span><button className="overview-queue-action" type="button" onClick={() => rowAction(row)}>{row.action}</button><button className="overview-queue-more" type="button" aria-label={`Mais ações para ${displayName(row.name)}`}><OverviewIcon name="more" /></button></div>)}
            {visibleRows.length === 0 && <p className="overview-queue-empty">Nenhum relatório corresponde a este filtro.</p>}
          </div>
          <button type="button" className="overview-queue-footer" onClick={() => { setQueueTab('all'); setQueueFilter('all') }}>Ver todos os relatórios <OverviewIcon name="arrow" /></button>
        </article>

        <article className="overview-atlas-panel overview-resume-panel">
          <header className="overview-concept-panel-heading overview-resume-panel-heading"><div><span className="section-kicker">CASO SELECIONADO</span><h2>Retomar caso</h2></div><span className="overview-status-pill is-ready">Em andamento</span></header>
          <div className="overview-resume-patient"><span className="overview-resume-avatar">{currentPatientInitials}</span><div><strong>{displayName(report.patient.displayName)}</strong><small>Última edição há 20 min</small></div></div>
          <div className="overview-resume-atlas-stage"><AnatomyFocusPreview conceptId={report.finding.atlasConceptId || undefined} label={focusLabel} eyebrow="HUMAN ATLAS 3D" contextMode="region" compact reviewRequired={report.finding.anatomyReviewRequired} onOpenAtlas={onOpenAtlas} description="Anatomia de referência ligada ao caso selecionado." /></div>
          <div className="overview-resume-flow" aria-label="Etapas do caso">{presentation.steps.map((step, index) => <button key={step.id} type="button" className={step.done ? 'done' : step.state === 'current' ? 'current' : ''} onClick={step.id === 'anatomy' ? onOpenAtlas : onOpenReport}><span>{step.done ? '✓' : index + 1}</span><small>{step.shortLabel}</small></button>)}</div>
          <div className="overview-resume-next"><span>PRÓXIMA AÇÃO</span><strong>{currentStep?.label ?? 'Relatório concluído'}</strong></div>
          <button className="overview-continue-button" type="button" onClick={onOpenReport}>Continuar revisão <OverviewIcon name="arrow" /></button>
          <button className="overview-open-atlas-button" type="button" onClick={onOpenAtlas}>Abrir Atlas 3D</button>
        </article>
      </section>

      <section className="overview-concept-lower-grid">
        <article className="overview-share-panel"><header className="overview-concept-panel-heading"><div><span className="section-kicker">LINKS DO PACIENTE</span><h2>Após o compartilhamento</h2></div><button type="button" className="overview-text-action" onClick={() => selectKpi('shared')}>Ver compartilhamentos <OverviewIcon name="arrow" /></button></header><div className="overview-share-stats"><div><span className="overview-share-icon"><OverviewIcon name="eye" /></span><strong>3</strong><small>com abertura registrada</small></div><div><span className="overview-share-icon muted"><OverviewIcon name="eye" /></span><strong>2</strong><small>sem abertura registrada</small></div><div className="is-expired"><span className="overview-share-icon"><OverviewIcon name="share" /></span><strong>1</strong><small>link expirado</small></div></div><p className="overview-share-note">Abertura do link não confirma compreensão.</p></article>
        <article className="overview-activity-panel"><header className="overview-concept-panel-heading"><div><span className="section-kicker">EQUIPE</span><h2>Atividade da equipe</h2></div></header><div className="overview-activity-list"><div><span className="overview-activity-dot" /><small>09:42</small><p><strong>Dra. Helena</strong> revisou um relatório</p></div><div><span className="overview-activity-dot" /><small>09:18</small><p><strong>Dr. Carlos</strong> compartilhou uma explicação</p></div></div></article>
      </section>

      <p className="overview-concept-footnote">Conceito de interface · Dados demonstrativos</p>
    </section>
  )
}
