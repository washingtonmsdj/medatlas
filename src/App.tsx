import { useState } from 'react'
import { AtlasViewport } from './components/AtlasViewport'
import { ReportComposer } from './components/ReportComposer'
import { demoReport } from './domain/demo'
import type { VisualReport } from './domain/types'

const nav = [
  'Visão geral',
  'Atlas 3D',
  'Pacientes',
  'Consultas',
  'Exames',
  'Relatórios',
  'Configurações',
]

function App() {
  const [report, setReport] = useState<VisualReport>(demoReport)
  const [active, setActive] = useState('Relatórios')

  const publish = () => {
    setReport((current) => ({
      ...current,
      status: 'published',
      shareSlug: 'demo-L4L5-7F3K2',
    }))
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">M</span>
          <span>MedAtlas</span>
        </div>
        <p className="brand-subtitle">Consulta visual com IA</p>

        <nav aria-label="Navegação principal">
          {nav.map((item) => (
            <button
              key={item}
              type="button"
              className={active === item ? 'active' : ''}
              onClick={() => setActive(item)}
            >
              <span className="nav-dot" />
              <span>{item}</span>
            </button>
          ))}
        </nav>

        <div className="clinic-card">
          <span className="eyebrow">AMBIENTE DEMO</span>
          <strong>Clínica Horizonte</strong>
          <small>Conteúdo fictício para desenvolvimento</small>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">CONSULTA VISUAL</span>
            <h1>Transforme o laudo em uma explicação que o paciente entende.</h1>
          </div>

          <div className="doctor-chip">
            <span>DR</span>
            <div>
              <strong>Dr. Carlos Mendes</strong>
              <small>Ortopedia · demonstração</small>
            </div>
          </div>
        </header>

        <section className="workflow-strip" aria-label="Fluxo do relatório">
          {[
            'Importar laudo',
            'Confirmar anatomia',
            'Revisar explicação',
            'Publicar ao paciente',
          ].map((step, index) => (
            <div
              className={index < 3 || report.status === 'published' ? 'done' : ''}
              key={step}
            >
              <span>{index + 1}</span>
              <p>{step}</p>
            </div>
          ))}
        </section>

        <section className="content-grid">
          <div className="left-stack">
            <section className="finding-card">
              <div>
                <span className="section-kicker">EXAME IMPORTADO</span>
                <h2>Ressonância da coluna lombar</h2>
                <p>{report.finding.sourceText}</p>
              </div>

              <div className="finding-match">
                <span>Estrutura sugerida</span>
                <strong>{report.finding.anatomicalStructure}</strong>
                <small>O profissional confirma antes da publicação.</small>
              </div>
            </section>

            <AtlasViewport selected={report.finding.anatomicalStructure} />
          </div>

          <ReportComposer report={report} onPublish={publish} />
        </section>
      </section>
    </main>
  )
}

export default App
