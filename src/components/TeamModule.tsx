import {
  CAPABILITIES,
  DEMO_ORGANIZATION,
  ROLE_CAPABILITIES,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLE_ORDER,
} from '../organization/demo-organization'
import { WorkspacePageHeader } from './WorkspacePageHeader'

export function TeamModule() {
  const activeMembers = DEMO_ORGANIZATION.members.filter(
    (member) => member.active,
  )

  return (
    <section className="team-module workspace-page">
      <WorkspacePageHeader
        eyebrow="EQUIPE"
        title="Equipe e acessos"
        description="Veja quem está ativo e o que cada papel pode fazer."
        meta={
          <div className="team-hero-summary workspace-hero-badge">
            <strong>{activeMembers.length}</strong>
            <span>
              <small>membros ativos</small>
            </span>
          </div>
        }
      />

      <section className="team-roster" aria-label="Membros da organização">
        <header>
          <div>
            <span className="section-kicker">MEMBROS</span>
            <strong>{DEMO_ORGANIZATION.name}</strong>
          </div>
          <span>{activeMembers.length}</span>
        </header>

        <div className="team-member-list">
          {activeMembers.map((member) => (
            <article key={member.id}>
              <span className="team-avatar" aria-hidden="true">
                {member.initials}
              </span>
              <div className="team-member-copy">
                <strong>{member.displayName}</strong>
                <span>{member.professional?.specialty ?? 'Equipe'}</span>
              </div>
              <div className="team-member-role">
                <span className={`role-chip role-${member.role}`}>
                  {ROLE_LABELS[member.role]}
                </span>
                <small>{ROLE_DESCRIPTIONS[member.role]}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="permission-matrix">
        <header>
          <div>
            <span className="section-kicker">ACESSOS</span>
            <strong>Permissões por papel</strong>
          </div>
        </header>

        <div
          className="permission-table"
          role="table"
          aria-label="Matriz de permissões da equipe"
        >
          <div className="permission-row permission-head" role="row">
            <span role="columnheader">Papel</span>
            {CAPABILITIES.map((capability) => (
              <span role="columnheader" key={capability.id}>
                {capability.label}
              </span>
            ))}
          </div>

          {ROLE_ORDER.map((role) => {
            const granted = new Set(ROLE_CAPABILITIES[role])
            return (
              <div className="permission-row" role="row" key={role}>
                <strong role="rowheader">{ROLE_LABELS[role]}</strong>
                {CAPABILITIES.map((capability) => (
                  <span
                    role="cell"
                    className={
                      granted.has(capability.id)
                        ? 'permission-granted'
                        : 'permission-denied'
                    }
                    key={capability.id}
                    aria-label={
                      granted.has(capability.id) ? 'Permitido' : 'Não permitido'
                    }
                  >
                    <small className="permission-mobile-label">
                      {capability.label}
                    </small>
                    <b aria-hidden="true">
                      {granted.has(capability.id) ? '✓' : '—'}
                    </b>
                  </span>
                ))}
              </div>
            )
          })}
        </div>
      </section>
    </section>
  )
}
