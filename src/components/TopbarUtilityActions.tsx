import { useEffect, useRef, useState } from 'react'

type PanelName = 'help' | 'notifications' | 'profile' | null

interface Props {
  memberName: string
  initials: string
  specialty: string
  roleLabel: string
  workspaceName: string
  onOpenReports: () => void
  onOpenExams: () => void
  onOpenTeam: () => void
  onOpenSettings: () => void
}

export function TopbarUtilityActions({
  memberName,
  initials,
  specialty,
  roleLabel,
  workspaceName,
  onOpenReports,
  onOpenExams,
  onOpenTeam,
  onOpenSettings,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [panel, setPanel] = useState<PanelName>(null)

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
                <small>Fluxo clínico visual do MVP</small>
              </div>
            </header>

            <ol className="help-flow-list">
              <li>
                <span>01</span>
                <div>
                  <strong>Importe o texto</strong>
                  <small>Cole ou abra um .txt/.md sintético.</small>
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
                  <small>O profissional continua sendo a autoridade.</small>
                </div>
              </li>
            </ol>

            <div className="topbar-shortcuts">
              <span><kbd>Ctrl/⌘ K</kbd> busca global</span>
              <span><kbd>Esc</kbd> fechar painéis</span>
            </div>

            <button
              type="button"
              onClick={() => run(onOpenReports)}
            >
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
          <i />
        </button>

        {panel === 'notifications' && (
          <section
            className="topbar-popover notifications-popover"
            id="medatlas-notifications-panel"
            role="dialog"
            aria-label="Notificações demonstrativas"
          >
            <header>
              <div>
                <strong>Precisa da sua atenção</strong>
                <small>Dados exclusivamente sintéticos</small>
              </div>
              <span className="topbar-popover-count">2</span>
            </header>

            <button
              className="notification-item urgent"
              type="button"
              onClick={() => run(onOpenReports)}
            >
              <span aria-hidden="true">!</span>
              <div>
                <strong>Relatório atual pronto para revisão</strong>
                <small>Confirme a etapa clínica antes de compartilhar.</small>
              </div>
              <b aria-hidden="true">→</b>
            </button>

            <button
              className="notification-item"
              type="button"
              onClick={() => run(onOpenExams)}
            >
              <span aria-hidden="true">2</span>
              <div>
                <strong>Novos exames sintéticos</strong>
                <small>Aguardando triagem no módulo Exames.</small>
              </div>
              <b aria-hidden="true">→</b>
            </button>

            <footer>
              Nenhuma notificação é persistida neste MVP.
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
