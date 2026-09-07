import { useEffect, useReducer, useState } from 'react'
import type { AtlasConcept } from './atlas/types'
import {
  conceptDisplayName,
  loadHumanAtlas,
} from './atlas/source'
import {
  suggestAnatomyFromText,
  type AnatomySuggestion,
} from './clinical/anatomy-suggestions'
import { patientExplanationGenerator } from './clinical/patient-explanation'
import { AtlasViewport } from './components/AtlasViewport'
import { DemoPrivacyBanner } from './components/DemoPrivacyBanner'
import { DemoSettings } from './components/DemoSettings'
import { DocumentsModule } from './components/DocumentsModule'
import { PatientsModule } from './components/PatientsModule'
import { ConsultationsModule } from './components/ConsultationsModule'
import { Overview } from './components/Overview'
import {
  InvalidPatientLink,
  PatientReportPage,
} from './components/PatientReportPage'
import { ReportComposer } from './components/ReportComposer'
import type { ReportExample } from './clinical/demo-scenarios'
import { ReportIntake } from './components/ReportIntake'
import { getClinicalRepository } from './data/repository'
import { createEmptyDemoReport, demoReport } from './domain/demo'
import { reportWorkflowReducer } from './domain/report-workflow'
import type { VisualReport } from './domain/types'

const nav = [
  'Visão geral',
  'Atlas 3D',
  'Pacientes',
  'Consultas',
  'Exames',
  'Relatórios',
  'Configurações',
] as const

type ModuleName = (typeof nav)[number]

const moduleMeta: Record<
  ModuleName,
  { eyebrow: string; title: string }
