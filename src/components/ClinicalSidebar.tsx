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
  'Equipe',
  'Analytics',
  'Configurações',
] as const satisfies readonly ClinicalModuleName[]

interface Props {
  active: ClinicalModuleName
  organizationName: string
  workspaceName: string
  unitName?: string
  onNavigate: (module: ClinicalModuleName) => void
}

function SidebarIcon({ item }: { item: ClinicalModuleName }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  switch (item) {
    case 'Visão geral': return <svg {...common}><path d="M4 10.5 12 4l8 6.5V20H4z" /><path d="M9 20v-6h6v6" /></svg>
    case 'Pacientes': return <svg {...common}><circle cx="12" cy="8" r="3" /><path d="M6.5 20c.8-4 2.7-6 5.5-6s4.7 2 5.5 6" /></svg>
    case 'Relatórios visuais': return <svg {...common}><path d="M6 3h9l3 3v15H6z" /><path d="M15 3v4h4M9 11h6M9 15h6" /></svg>
    case 'Atlas 3D': return <svg {...common}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></svg>
    case 'Equipe': return <svg {...common}><circle cx="9" cy="8" r="3" /><circle cx="17" cy="10" r="2.5" /><path d="M3.5 20c.7-4 2.5-6 5.5-6s4.8 2 5.5 6M14.5 15c2.8-.4 4.8 1.2 6 4.5" /></svg>
    case 'Analytics': return <svg {...common}><path d="M5 20V10M12 20V4M19 20v-7" /><path d="M3 20h18" /></svg>
    case 'Configurações': return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5L9 6a7 7 0 0 0-1.7 1L5 6 3 9.5 5.1 11a7 7 0 0 0 0 2L3 14.5 5 18l2.3-1a7 7 0 0 0 1.7 1l.5 3h5l.5-3a7 7 0 0 0 1.7-1L19 18l2-3.5-2.1-1.5c.1-.3.1-.7.1-1z" /></svg>
  }
}

function MedAtlasMark() {
  return (
    <svg viewBox="0 0 42 42" aria-hidden="true">
      <defs><linearGradient id="medatlas-mark-a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" className="clinical-sidebar-logo-stop-start" /><stop offset="1" className="clinical-sidebar-logo-stop-end" /></linearGradient></defs>
      <path d="M20.5 4 6 30.8c-1.2 2.2.4 4.9 2.9 4.9h7.6L25.3 19 20.5 4Z" fill="url(#medatlas-mark-a)" />
      <path d="m23 7.7 13 23.1c1.2 2.2-.4 4.9-2.9 4.9H25l-6.8-12.4L23 7.7Z" className="clinical-sidebar-logo-wing" opacity=".92" />
      <path d="M13.1 35.7h17.5L22 21.1l-8.9 14.6Z" className="clinical-sidebar-logo-core" opacity=".78" />
    </svg>
  )
}

export function ClinicalSidebar({ active, organizationName, workspaceName, unitName, onNavigate }: Props) {
  return (
    <aside className="clinical-sidebar" aria-label="Navegação clínica">
      <button className="clinical-sidebar-brand" type="button" aria-label="Ir para visão geral" onClick={() => onNavigate('Visão geral')}>
        <span className="clinical-sidebar-brand-mark"><MedAtlasMark /></span>
        <span className="clinical-sidebar-brand-copy">
          <strong>Med<span>Atlas</span></strong>
          <small>
            <span className="clinical-sidebar-brand-identity">Conhecimento que cuida</span>
            <span className="clinical-sidebar-brand-descriptor">Clinical 3D Workbench · Medicina para vidas mais longas.</span>
          </small>
        </span>
      </button>

      <nav aria-label="Navegação principal">
        {CLINICAL_NAV_ITEMS.map((item) => {
          const label = item === 'Relatórios visuais' ? 'Laudos' : item
          return (
            <button key={item} type="button" className={active === item ? 'active' : ''} aria-label={label} aria-current={active === item ? 'page' : undefined} onClick={() => onNavigate(item)}>
              <span className="clinical-sidebar-nav-icon"><SidebarIcon item={item} /></span>
              <span className="clinical-sidebar-nav-text">{label}</span>
            </button>
          )
        })}
      </nav>

      <div className="clinical-sidebar-message" aria-hidden="true">
        <span className="clinical-sidebar-message-rule" />
        <strong>Ciência hoje.<br />Mais saúde amanhã.</strong>
      </div>

      <footer className="clinical-sidebar-context">
        <span aria-hidden="true" />
        <div><strong>{organizationName}</strong><small>{workspaceName}</small>{unitName && <p>{unitName}</p>}</div>
      </footer>
    </aside>
  )
}
