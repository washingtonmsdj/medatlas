import {
  CAPABILITIES,
  DEMO_ORGANIZATION,
  ROLE_CAPABILITIES,
  ROLE_LABELS,
  type MedAtlasMemberRole,
} from '../organization/demo-organization'

const ROLE_ORDER: MedAtlasMemberRole[] = [
  'admin',
  'clinician',
  'staff',
]

function roleDescription(role: MedAtlasMemberRole) {
  if (role === 'admin') {
    return 'Pode escrever dados clínicos e administrar membros.'
  }

  if (role === 'clinician') {
    return 'Pode ler e escrever dados clínicos da organização.'
  }

  return 'Pode consultar dados permitidos, sem escrita clínica.'
}

export function TeamModule() {
  const activeMembers = DEMO_ORGANIZATION.members.filter(
    (member) => member.active,
  )

  return (
    <section className="team-module">
      <div className="team-hero">
        <div className="module-hero-copy">
          <span className="section-kicker">
            EQUIPE · CONTRATO SOURCE-FIRST
          </span>
          <h2>Equipe e permissões da organização</h2>
          <p>
            Visualização demonstrativa alinhada ao contrato de produção
            <code> organization_members </code>
            e aos papéis RLS canônicos. Nenhuma alteração é persistida neste
            MVP.
          </p>
        </div>

        <div className="team-hero-summary">
          <strong>{activeMembers.length}</strong>
          <span>
            <b>membros ativos</b>
            <small>{DEMO_ORGANIZATION.name} · dados fictícios</small>
          </span>
        </div>
      </div>

      <section className="team-toolbar" aria-label="Controles da equipe">
        <div>
          <span className="label">ORGANIZAÇÃO ATIVA</span>
          <strong>{DEMO_ORGANIZATION.name}</strong>
          <small>{DEMO_ORGANIZATION.slug}</small>
        </div>

        <div className="team-toolbar-actions">
          <button
            type="button"
            disabled
            title="Disponível somente após autenticação e backend de produção"
          >
            Alterar papéis
          </button>
          <button
            className="primary"
            type="button"
            disabled
            title="Disponível somente após autenticação e backend de produção"
          >
            Convidar membro
          </button>
        </div>
      </section>

      <div className="team-grid">
        <section className="team-roster" aria-label="Membros da organização">
          <header>
            <div>
              <span className="section-kicker">MEMBROS ATIVOS</span>
              <strong>Quem participa deste workspace</strong>
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
                  <span>
                    {member.professional?.specialty ??
                      'Operação / apoio clínico'}
                  </span>
                  {member.professional?.licenseNumber && (
                    <small>
                      Registro demonstrativo ·{' '}
                      {member.professional.licenseRegion}-
                      {member.professional.licenseNumber}
                    </small>
                  )}
                </div>

                <div className="team-member-role">
                  <span className={`role-chip role-${member.role}`}>
                    {ROLE_LABELS[member.role]}
                  </span>
                  <small>{roleDescription(member.role)}</small>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="team-boundary-card">
          <span className="section-kicker">MODO DEMONSTRAÇÃO</span>
          <h3>Permissões visíveis; mutações bloqueadas.</h3>
          <p>
            O frontend já usa os mesmos três papéis definidos na migration.
            Convites, ativação, remoção e troca de papel só serão habilitados
            quando houver usuário autenticado e RLS real.
          </p>

          <div className="team-boundary-items">
            <span>
              <i aria-hidden="true">✓</i>
              leitura do contrato de papéis
            </span>
            <span>
              <i aria-hidden="true">✓</i>
              profissionais separados de membership
            </span>
            <span className="blocked">
              <i aria-hidden="true">—</i>
              convite / alteração de membro
            </span>
            <span className="blocked">
              <i aria-hidden="true">—</i>
              persistência / autenticação
            </span>
          </div>
        </aside>
      </div>

      <section className="permission-matrix">
        <header>
          <div>
            <span className="section-kicker">MATRIZ RLS</span>
            <strong>Capacidades por papel</strong>
          </div>
          <small>
            Espelha <code>medatlas_is_org_member</code>,{' '}
            <code>medatlas_can_write_clinical</code> e a policy admin de
            membership.
          </small>
        </header>

        <div className="permission-table" role="table" aria-label="Matriz de permissões da equipe">
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
                      granted.has(capability.id)
                        ? 'Permitido'
                        : 'Não permitido'
                    }
                  >
                    {granted.has(capability.id) ? '✓' : '—'}
                  </span>
                ))}
              </div>
            )
          })}
        </div>
      </section>

      <section className="team-production-note">
        <span aria-hidden="true">i</span>
        <div>
          <strong>Próximo passo de produção</strong>
          <p>
            Conectar esta mesma superfície ao Supabase dedicado, carregar
            membership do usuário autenticado e provar isolamento entre
            organizações antes de habilitar qualquer botão de escrita.
          </p>
        </div>
      </section>
    </section>
  )
}