> = {
  'Visão geral': {
    eyebrow: 'MEDATLAS',
    title: 'Visão geral do fluxo clínico visual.',
  },
  'Atlas 3D': {
    eyebrow: 'ANATOMIA INTERATIVA',
    title: 'Explore e confirme estruturas de referência.',
  },
  Pacientes: {
    eyebrow: 'PACIENTES',
    title: 'Base clínica isolada por organização.',
  },
  Consultas: {
    eyebrow: 'CONSULTAS',
    title: 'Contexto dos atendimentos e relatórios visuais.',
  },
  Exames: {
    eyebrow: 'DOCUMENTOS CLÍNICOS',
    title: 'Origem segura para laudos e exames.',
  },
  Relatórios: {
    eyebrow: 'CONSULTA VISUAL',
    title: 'Transforme o laudo em uma explicação que o paciente entende.',
  },
  Configurações: {
    eyebrow: 'ORGANIZAÇÃO',
    title: 'Equipe, identidade e segurança do ambiente.',
  },
}

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
  const [report, dispatchReport] = useReducer(
    reportWorkflowReducer,
    demoReport,
  )
  const [active, setActive] = useState<ModuleName>('Visão geral')
  const [publishing, setPublishing] = useState(false)
  const [generatingDraft, setGeneratingDraft] = useState(false)
  const [publishError, setPublishError] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [intakeError, setIntakeError] = useState('')
  const [suggestions, setSuggestions] = useState<AnatomySuggestion[]>([])

  const startNewReport = () => {
    dispatchReport({
      type: 'replace',
      report: createEmptyDemoReport(),
    })
    setSuggestions([])
    setIntakeError('')
    setPublishError('')
    setPublishing(false)
    setGeneratingDraft(false)
    setActive('Relatórios')
  }

  const publish = async () => {
    if (
      report.finding.anatomyReviewRequired ||
      report.finding.explanationReviewRequired ||
      publishing ||
      !report.finding.patientExplanation.trim()
    ) {
      return
    }

    setPublishing(true)
    setPublishError('')

    try {
      const published =
        await clinicalData.repository.publishReport(report)
      dispatchReport({
        type: 'published',
        report: published,
      })
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

    dispatchReport({
      type: 'anatomy-confirmed',
      conceptId: concept.id,
      displayName,
    })
    setSuggestions([])
    setPublishError('')
    setIntakeError('')
  }

  const updateSourceText = (value: string) => {
    dispatchReport({
      type: 'source-text-changed',
      value,
    })

    setSuggestions([])
    setIntakeError('')
    setPublishError('')
  }

  const loadExample = (example: ReportExample) => {
    dispatchReport({
      type: 'example-loaded',
      example,
    })

    setSuggestions([])
    setIntakeError('')
    setPublishError('')
    setActive('Relatórios')
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

  const generateExplanationDraft = async () => {
    if (generatingDraft) return

    setGeneratingDraft(true)
    setPublishError('')

    try {
      const generated =
        await patientExplanationGenerator.generate(report)

      dispatchReport({
        type: 'draft-generated',
        draft: generated,
      })
    } catch (error) {
      setPublishError(
        error instanceof Error
          ? error.message
          : 'Não foi possível gerar o rascunho educacional.',
      )
    } finally {
      setGeneratingDraft(false)
    }
  }

  const updateExplanation = (value: string) => {
    if (report.finding.anatomyReviewRequired) return

    dispatchReport({
      type: 'explanation-edited',
      value,
    })
    setPublishError('')
  }

  const approveExplanation = () => {
    if (
      report.finding.anatomyReviewRequired ||
      !report.finding.patientExplanation.trim()
    ) {
      return
    }

    dispatchReport({ type: 'explanation-approved' })
    setPublishError('')
  }

  const reportWorkflow = (
    <>
      <section className="workflow-strip" aria-label="Fluxo do relatório">
        {[
          'Importar laudo',
          'Confirmar anatomia',
          'Revisar explicação',
          'Publicar ao paciente',
        ].map((step, index) => (
          <div
            className={
              (index === 0 && Boolean(report.finding.sourceText.trim())) ||
              (index === 1 && !report.finding.anatomyReviewRequired) ||
              (!report.finding.explanationReviewRequired &&
                !report.finding.anatomyReviewRequired &&
                index === 2) ||
              (report.status === 'published' && index === 3)
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
            anatomyReviewRequired={report.finding.anatomyReviewRequired}
            error={intakeError}
            suggestions={suggestions}
            onSourceTextChange={updateSourceText}
            onLoadExample={loadExample}
            onAnalyze={analyzeSourceText}
            onConfirmSuggestion={(suggestion) =>
              confirmConcept(suggestion.concept)
            }
          />

          <section className="finding-card">
            <div>
              <span className="section-kicker">
                2 · {!report.finding.atlasConceptId
                  ? 'ANATOMIA A CONFIRMAR'
                  : report.finding.anatomyReviewRequired
                    ? 'ÚLTIMA ANATOMIA SELECIONADA'
                    : 'ANATOMIA CONFIRMADA'}
              </span>
              <h2>{report.finding.anatomicalStructure}</h2>
              <p>
                {!report.finding.atlasConceptId
                  ? 'Nenhuma estrutura foi confirmada. Analise o texto ou use a busca do atlas para selecionar uma referência.'
                  : report.finding.anatomyReviewRequired
                    ? 'O texto foi alterado. Confirme novamente esta estrutura ou escolha outra sugestão antes de continuar.'
                    : 'Estrutura confirmada para o texto atual e usada no relatório do paciente.'}
              </p>
            </div>

            <div className="finding-match">
              <span>
                {!report.finding.atlasConceptId
                  ? 'Status'
                  : report.finding.anatomyReviewRequired
                    ? 'Status'
                    : 'Referência do atlas'}
              </span>
              <strong>
                {!report.finding.atlasConceptId
                  ? 'Aguardando seleção'
                  : report.finding.anatomyReviewRequired
                    ? 'Reconfirmação necessária'
                    : report.finding.atlasConceptId}
              </strong>
              <small>
                {report.finding.atlasConceptId
                  ? `${report.finding.atlasRef} · ${report.finding.atlasConceptId}`
                  : `${report.finding.atlasRef} · nenhuma referência confirmada`}
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
          publishing={publishing}
          generatingDraft={generatingDraft}
          publishError={publishError}
          onPublish={publish}
          onGenerateDraft={generateExplanationDraft}
          onUpdateExplanation={updateExplanation}
          onApproveExplanation={approveExplanation}
        />
      </section>
    </>
  )

  const renderModule = () => {
    switch (active) {
      case 'Visão geral':
        return (
          <Overview
            report={report}
            onNewReport={startNewReport}
            onOpenReport={() => setActive('Relatórios')}
            onOpenAtlas={() => setActive('Atlas 3D')}
          />
        )

      case 'Atlas 3D':
        return (
          <section className="standalone-atlas">
            <div className="module-intro-card">
              <span className="section-kicker">EXPLORAÇÃO ANATÔMICA</span>
              <h2>Atlas de referência conectado ao relatório.</h2>
              <p>
                Pesquise e pré-visualize conceitos BodyParts3D/FMA. Uma seleção
                só altera o relatório quando o profissional usa
                “Confirmar no relatório”.
              </p>
            </div>
            <AtlasViewport
              selected={report.finding.anatomicalStructure}
              conceptId={report.finding.atlasConceptId}
              onConfirmConcept={confirmConcept}
            />
          </section>
        )

      case 'Relatórios':
        return reportWorkflow

      case 'Pacientes':
        return (
          <PatientsModule
            report={report}
            onOpenReport={() => setActive('Relatórios')}
            onOpenAtlas={() => setActive('Atlas 3D')}
          />
        )

      case 'Consultas':
        return (
          <ConsultationsModule
            report={report}
            onOpenReport={() => setActive('Relatórios')}
            onNewReport={startNewReport}
          />
        )

      case 'Exames':
        return (
          <DocumentsModule
            report={report}
            onStartImport={startNewReport}
          />
        )

      case 'Configurações':
        return <DemoSettings onNewReport={startNewReport} />
    }
  }

  const meta = moduleMeta[active]

  return (
    <div className="app-shell">
      <a className="skip-link" href="#clinical-workspace">
        Ir para o conteúdo principal
      </a>
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
              aria-label={item}
              aria-current={active === item ? 'page' : undefined}
              title={item}
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

      <main className="workspace" id="clinical-workspace" tabIndex={-1}>
        <header className="topbar">
          <div>
            <span className="eyebrow">{meta.eyebrow}</span>
            <h1>{meta.title}</h1>
          </div>

          <div className="doctor-chip">
            <span>DR</span>
            <div>
              <strong>Dr. Carlos Mendes</strong>
              <small>Ortopedia · demonstração</small>
            </div>
          </div>
        </header>

        <DemoPrivacyBanner />

        {renderModule()}
      </main>
    </div>
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
