import { useEffect, useRef, useState } from 'react'
import { deriveReportPresentation } from '../domain/report-presentation'
import type { VisualReport } from '../domain/types'

type PanelName = 'help' | 'notifications' | 'profile' | null

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
          className="topbar-icon-button"
          aria-label="Ajuda"
          aria-expanded={panel === 'help'}
          aria-controls="medatlas-help-panel"
          onClick={() => toggle('help')}
        >
          ?
        </button>

        {panel === 'help' && (
          <section
            className="topbar-popover help-popover"
            id="medatlas-help-panel"
            role="dialog"
            aria-label="Ajuda rápida do MedAtlas"
          >
            <header>
              <span className="topbar-popover-icon" aria-hidden="true">?</span>
              <div>
                <strong>Ajuda rápida</strong>
                <small>Fluxo do relatório</small>
              </div>
            </header>

            <ol className="help-flow-list">
              <li>
                <span>01</span>
                <div>
                  <strong>Adicione o laudo</strong>
                  <small>Cole o texto ou importe um arquivo.</small>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Confirme a anatomia</strong>
                  <small>Use Human Atlas/FMA como referência visual.</small>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Revise e compartilhe</strong>
                  <small>Confira a explicação e libere o link.</small>
                </div>
              </li>
            </ol>

            <div className="topbar-shortcuts">
              <span><kbd>Ctrl/⌘ K</kbd> busca global</span>
              <span><kbd>Esc</kbd> fechar painéis</span>
            </div>

            <button type="button" onClick={() => run(onOpenReports)}>
              Abrir fluxo de relatório
              <b aria-hidden="true">→</b>
            </button>
          </section>
        )}
      </div>

      <div className="topbar-utility-anchor">
        <button
          type="button"
          className="topbar-icon-button notification-button"
          aria-label="Notificações"
          aria-expanded={panel === 'notifications'}
          aria-controls="medatlas-notifications-panel"
          onClick={() => toggle('notifications')}
        >
          <span aria-hidden="true">♢</span>
          {pendingSteps.length > 0 && <i />}
        </button>

        {panel === 'notifications' && (
          <section
            className="topbar-popover notifications-popover task-center-popover"
            id="medatlas-notifications-panel"
            role="dialog"
            aria-label="Ações pendentes do relatório"
          >
            <header>
              <div>
                <strong>Ações pendentes</strong>
                <small>{report.title}</small>
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
                  <b aria-hidden="true">→</b>
                </button>
              ))
            ) : (
              <div className="task-center-complete">
                <span aria-hidden="true">✓</span>
                <div>
                  <strong>Nenhuma ação pendente</strong>
                  <small>Todos os gates do relatório atual foram concluídos.</small>
                </div>
              </div>
            )}

            <footer>
              Esta lista é derivada do relatório atual e não simula eventos de backend.
            </footer>
          </section>
        )}
      </div>

      <div className="topbar-utility-anchor profile-anchor">
        <button
          className="doctor-chip doctor-chip-button"
          type="button"
          aria-label="Abrir menu do profissional"
          aria-expanded={panel === 'profile'}
          aria-controls="medatlas-profile-panel"
          onClick={() => toggle('profile')}
        >
          <span>{initials}</span>
          <div>
            <strong>{memberName}</strong>
            <small>{specialty} · demonstração</small>
          </div>
          <b aria-hidden="true">⌄</b>
        </button>

        {panel === 'profile' && (
          <section
            className="topbar-popover profile-popover"
            id="medatlas-profile-panel"
            role="dialog"
            aria-label="Perfil demonstrativo do profissional"
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
                <dt>Workspace</dt>
                <dd>{workspaceName}</dd>
              </div>
              <div>
                <dt>Ambiente</dt>
                <dd>Demo sintética</dd>
              </div>
            </dl>

            <div className="profile-popover-actions">
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
