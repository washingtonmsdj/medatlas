import { useState } from 'react'
import type { AtlasConcept } from './atlas/types'
import { conceptDisplayName } from './atlas/source'
import { AtlasViewport } from './components/AtlasViewport'
import {
  InvalidPatientLink,
  PatientReportPage,
} from './components/PatientReportPage'
import { ReportComposer } from './components/ReportComposer'
import { demoReport } from './domain/demo'
import {
  persistPublishedDemoReport,
  readPublishedDemoReport,
} from './domain/demo-storage'
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

function PatientRoute({ slug }: { slug: string }) {
  const report = readPublishedDemoReport(slug)

  return report ? (
    <PatientReportPage report={report} />
  ) : (
    <InvalidPatientLink />
  )
}

function ClinicianApp() {
  const [report, setReport] = useState<VisualReport>(demoReport)
  const [active, setActive] = useState('Relatórios')

  const publish = () => {
    setReport((current) => {
      if (current.finding.explanationReviewRequired) return current

      const published: VisualReport = {
        ...current,
        status: 'published',
        shareSlug: 'demo-7F3K2',
      }

      persistPublishedDemoReport(published)
      return published
    })
  }

  const confirmConcept = (concept: AtlasConcept) => {
    const displayName = conceptDisplayName(concept)

    setReport((current) => ({
      ...current,
      status: 'draft',
      shareSlug: undefined,
      finding: {
        ...current.finding,
        anatomicalStructure: displayName,
        atlasConceptId: concept.id,
        patientExplanation:
          `A estrutura anatômica confirmada é ${displayName}. Revise esta explicação para relacioná-la corretamente ao laudo antes de compartilhar com o paciente.`,
        explanationReviewRequired: true,
      },
    }))
  }

  const updateExplanation = (value: string) => {
    setReport((current) => ({
      ...current,
      status: 'draft',
      shareSlug: undefined,
      finding: {
        ...current.finding,
        patientExplanation: value,
        explanationReviewRequired: true,
      },
    }))
  }

  const approveExplanation = () => {
    setReport((current) => ({
      ...current,
      status: 'clinician_review',
      finding: {
        ...current.finding,
        explanationReviewRequired: false,
      },
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
              className={
                index < 2 ||
                (!report.finding.explanationReviewRequired && index === 2) ||
                report.status === 'published'
                  ? 'done'
                  : ''
              }
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
                <span>Estrutura confirmada no atlas</span>
                <strong>{report.finding.anatomicalStructure}</strong>
                <small>
                  {report.finding.atlasRef} · {report.finding.atlasConceptId}
                </small>
              </div>
            </section>

            <AtlasViewport
              selected={report.finding.anatomicalStructure}
              conceptId={report.finding.atlasConceptId}
              onConfirmConcept={confirmConcept}
            />
          </div>

          <ReportComposer
            report={report}
            onPublish={publish}
            onUpdateExplanation={updateExplanation}
            onApproveExplanation={approveExplanation}
          />
        </section>
      </section>
    </main>
  )
}

function App() {
  const querySlug = new URLSearchParams(window.location.search).get('patient')
  const patientMatch = window.location.pathname.match(/^\/p\/([^/]+)\/?$/)
  const patientSlug = querySlug ?? patientMatch?.[1] ?? null

  if (patientSlug) {
    return <PatientRoute slug={decodeURIComponent(patientSlug)} />
  }

  return <ClinicianApp />
}

export default App
