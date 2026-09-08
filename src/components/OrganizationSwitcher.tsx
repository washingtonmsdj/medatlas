import { useMemo, useState } from 'react'
import {
  DEMO_ORGANIZATION,
  DEMO_ORGANIZATION_BRANDING,
  getDemoUnit,
  type DemoClinicalWorkspace,
} from '../organization/demo-organization'

interface Props {
  activeWorkspaceId: string
  onWorkspaceChange: (workspaceId: string) => void
}

export function OrganizationSwitcher({
  activeWorkspaceId,
  onWorkspaceChange,
}: Props) {
  const [open, setOpen] = useState(false)

  const activeWorkspace = useMemo(
    () =>
      DEMO_ORGANIZATION.workspaces.find(
        (workspace) =>
          workspace.id === activeWorkspaceId && workspace.active,
      ) ?? DEMO_ORGANIZATION.workspaces.find((workspace) => workspace.active),
    [activeWorkspaceId],
  )

  const activeUnit = getDemoUnit(activeWorkspace?.unitId)

  const grouped = useMemo(() => {
    return DEMO_ORGANIZATION.units
      .filter((unit) => unit.active)
      .map((unit) => ({
        unit,
        workspaces: DEMO_ORGANIZATION.workspaces.filter(
          (workspace) =>
            workspace.active && workspace.unitId === unit.id,
        ),
      }))
  }, [])

  const choose = (workspace: DemoClinicalWorkspace) => {
    onWorkspaceChange(workspace.id)
    setOpen(false)
  }

  return (
    <div className="organization-switcher-shell">
      <button
        className="org-switcher"
        type="button"
        aria-label={`Organização ativa: ${DEMO_ORGANIZATION.name}, ${activeWorkspace?.name ?? 'sem workspace'}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span
          className="org-switcher-mark"
          style={{ background: DEMO_ORGANIZATION_BRANDING.primaryColorHex }}
        >
          {DEMO_ORGANIZATION_BRANDING.markText}
        </span>
        <span>
          <strong>{DEMO_ORGANIZATION.name}</strong>
          <small>
            {activeWorkspace?.name ?? 'Sem workspace'}
            {activeUnit ? ` · ${activeUnit.name}` : ''}
          </small>
        </span>
        <b aria-hidden="true">{open ? '⌃' : '⌄'}</b>
      </button>

      {open && (
        <section
          className="organization-switcher-popover"
          role="dialog"
          aria-label="Selecionar unidade e workspace"
        >
          <header>
            <div>
              <span className="section-kicker">CONTEXTO ATIVO</span>
              <strong>{DEMO_ORGANIZATION.name}</strong>
              <small>
                Escolha a área de trabalho
              </small>
            </div>
            <button
              type="button"
              aria-label="Fechar seletor de organização"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </header>

          <div className="organization-switcher-groups">
            {grouped.map(({ unit, workspaces }) => (
              <section key={unit.id}>
                <div className="organization-unit-heading">
                  <span aria-hidden="true">U</span>
                  <div>
                    <strong>{unit.name}</strong>
                    <small>
                      {[unit.city, unit.region, unit.countryCode]
                        .filter(Boolean)
                        .join(' · ')}
                    </small>
                  </div>
                </div>

                <div className="organization-workspace-list">
                  {workspaces.map((workspace) => {
                    const active = workspace.id === activeWorkspace?.id

                    return (
                      <button
                        type="button"
                        key={workspace.id}
                        className={active ? 'active' : ''}
                        aria-pressed={active}
                        onClick={() => choose(workspace)}
                      >
                        <span aria-hidden="true">
                          {workspace.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <strong>{workspace.name}</strong>
                          <small>
                            {workspace.specialty ??
                              'Workspace clínico'}
                          </small>
                        </div>
                        <i aria-hidden="true">
                          {active ? '✓' : '→'}
                        </i>
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>

          <footer>
            <span>Ambiente demonstrativo</span>
            <small>Dados fictícios</small>
          </footer>
        </section>
      )}
    </div>
  )
}
