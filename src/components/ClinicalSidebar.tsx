export type ClinicalModuleName =
  | 'Visão geral'
  | 'Pacientes'
  | 'Relatórios visuais'
  | 'Atlas 3D'
  | 'Analytics'
  | 'Equipe'
  | 'Configurações'

export const CLINICAL_NAV_ITEMS = [
  'Visão geral',
  'Pacientes',
  'Relatórios visuais',
  'Atlas 3D',
  'Analytics',
  'Equipe',
  'Configurações',
] as const satisfies readonly ClinicalModuleName[]

const NAV_GROUPS: ReadonlyArray<{
  label: string
  items: readonly ClinicalModuleName[]
}> = [
  {
    label: 'Clínica',
    items: ['Visão geral', 'Pacientes', 'Relatórios visuais', 'Atlas 3D'],
  },
  {
    label: 'Gestão',
    items: ['Analytics', 'Equipe', 'Configurações'],
  },
]

interface Props {
  active: ClinicalModuleName
  organizationName: string
  workspaceName: string
  unitName?: string
  onNavigate: (module: ClinicalModuleName) => void
  onNewReport: () => void
}

function SidebarIcon({ item }: { item: ClinicalModuleName }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  switch (item) {
    case 'Visão geral':
      return (
        <svg {...common}>
          <path d="M4 10.5 12 4l8 6.5V20H4z" />
          <path d="M9 20v-6h6v6" />
        </svg>
      )
    case 'Pacientes':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3" />
          <path d="M6.5 20c.8-4 2.7-6 5.5-6s4.7 2 5.5 6" />
          <path d="M18.5 8.5h3M20 7v3" />
        </svg>
      )
    case 'Relatórios visuais':
      return (
        <svg {...common}>
          <path d="M6 3h9l3 3v15H6z" />
          <path d="M15 3v4h4M9 11h6M9 15h6" />
        </svg>
      )
    case 'Atlas 3D':
      return (
        <svg {...common}>
          <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" />
          <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
        </svg>
      )
    case 'Analytics':
      return (
        <svg {...common}>
          <path d="M5 20V10M12 20V4M19 20v-7" />
        </svg>
      )
    case 'Equipe':
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="10" r="2.5" />
          <path d="M3.5 20c.7-4 2.5-6 5.5-6s4.8 2 5.5 6M14.5 15c2.8-.4 4.8 1.2 6 4.5" />
        </svg>
      )
    case 'Configurações':
      return (
        <svg {...common}>
          <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
          <circle cx="16" cy="7" r="2" />
          <circle cx="8" cy="17" r="2" />
        </svg>
      )
  }
}

export function ClinicalSidebar({
  active,
  organizationName,
  workspaceName,
  unitName,
  onNavigate,
  onNewReport,
}: Props) {
  return (
    <aside className="clinical-sidebar" aria-label="Navegação clínica">
      <button
        className="clinical-sidebar-brand"
        type="button"
        aria-label="Ir para visão geral"
        onClick={() => onNavigate('Visão geral')}
      >
        <span className="clinical-sidebar-brand-mark" aria-hidden="true">M</span>
        <span className="clinical-sidebar-brand-copy">
          <strong>MedAtlas</strong>
          <small>Comunicação clínica 3D</small>
        </span>
      </button>

      <button
        className="clinical-sidebar-new-report"
        type="button"
        onClick={onNewReport}
      >
        <span className="clinical-sidebar-new-icon" aria-hidden="true">+</span>
        <span>Novo relatório</span>
      </button>

      <nav aria-label="Navegação principal">
        {NAV_GROUPS.map((group) => (
          <section className="sidebar-nav-group" key={group.label}>
            <span className="sidebar-nav-label">{group.label}</span>
            {group.items.map((item) => {
              const label = item === 'Relatórios visuais' ? 'Relatórios' : item
              const isAtlas = item === 'Atlas 3D'

              return (
                <button
                  key={item}
                  type="button"
                  className={[
                    active === item ? 'active' : '',
                    isAtlas ? 'atlas-nav-item' : '',
                  ].filter(Boolean).join(' ')}
                  aria-label={label}
                  aria-current={active === item ? 'page' : undefined}
                  title={label}
                  onClick={() => onNavigate(item)}
                >
                  <span className="clinical-sidebar-nav-icon">
                    <SidebarIcon item={item} />
                  </span>
                  <span className="clinical-sidebar-nav-text">{label}</span>
                  {isAtlas && (
                    <span className="clinical-sidebar-nav-badge" aria-hidden="true">
                      3D
                    </span>
                  )}
                </button>
              )
            })}
          </section>
        ))}
      </nav>

      <footer
        className="clinical-sidebar-context"
        aria-label={`Workspace ativo: ${workspaceName}`}
      >
        <span className="clinical-sidebar-live-dot" aria-hidden="true" />
        <div>
          <small>WORKSPACE ATIVO</small>
          <strong>{workspaceName}</strong>
          <span>
            {organizationName}
            {unitName ? ` · ${unitName}` : ''}
          </span>
        </div>
      </footer>
    </aside>
  )
}
