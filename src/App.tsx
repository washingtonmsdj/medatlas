import { useEffect, useState } from 'react'
import type { AtlasConcept } from './atlas/types'
import {
  conceptDisplayName,
  loadHumanAtlas,
} from './atlas/source'
import {
  suggestAnatomyFromText,
  type AnatomySuggestion,
} from './clinical/anatomy-suggestions'
import { AtlasViewport } from './components/AtlasViewport'
import {
  InvalidPatientLink,
  PatientReportPage,
} from './components/PatientReportPage'
import { ReportComposer } from './components/ReportComposer'
import { ReportIntake } from './components/ReportIntake'
import { getClinicalRepository } from './data/repository'
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

const clinicalData = getClinicalRepository()

function PatientRoute({ slug }: { slug: string }) {
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'missing' }
    | { status: 'ready'; report: VisualReport }
  >({ status: 'loading' })

  useEffect(() => {
    let active = true

    void clinicalData.repository
      .resolvePatientShare(slug)
      .then((report) => {
        if (!active) return
        setState(
          report
            ? { status: 'ready', report }
            : { status: 'missing' },
        )
      })
      .catch(() => {
        if (active) setState({ status: 'missing' })
      })

    return () => {
      active = false
    }
  }, [slug])

  if (state.status === 'loading') {
    return (
      <main className="invalid-share">
        <div className="brand">
          <span className="brand-mark">M</span>
          <span>MedAtlas</span>
        </div>
        <h1>Preparando seu relatório visual…</h1>
        <p>Validando o link e carregando a experiência anatômica.</p>
      </main>
    )
  }

  return state.status === 'ready' ? (
    <PatientReportPage report={state.report} />
  ) : (
    <InvalidPatientLink />
  )
}

function ClinicianApp() {
  const [report, setReport] = useState<VisualReport>(demoReport)
  const [active, setActive] = useState('Relatórios')
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [intakeError, setIntakeError] = useState('')
  const [suggestions, setSuggestions] = useState<AnatomySuggestion[]>([])

  const invalidatePublishedState = (
    current: VisualReport,
  ): VisualReport => ({
    ...current,
    status: 'draft',
    shareSlug: undefined,
  })

  const publish = async () => {
    if (report.finding.explanationReviewRequired || publishing) return

    setPublishing(true)
    setPublishError('')

    try {
      const published =
        await clinicalData.repository.publishReport(report)
      setReport(published)
    } catch (error) {
      setPublishError(
        error instanceof Error
          ? error.message
          : 'Não foi possível publicar o relatório.',
      )
    } finally {
      setPublishing(false)
    }
  }

  const confirmConcept = (concept: AtlasConcept) => {
    const displayName = conceptDisplayName(concept)

    setReport((current) => {
      const draft = invalidatePublishedState(current)

      return {
        ...draft,
        finding: {
          ...draft.finding,
          anatomicalStructure: displayName,
          atlasConceptId: concept.id,
          patientExplanation:
            `A estrutura anatômica confirmada é ${displayName}. Revise esta explicação para relacioná-la corretamente ao laudo antes de compartilhar com o paciente.`,
          explanationReviewRequired: true,
        },
      }
    })
    setSuggestions([])
    setPublishError('')
    setIntakeError('')
  }

  const updateSourceText = (value: string) => {
    setReport((current) => {
      const draft = invalidatePublishedState(current)

      return {
        ...draft,
        finding: {
          ...draft.finding,
          sourceText: value,
          explanationReviewRequired: true,
        },
      }
    })

    setSuggestions([])
    setIntakeError('')
    setPublishError('')
  }

  const analyzeSourceText = async () => {
    const sourceText = report.finding.sourceText.trim()

    if (sourceText.length < 3 || analyzing) return

    setAnalyzing(true)
    setIntakeError('')

    try {
      const atlas = await loadHumanAtlas()
      const nextSuggestions = suggestAnatomyFromText(
        atlas,
        sourceText,
      )

      setSuggestions(nextSuggestions)

      if (nextSuggestions.length === 0) {
        setIntakeError(
          'Nenhuma correspondência segura foi encontrada. Use a busca do atlas para escolher a estrutura manualmente.',
        )
      }
    } catch (error) {
      setIntakeError(
        error instanceof Error
          ? error.message
          : 'Não foi possível analisar as referências anatômicas.',
      )
    } finally {
      setAnalyzing(false)
    }
  }

  const updateExplanation = (value: string) => {
    setReport((current) => {
      const draft = invalidatePublishedState(current)

      return {
        ...draft,
        finding: {
          ...draft.finding,
          patientExplanation: value,
          explanationReviewRequired: true,
        },
      }
    })
    setPublishError('')
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
    setPublishError('')
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
          <small>
            {clinicalData.descriptor.label} · dados sintéticos
          </small>
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
                index === 0 ||
                (index === 1 && Boolean(report.finding.atlasConceptId)) ||
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
            <ReportIntake
              sourceText={report.finding.sourceText}
              analyzing={analyzing}
              error={intakeError}
              suggestions={suggestions}
              onSourceTextChange={updateSourceText}
              onAnalyze={analyzeSourceText}
              onConfirmSuggestion={(suggestion) =>
                confirmConcept(suggestion.concept)
              }
            />

            <section className="finding-card">
              <div>
                <span className="section-kicker">2 · ANATOMIA CONFIRMADA</span>
                <h2>{report.finding.anatomicalStructure}</h2>
                <p>
                  Estrutura que será usada na visualização e no relatório do
                  paciente.
                </p>
              </div>

              <div className="finding-match">
                <span>Referência do atlas</span>
                <strong>{report.finding.atlasConceptId}</strong>
                <small>{report.finding.atlasRef}</small>
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
            publishing={publishing}
            publishError={publishError}
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
