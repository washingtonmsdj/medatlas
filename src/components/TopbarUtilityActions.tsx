import { useEffect, useRef, useState } from 'react'
import { deriveReportPresentation } from '../domain/report-presentation'
import type { VisualReport } from '../domain/types'

type PanelName = 'tasks' | 'profile' | null

interface Props {
  memberName: string
  initials: string
  specialty: string
  roleLabel: string
  workspaceName: string
  report: VisualReport
  onOpenReports: () => void
  onOpenAtlas: () => void
  onOpenTeam: () => void
  onOpenSettings: () => void
  onOpenPatientPreview: () => void
}

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m7 10 5 5 5-5" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m14 7 5 5-5 5" />
    </svg>
  )
}

export function TopbarUtilityActions({
  memberName,
  initials,
  specialty,
  roleLabel,
  workspaceName,
  report,
  onOpenReports,
  onOpenAtlas,
  onOpenTeam,
  onOpenSettings,
  onOpenPatientPreview,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [panel, setPanel] = useState<PanelName>(null)
  const presentation = deriveReportPresentation(report)
  const pendingSteps = presentation.steps.filter((step) => !step.done)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPanel(null)
    }

    const onPointerDown = (event: PointerEvent) => {
      if (
        rootRef.current &&
        event.target instanceof Node &&
        !rootRef.current.contains(event.target)
      ) {
        setPanel(null)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [])

  const toggle = (next: Exclude<PanelName, null>) => {
    setPanel((current) => (current === next ? null : next))
  }

  const run = (action: () => void) => {
    setPanel(null)
    action()
  }

  const runStep = (stepId: string) => {
    if (stepId === 'anatomy') {
      run(onOpenAtlas)
      return
    }

    run(onOpenReports)
  }

  return (
    <div className="topbar-actions topbar-utility-actions" ref={rootRef}>
      <div className="topbar-utility-anchor">
        <button
          type="button"
          className="topbar-icon-button notification-button"
          aria-label={
            pendingSteps.length > 0
              ? `${pendingSteps.length} ações pendentes`
              : 'Nenhuma ação pendente'
          }
          aria-expanded={panel === 'tasks'}
          aria-controls="medatlas-tasks-panel"
          onClick={() => toggle('tasks')}
        >
          <span aria-hidden="true">
            <BellIcon />
          </span>
          {pendingSteps.length > 0 && <i />}
        </button>

        {panel === 'tasks' && (
          <section
            className="topbar-popover task-center-popover"
            id="medatlas-tasks-panel"
            role="dialog"
            aria-label="Ações pendentes do relatório"
          >
            <header>
              <div>
                <strong>Ações pendentes</strong>
                <small>{report.patient.displayName}</small>
              </div>
              <span className="topbar-popover-count">{pendingSteps.length}</span>
            </header>

            {pendingSteps.length > 0 ? (
              pendingSteps.map((step, index) => (
                <button
                  className={`notification-item ${index === 0 ? 'urgent' : ''}`}
                  type="button"
                  key={step.id}
                  onClick={() => runStep(step.id)}
                >
                  <span aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <strong>{step.label}</strong>
                    <small>{step.detail}</small>
                  </div>
                  <b aria-hidden="true">
                    <ArrowIcon />
                  </b>
                </button>
              ))
            ) : (
              <div className="task-center-complete">
                <span aria-hidden="true">✓</span>
                <div>
                  <strong>Relatório concluído</strong>
                  <small>Nenhuma ação pendente.</small>
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      <div className="topbar-utility-anchor profile-anchor">
        <button
          className="doctor-chip"
          type="button"
          aria-label="Abrir menu do profissional"
          aria-expanded={panel === 'profile'}
          aria-controls="medatlas-profile-panel"
          onClick={() => toggle('profile')}
        >
          <span>{initials}</span>
          <div>
            <strong>{memberName}</strong>
            <small>{specialty}</small>
          </div>
          <b aria-hidden="true">
            <ChevronIcon />
          </b>
        </button>

        {panel === 'profile' && (
          <section
            className="topbar-popover profile-popover"
            id="medatlas-profile-panel"
            role="dialog"
            aria-label="Perfil do profissional"
          >
            <header className="profile-popover-header">
              <span>{initials}</span>
              <div>
                <strong>{memberName}</strong>
                <small>{specialty}</small>
              </div>
            </header>

            <dl className="profile-popover-facts">
              <div>
                <dt>Papel</dt>
                <dd>{roleLabel}</dd>
              </div>
              <div>
                <dt>Área</dt>
                <dd>{workspaceName}</dd>
              </div>
              <div>
                <dt>Ambiente</dt>
                <dd>Demo</dd>
              </div>
            </dl>

            <div className="profile-popover-actions">
              <button type="button" onClick={() => run(onOpenPatientPreview)}>
                Visualizar como paciente
              </button>
              <button type="button" onClick={() => run(onOpenTeam)}>
                Equipe e permissões
              </button>
              <button type="button" onClick={() => run(onOpenSettings)}>
                Configurações
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
