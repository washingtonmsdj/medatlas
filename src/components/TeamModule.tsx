import {
  CAPABILITIES,
  DEMO_ORGANIZATION,
  ROLE_CAPABILITIES,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLE_ORDER,
} from '../organization/demo-organization'

export function TeamModule() {
  const activeMembers = DEMO_ORGANIZATION.members.filter(
    (member) => member.active,
  )
  const activeUnits = DEMO_ORGANIZATION.units.filter((unit) => unit.active)
  const activeWorkspaces = DEMO_ORGANIZATION.workspaces.filter(
    (workspace) => workspace.active,
  )

  return (
    <section className="team-module module-v3">
      <div className="team-hero workspace-hero-v3">
        <div className="module-hero-copy">
          <span className="section-kicker">
            EQUIPE · ORGANIZAÇÃO
          </span>
          <h2>Equipe e permissões da organização</h2>
          <p>
            Papéis, unidades e workspaces demonstrativos usam o mesmo modelo
            organizacional preparado para produção. Operações de escrita
            continuam indisponíveis sem autenticação e RLS ativos.
          </p>
        </div>

        <div className="team-hero-summary workspace-hero-badge">
          <strong>{activeMembers.length}</strong>
          <span>
            <b>membros ativos</b>
            <small>{DEMO_ORGANIZATION.name} · dados fictícios</small>
          </span>
        </div>
      </div>

      <section className="team-toolbar team-toolbar-v3" aria-label="Controles da equipe">
        <div>
          <span className="label">ORGANIZAÇÃO ATIVA</span>
          <strong>{DEMO_ORGANIZATION.name}</strong>
          <small>
            {activeUnits.length} unidade(s) · {activeWorkspaces.length} workspace(s)
          </small>
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
            title="O contrato seguro está pronto; o envio depende de autenticação e backend ativos"
          >
            Convidar membro
          </button>
        </div>
      </section>

      <div className="team-grid team-grid-v3">
        <section className="team-roster" aria-label="Membros da organização">
          <header>
            <div>
              <span className="section-kicker">MEMBROS ATIVOS</span>
              <strong>Quem participa deste ambiente</strong>
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
                  <small>{ROLE_DESCRIPTIONS[member.role]}</small>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="team-boundary-card module-boundary-v3">
          <span className="section-kicker">MODO DEMONSTRAÇÃO</span>
          <h3>Permissões visíveis; mutações bloqueadas.</h3>
          <p>
            O frontend mostra capacidades reais do modelo de papéis, mas não
            finge convites, alteração de membership ou autenticação.
          </p>

          <div className="team-boundary-items">
            <span>
              <i aria-hidden="true">✓</i>
              leitura de papéis e capacidades
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

      <section
        className="team-invitation-contract"
        aria-label="Contrato seguro de convites"
      >
        <header>
          <div>
            <span className="section-kicker">CONVITES · SOURCE READY</span>
            <strong>Contrato seguro pronto; transporte ainda bloqueado</strong>
          </div>
          <span className="invitation-contract-status">backend necessário</span>
        </header>

        <div className="invitation-contract-grid">
          {[
            [
              'Somente administrador',
              'Criar e revogar convites exige autoridade administrativa na organização.',
            ],
            [
              'Token protegido',
              'O segredo bruto é entregue uma única vez; a persistência usa somente hash.',
            ],
            [
              'Aceite vinculado à identidade',
              'O usuário autenticado só aceita convite compatível com sua sessão.',
            ],
            [
              'Expiração e auditoria',
              'Criação, aceite e revogação mantêm estado verificável e fail-closed.',
            ],
          ].map(([title, description], index) => (
            <article key={title}>
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <strong>{title}</strong>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>

        <footer>
          <span>
            Nenhum e-mail é enviado e nenhum membro é criado no modo demo.
          </span>
          <code>organization_invitations</code>
        </footer>
      </section>

      <section className="organization-structure-card">
        <header>
          <div>
            <span className="section-kicker">ESTRUTURA DA ORGANIZAÇÃO</span>
            <strong>Unidades e workspaces clínicos</strong>
          </div>
          <small>Estrutura demonstrativa source-first</small>
        </header>

        <div className="organization-structure-tree">
          {activeUnits.map((unit) => {
            const workspaces = activeWorkspaces.filter(
              (workspace) => workspace.unitId === unit.id,
            )

            return (
              <article key={unit.id}>
                <div className="organization-structure-unit">
                  <span aria-hidden="true">U</span>
                  <div>
                    <strong>{unit.name}</strong>
                    <small>
                      {[unit.city, unit.region, unit.countryCode]
                        .filter(Boolean)
                        .join(' · ')}
                    </small>
                  </div>
                  <b>{workspaces.length} workspaces</b>
                </div>

                <div className="organization-structure-workspaces">
                  {workspaces.map((workspace) => (
                    <span key={workspace.id}>
                      <i aria-hidden="true">
                        {workspace.name.slice(0, 2).toUpperCase()}
                      </i>
                      <span>
                        <strong>{workspace.name}</strong>
                        <small>
                          {workspace.specialty ?? 'Workspace clínico'}
                        </small>
                      </span>
                    </span>
                  ))}
                </div>
              </article>
            )
          })}
        </div>

        <footer>
          <span>
            Inclusão, edição e remoção só serão habilitadas com autoridade
            administrativa real.
          </span>
          <button
            type="button"
            disabled
            title="Disponível somente após autenticação e backend de produção"
          >
            Gerenciar estrutura
          </button>
        </footer>
      </section>

      <section className="permission-matrix">
        <header>
          <div>
            <span className="section-kicker">MATRIZ DE ACESSO</span>
            <strong>Capacidades por papel</strong>
          </div>
          <small>Contrato visual alinhado às políticas de produção.</small>
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

      <section className="team-production-note module-boundary-v3">
        <span aria-hidden="true">i</span>
        <div>
          <strong>Próximo passo de produção</strong>
          <p>
            Conectar esta mesma superfície ao backend dedicado e provar
            isolamento entre organizações antes de habilitar qualquer ação de
            escrita.
          </p>
        </div>
      </section>
    </section>
  )
}
